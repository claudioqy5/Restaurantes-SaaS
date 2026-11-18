using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Hubs;
using Restaurante.Api.Modelos;
using Restaurante.Api.Servicios;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/cajas-facturacion")]
[Authorize]
public class CajasYFacturacionControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;
    private readonly IHubContext<MesasHub> _hubMesas;
    private readonly IServicioApisPeru _servicioApisPeru;

    public CajasYFacturacionControlador(
        RestauranteDbContext db,
        IInquilinoProveedor inquilinoProveedor,
        IHubContext<MesasHub> hubMesas,
        IServicioApisPeru servicioApisPeru)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
        _hubMesas = hubMesas;
        _servicioApisPeru = servicioApisPeru;
    }

    [HttpGet("turnos/activo")]
    public async Task<ActionResult<object>> ObtenerTurnoActivo([FromQuery] Guid? sucursalId)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var usuarioId = _inquilinoProveedor.ObtenerUsuarioId();

        var sucursalFiltro = sucursalId ?? _inquilinoProveedor.ObtenerSucursalId();

        var query = _db.TurnosCajas
            .Where(t => t.InquilinoId == inquilinoId && !t.EstaCerrado)
            .Include(t => t.Caja)
            .Include(t => t.Usuario)
            .AsQueryable();

        if (sucursalFiltro.HasValue)
        {
            query = query.Where(t => t.Caja.SucursalId == sucursalFiltro.Value);
        }

        var turno = await query
            .OrderByDescending(t => t.FechaApertura)
            .Select(t => new
            {
                t.Id,
                t.CajaId,
                CajaNombre = t.Caja.Nombre,
                t.UsuarioId,
                CajeroNombre = $"{t.Usuario.Nombres} {t.Usuario.Apellidos}",
                t.FechaApertura,
                t.MontoApertura,
                TotalVentas = t.Comprobantes.Sum(c => c.Total),
                CantidadComprobantes = t.Comprobantes.Count
            })
            .FirstOrDefaultAsync();

        if (turno == null) return NotFound(new { mensaje = "No hay ningún turno de caja abierto actualmente." });

        return Ok(turno);
    }

    [HttpPost("turnos/apertura")]
    public async Task<ActionResult<object>> AperturarTurno([FromBody] AperturaTurnoCajaDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var cajeroId = _inquilinoProveedor.ObtenerUsuarioId();

        if (inquilinoId == null || cajeroId == null) return Unauthorized();

        // Si no se envió CajaId válida, seleccionar la primera caja de la sucursal o del inquilino
        var cajaId = peticion.CajaId;
        if (cajaId == Guid.Empty)
        {
            var primeraCaja = await _db.Cajas.FirstOrDefaultAsync(c => c.InquilinoId == inquilinoId && c.Activo);
            if (primeraCaja == null)
            {
                return BadRequest(new { mensaje = "No existe ninguna caja configurada para este restaurante." });
            }
            cajaId = primeraCaja.Id;
        }

        var turnoAbierto = await _db.TurnosCajas
            .AnyAsync(t => t.InquilinoId == inquilinoId && t.CajaId == cajaId && !t.EstaCerrado);

        if (turnoAbierto)
        {
            return BadRequest(new { mensaje = "Ya existe un turno abierto para esta caja." });
        }

        var nuevoTurno = new TurnoCaja
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            CajaId = cajaId,
            UsuarioId = cajeroId.Value,
            MontoApertura = peticion.MontoApertura,
            FechaApertura = DateTime.UtcNow,
            EstaCerrado = false
        };

        _db.TurnosCajas.Add(nuevoTurno);
        await _db.SaveChangesAsync();

        return Ok(new { mensaje = "Turno de caja aperturado correctamente.", turnoId = nuevoTurno.Id });
    }

    [HttpPost("turnos/cierre")]
    public async Task<ActionResult<object>> CerrarTurno([FromBody] CierreTurnoCajaDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var turno = await _db.TurnosCajas
            .Include(t => t.Comprobantes)
            .FirstOrDefaultAsync(t => t.Id == peticion.TurnoCajaId && t.InquilinoId == inquilinoId);

        if (turno == null) return NotFound(new { mensaje = "Turno no encontrado." });
        if (turno.EstaCerrado) return BadRequest(new { mensaje = "El turno ya se encuentra cerrado." });

        var totalVentasSistema = turno.Comprobantes.Sum(c => c.Total);
        var totalEsperado = turno.MontoApertura + totalVentasSistema;

        turno.FechaCierre = DateTime.UtcNow;
        turno.MontoCierreDeclarado = peticion.MontoCierreDeclarado;
        turno.MontoCierreSistema = totalEsperado;
        turno.Diferencia = peticion.MontoCierreDeclarado - totalEsperado;
        turno.EstaCerrado = true;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Cierre de turno Z/X completado.",
            totalApertura = turno.MontoApertura,
            totalVendido = totalVentasSistema,
            totalEsperado,
            totalDeclarado = turno.MontoCierreDeclarado,
            diferencia = turno.Diferencia
        });
    }

    [HttpPost("comprobantes")]
    public async Task<ActionResult<object>> EmitirComprobante([FromBody] EmitirComprobanteDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var cajeroId = _inquilinoProveedor.ObtenerUsuarioId();

        if (inquilinoId == null || cajeroId == null) return Unauthorized();

        var comanda = await _db.Comandas
            .Include(c => c.Mesa)
            .Include(c => c.Sucursal)
            .Include(c => c.Detalles)
                .ThenInclude(d => d.Plato)
            .FirstOrDefaultAsync(c => c.Id == peticion.ComandaId && c.InquilinoId == inquilinoId);

        if (comanda == null) return NotFound(new { mensaje = "Comanda no encontrada." });
        if (comanda.Estado != EstadoComanda.Abierta) return BadRequest(new { mensaje = "La comanda ya fue cobrada o cancelada." });

        var inquilino = await _db.Inquilinos.FirstOrDefaultAsync(i => i.Id == inquilinoId);
        if (inquilino == null) return NotFound(new { mensaje = "Inquilino no encontrado." });

        // Determinar Serie y Correlativo
        string serie = peticion.TipoComprobante switch
        {
            TipoComprobanteSunat.Factura => "F001",
            TipoComprobanteSunat.Boleta => "B001",
            _ => "NV01"
        };

        var ultimoCorrelativo = await _db.ComprobantesPago
            .Where(cp => cp.InquilinoId == inquilinoId && cp.Serie == serie)
            .MaxAsync(cp => (int?)cp.Correlativo) ?? 0;

        int nuevoCorrelativo = ultimoCorrelativo + 1;

        // Cálculos SUNAT UBL 2.1 (Tasa IGV 18%)
        decimal total = comanda.Total;
        decimal gravadas = Math.Round(total / 1.18m, 2);
        decimal igv = total - gravadas;

        var comprobante = new ComprobantePago
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            ComandaId = comanda.Id,
            TurnoCajaId = peticion.TurnoCajaId,
            UsuarioId = cajeroId.Value,
            TipoComprobante = peticion.TipoComprobante,
            Serie = serie,
            Correlativo = nuevoCorrelativo,
            TipoDocumentoIdentidad = peticion.TipoDocumentoIdentidad,
            NumeroDocumentoIdentidad = peticion.NumeroDocumentoIdentidad,
            RazonSocialCliente = peticion.RazonSocialCliente,
            Gravadas = gravadas,
            Igv = igv,
            Total = total,
            MetodoPago = peticion.MetodoPago,
            FechaCreacion = DateTime.UtcNow
        };

        // 1. Invocar el Servicio de APIs Perú para la emisión electrónica oficial
        var resultadoSunat = await _servicioApisPeru.EmitirComprobanteAsync(
            comprobante,
            inquilino,
            comanda.Sucursal,
            comanda.Detalles.ToList()
        );

        comprobante.SunatEstado = resultadoSunat.SunatEstado ?? (resultadoSunat.Exito ? "ACEPTADO" : "ERROR");
        comprobante.SunatMensajeRespuesta = resultadoSunat.Mensaje;
        comprobante.SunatXmlUrl = resultadoSunat.XmlUrl;
        comprobante.SunatPdfUrl = resultadoSunat.PdfUrl;
        comprobante.SunatCdrUrl = resultadoSunat.CdrUrl;
        comprobante.SunatHash = resultadoSunat.Hash;

        _db.ComprobantesPago.Add(comprobante);

        // 2. Cerrar la comanda y liberar la mesa
        comanda.Estado = EstadoComanda.Cerrada;
        comanda.Mesa.Estado = EstadoMesa.Libre;

        await _db.SaveChangesAsync();

        // 3. Notificar a todos los clientes del salón que la mesa quedó Libre vía SignalR
        await _hubMesas.Clients.Group($"inquilino_{inquilinoId}").SendAsync("MesaActualizada", new
        {
            mesaId = comanda.Mesa.Id,
            nuevoEstado = EstadoMesa.Libre
        });

        return Ok(new
        {
            mensaje = resultadoSunat.Mensaje,
            comprobanteId = comprobante.Id,
            comprobanteNumero = $"{serie}-{nuevoCorrelativo:D8}",
            total = comprobante.Total,
            cajeroId = cajeroId.Value,
            sunatEstado = comprobante.SunatEstado,
            sunatHash = comprobante.SunatHash,
            sunatXmlUrl = comprobante.SunatXmlUrl,
            sunatPdfUrl = comprobante.SunatPdfUrl,
            sunatCdrUrl = comprobante.SunatCdrUrl
        });
    }

    [HttpGet("comprobantes/recientes")]
    public async Task<ActionResult<IEnumerable<ComprobanteResumenDto>>> ObtenerComprobantesRecientes()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var comprobantes = await _db.ComprobantesPago
            .Where(cp => cp.InquilinoId == inquilinoId)
            .Include(cp => cp.Usuario)
            .Include(cp => cp.Comanda)
                .ThenInclude(c => c.Mesa)
            .OrderByDescending(cp => cp.FechaCreacion)
            .Take(50)
            .Select(cp => new ComprobanteResumenDto(
                cp.Id,
                cp.Serie,
                cp.Correlativo,
                cp.TipoComprobante,
                cp.NumeroDocumentoIdentidad,
                cp.RazonSocialCliente,
                cp.Total,
                cp.MetodoPago,
                cp.SunatEstado,
                cp.SunatMensajeRespuesta,
                cp.SunatXmlUrl,
                cp.SunatPdfUrl,
                cp.SunatCdrUrl,
                cp.SunatHash,
                cp.FechaCreacion,
                $"{cp.Usuario.Nombres} {cp.Usuario.Apellidos}",
                cp.Comanda.Mesa.CodigoMesa
            ))
            .ToListAsync();

        return Ok(comprobantes);
    }

    [HttpGet("configuracion-sunat")]
    public async Task<ActionResult<ConfiguracionSunatDto>> ObtenerConfiguracionSunat()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var inq = await _db.Inquilinos.FirstOrDefaultAsync(i => i.Id == inquilinoId);
        if (inq == null) return NotFound();

        return Ok(new ConfiguracionSunatDto(
            inq.EmisionElectronicaActiva,
            inq.ApisPeruToken,
            inq.Ubigeo,
            inq.Departamento,
            inq.Provincia,
            inq.Distrito
        ));
    }

    [HttpPut("configuracion-sunat")]
    [Authorize(Roles = "AdminRestaurante,SuperAdmin")]
    public async Task<ActionResult> ActualizarConfiguracionSunat([FromBody] ConfiguracionSunatDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var inq = await _db.Inquilinos.FirstOrDefaultAsync(i => i.Id == inquilinoId);
        if (inq == null) return NotFound();

        inq.EmisionElectronicaActiva = peticion.EmisionElectronicaActiva;
        inq.ApisPeruToken = peticion.ApisPeruToken?.Trim();
        inq.Ubigeo = peticion.Ubigeo?.Trim() ?? "150101";
        inq.Departamento = peticion.Departamento?.Trim() ?? "LIMA";
        inq.Provincia = peticion.Provincia?.Trim() ?? "LIMA";
        inq.Distrito = peticion.Distrito?.Trim() ?? "LIMA";

        await _db.SaveChangesAsync();

        return Ok(new { mensaje = "Configuración fiscal y credenciales de APIs Perú actualizadas correctamente." });
    }

    [HttpGet("ventas-por-usuario")]
    public async Task<ActionResult<IEnumerable<object>>> ObtenerVentasPorUsuario([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var query = _db.ComprobantesPago
            .Where(cp => cp.InquilinoId == inquilinoId)
            .Include(cp => cp.Usuario)
            .AsQueryable();

        if (fechaInicio.HasValue) query = query.Where(cp => cp.FechaCreacion >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(cp => cp.FechaCreacion <= fechaFin.Value);

        var ventasAgrupadas = await query
            .GroupBy(cp => new { cp.UsuarioId, cp.Usuario.Nombres, cp.Usuario.Apellidos, cp.Usuario.Rol })
            .Select(g => new
            {
                UsuarioId = g.Key.UsuarioId,
                Empleado = $"{g.Key.Nombres} {g.Key.Apellidos}",
                Rol = g.Key.Rol.ToString(),
                CantidadComprobantesEmitidos = g.Count(),
                TotalRecaudado = g.Sum(cp => cp.Total)
            })
            .OrderByDescending(x => x.TotalRecaudado)
            .ToListAsync();

        return Ok(ventasAgrupadas);
    }
}
