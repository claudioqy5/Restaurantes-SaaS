using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Hubs;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/comandas")]
[Authorize]
public class ComandasControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;
    private readonly IHubContext<MesasHub> _hubMesas;
    private readonly IHubContext<CocinaHub> _hubCocina;

    public ComandasControlador(
        RestauranteDbContext db,
        IInquilinoProveedor inquilinoProveedor,
        IHubContext<MesasHub> hubMesas,
        IHubContext<CocinaHub> hubCocina)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
        _hubMesas = hubMesas;
        _hubCocina = hubCocina;
    }

    [HttpGet("activas")]
    public async Task<ActionResult<IEnumerable<ComandaResumenDto>>> ObtenerComandasActivas()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var comandas = await _db.Comandas
            .Where(c => c.InquilinoId == inquilinoId && c.Estado == EstadoComanda.Abierta)
            .Include(c => c.Mesa)
                .ThenInclude(m => m.Zona)
            .Include(c => c.Usuario)
            .Include(c => c.Detalles)
                .ThenInclude(d => d.Plato)
            .OrderByDescending(c => c.FechaCreacion)
            .Select(c => new ComandaResumenDto(
                c.Id,
                c.MesaId,
                c.Mesa.CodigoMesa,
                c.Mesa.Zona.Nombre,
                c.UsuarioId,
                $"{c.Usuario.Nombres} {c.Usuario.Apellidos}",
                c.NumeroComandaDia,
                c.Estado,
                c.Total,
                c.FechaCreacion,
                c.Detalles.Select(d => new DetalleComandaResumenDto(
                    d.Id,
                    d.PlatoId,
                    d.Plato.Nombre,
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.Subtotal,
                    d.NotasCocina,
                    d.EstadoKds,
                    d.FechaInicioCoccion,
                    d.FechaPlatoListo
                )).ToList()
            ))
            .ToListAsync();

        return Ok(comandas);
    }

    [HttpPost]
    public async Task<ActionResult<object>> CrearComanda([FromBody] CrearComandaDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var meseroId = _inquilinoProveedor.ObtenerUsuarioId();

        if (inquilinoId == null || meseroId == null) return Unauthorized();

        var mesa = await _db.Mesas
            .Include(m => m.Zona)
            .FirstOrDefaultAsync(m => m.Id == peticion.MesaId && m.InquilinoId == inquilinoId);

        if (mesa == null) return NotFound(new { mensaje = "Mesa no encontrada." });

        if (!peticion.Items.Any())
        {
            return BadRequest(new { mensaje = "Debe enviar al menos un plato en la comanda." });
        }

        // Obtener correlativo del día
        var fechaHoy = DateTime.UtcNow.Date;
        var conteoComandasHoy = await _db.Comandas
            .CountAsync(c => c.InquilinoId == inquilinoId && c.FechaCreacion >= fechaHoy);

        var nuevaComanda = new Comanda
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            SucursalId = mesa.Zona.SucursalId, // Sucursal de la mesa
            MesaId = mesa.Id,
            UsuarioId = meseroId.Value, // Trazabilidad del Mesero
            NumeroComandaDia = conteoComandasHoy + 1,
            Estado = EstadoComanda.Abierta,
            Total = 0,
            FechaCreacion = DateTime.UtcNow
        };

        decimal totalComanda = 0;
        var ticketsParaCocina = new List<object>();

        foreach (var item in peticion.Items)
        {
            var plato = await _db.Platos.FirstOrDefaultAsync(p => p.Id == item.PlatoId && p.InquilinoId == inquilinoId);
            if (plato == null) continue;

            var subtotal = plato.PrecioVenta * item.Cantidad;
            totalComanda += subtotal;

            var detalle = new DetalleComanda
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoId.Value,
                ComandaId = nuevaComanda.Id,
                PlatoId = plato.Id,
                Cantidad = item.Cantidad,
                PrecioUnitario = plato.PrecioVenta,
                Subtotal = subtotal,
                NotasCocina = item.NotasCocina,
                EstadoKds = EstadoKDS.Pendiente,
                FechaCreacion = DateTime.UtcNow
            };

            nuevaComanda.Detalles.Add(detalle);

            ticketsParaCocina.Add(new
            {
                detalleComandaId = detalle.Id,
                comandaId = nuevaComanda.Id,
                numeroComandaDia = nuevaComanda.NumeroComandaDia,
                codigoMesa = mesa.CodigoMesa,
                platoNombre = plato.Nombre,
                cantidad = detalle.Cantidad,
                notasCocina = detalle.NotasCocina,
                estadoKds = detalle.EstadoKds,
                fechaCreacion = detalle.FechaCreacion,
                minutosTranscurridos = 0
            });
        }

        nuevaComanda.Total = totalComanda;
        _db.Comandas.Add(nuevaComanda);

        // Actualizar estado de la mesa a Ocupada
        mesa.Estado = EstadoMesa.Ocupada;
        await _db.SaveChangesAsync();

        // 1. Notificar a Salón (Mesas) en tiempo real
        await _hubMesas.Clients.Group($"inquilino_{inquilinoId}").SendAsync("MesaActualizada", new
        {
            mesaId = mesa.Id,
            nuevoEstado = mesa.Estado,
            comandaId = nuevaComanda.Id,
            total = nuevaComanda.Total
        });

        // 2. Notificar a Cocina (KDS) en tiempo real
        await _hubCocina.Clients.Group($"cocina_{inquilinoId}").SendAsync("NuevosTicketsCocina", ticketsParaCocina);

        return CreatedAtAction(nameof(ObtenerComandasActivas), new
        {
            mensaje = "Comanda creada con éxito.",
            comandaId = nuevaComanda.Id,
            numeroComanda = nuevaComanda.NumeroComandaDia,
            total = nuevaComanda.Total
        });
    }
}
