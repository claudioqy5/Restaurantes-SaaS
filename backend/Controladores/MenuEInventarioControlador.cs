using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/menu-inventario")]
[Authorize]
public class MenuEInventarioControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;

    public MenuEInventarioControlador(RestauranteDbContext db, IInquilinoProveedor inquilinoProveedor)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
    }

    [HttpGet("categorias")]
    public async Task<ActionResult<IEnumerable<object>>> ObtenerCategorias()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var categorias = await _db.CategoriasPlatos
            .Where(c => c.InquilinoId == inquilinoId && c.Activo)
            .OrderBy(c => c.OrdenVisual)
            .Select(c => new
            {
                c.Id,
                c.Nombre,
                c.Icono,
                TotalPlatos = c.Platos.Count(p => p.Activo)
            })
            .ToListAsync();

        return Ok(categorias);
    }

    [HttpGet("platos")]
    public async Task<ActionResult<IEnumerable<PlatoDto>>> ObtenerPlatos([FromQuery] Guid? categoriaId)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var query = _db.Platos
            .Where(p => p.InquilinoId == inquilinoId && p.Activo)
            .Include(p => p.CategoriaPlato)
            .Include(p => p.Receta)
            .AsQueryable();

        if (categoriaId.HasValue)
        {
            query = query.Where(p => p.CategoriaPlatoId == categoriaId.Value);
        }

        var platos = await query
            .OrderBy(p => p.Nombre)
            .Select(p => new PlatoDto(
                p.Id,
                p.CategoriaPlatoId,
                p.CategoriaPlato.Nombre,
                p.Codigo,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.CostoEstimado,
                p.EstaDisponible,
                p.Receta != null
            ))
            .ToListAsync();

        return Ok(platos);
    }

    [HttpGet("insumos")]
    public async Task<ActionResult<IEnumerable<InsumoDto>>> ObtenerInsumos()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var insumos = await _db.Insumos
            .Where(i => i.InquilinoId == inquilinoId && i.Activo)
            .Include(i => i.UnidadMedida)
            .OrderBy(i => i.Nombre)
            .Select(i => new InsumoDto(
                i.Id,
                i.CodigoInterno,
                i.Nombre,
                i.UnidadMedidaId,
                i.UnidadMedida.Codigo,
                i.StockActual,
                i.StockMinimo,
                i.CostoPromedioUnitario
            ))
            .ToListAsync();

        return Ok(insumos);
    }

    [HttpGet("unidades-medida")]
    public async Task<ActionResult<IEnumerable<UnidadMedidaDto>>> ObtenerUnidadesMedida()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var unidades = await _db.UnidadesMedida
            .Where(u => u.InquilinoId == inquilinoId && u.Activo)
            .OrderBy(u => u.Codigo)
            .Select(u => new UnidadMedidaDto(u.Id, u.Codigo, u.Nombre))
            .ToListAsync();

        return Ok(unidades);
    }

    [HttpGet("siguiente-codigo")]
    public async Task<ActionResult<object>> ObtenerSiguienteCodigo([FromQuery] string tipo)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        if (string.Equals(tipo, "insumo", StringComparison.OrdinalIgnoreCase))
        {
            var codigoSiguiente = await GenerarSiguienteCodigoInsumoAsync(inquilinoId.Value);
            return Ok(new { codigo = codigoSiguiente });
        }
        else if (string.Equals(tipo, "plato", StringComparison.OrdinalIgnoreCase))
        {
            var codigoSiguiente = await GenerarSiguienteCodigoPlatoAsync(inquilinoId.Value);
            return Ok(new { codigo = codigoSiguiente });
        }

        return BadRequest(new { mensaje = "Tipo no soportado. Use 'insumo' o 'plato'." });
    }

    [HttpPost("insumos")]
    public async Task<ActionResult<InsumoDto>> CrearInsumo([FromBody] CrearInsumoDto dto)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return BadRequest(new { mensaje = "El nombre del insumo es obligatorio." });
        }

        var unidad = await _db.UnidadesMedida.FirstOrDefaultAsync(u => u.Id == dto.UnidadMedidaId && u.InquilinoId == inquilinoId);
        if (unidad == null)
        {
            return BadRequest(new { mensaje = "Unidad de medida no encontrada." });
        }

        var codigoFinal = string.IsNullOrWhiteSpace(dto.CodigoInterno)
            ? await GenerarSiguienteCodigoInsumoAsync(inquilinoId.Value)
            : dto.CodigoInterno.Trim().ToUpper();

        var insumo = new Insumo
        {
            InquilinoId = inquilinoId.Value,
            CodigoInterno = codigoFinal,
            Nombre = dto.Nombre.Trim(),
            UnidadMedidaId = dto.UnidadMedidaId,
            StockActual = dto.StockInicial,
            StockMinimo = dto.StockMinimo,
            CostoPromedioUnitario = dto.CostoUnitario,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Insumos.Add(insumo);

        if (dto.StockInicial > 0)
        {
            var mov = new MovimientoInventario
            {
                InquilinoId = inquilinoId.Value,
                InsumoId = insumo.Id,
                TipoMovimiento = TipoMovimientoInventario.EntradaCompra,
                Cantidad = dto.StockInicial,
                CostoUnitario = dto.CostoUnitario,
                Motivo = "Stock inicial de apertura",
                FechaCreacion = DateTime.UtcNow
            };
            _db.MovimientosInventario.Add(mov);
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerInsumos), new InsumoDto(
            insumo.Id,
            insumo.CodigoInterno,
            insumo.Nombre,
            insumo.UnidadMedidaId,
            unidad.Codigo,
            insumo.StockActual,
            insumo.StockMinimo,
            insumo.CostoPromedioUnitario
        ));
    }

    [HttpPost("insumos/entrada-stock")]
    public async Task<IActionResult> RegistrarEntradaStock([FromBody] RegistrarEntradaStockDto dto)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        if (dto.Cantidad <= 0)
        {
            return BadRequest(new { mensaje = "La cantidad a ingresar debe ser mayor a cero." });
        }

        var insumo = await _db.Insumos
            .Include(i => i.UnidadMedida)
            .FirstOrDefaultAsync(i => i.Id == dto.InsumoId && i.InquilinoId == inquilinoId);

        if (insumo == null)
        {
            return NotFound(new { mensaje = "Insumo no encontrado." });
        }

        // Cálculo de costo promedio ponderado
        decimal stockAnterior = insumo.StockActual;
        decimal costoAnterior = insumo.CostoPromedioUnitario;
        decimal nuevaCantidad = dto.Cantidad;
        decimal nuevoCosto = dto.CostoUnitario > 0 ? dto.CostoUnitario : costoAnterior;

        decimal valorTotalExistente = Math.Max(0, stockAnterior) * costoAnterior;
        decimal valorNuevoIngreso = nuevaCantidad * nuevoCosto;
        decimal stockNuevoTotal = stockAnterior + nuevaCantidad;

        decimal costoPromedioCalculado = stockNuevoTotal > 0 ? (valorTotalExistente + valorNuevoIngreso) / stockNuevoTotal : nuevoCosto;

        insumo.StockActual = stockNuevoTotal;
        insumo.CostoPromedioUnitario = Math.Round(costoPromedioCalculado, 2);
        insumo.FechaModificacion = DateTime.UtcNow;

        var movimiento = new MovimientoInventario
        {
            InquilinoId = inquilinoId.Value,
            InsumoId = insumo.Id,
            TipoMovimiento = TipoMovimientoInventario.EntradaCompra,
            Cantidad = nuevaCantidad,
            CostoUnitario = nuevoCosto,
            Motivo = string.IsNullOrWhiteSpace(dto.Motivo) ? "Entrada de insumos / Compra" : dto.Motivo,
            FechaCreacion = DateTime.UtcNow
        };

        _db.MovimientosInventario.Add(movimiento);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensaje = $"Se ingresaron {nuevaCantidad} {insumo.UnidadMedida.Codigo} al insumo {insumo.Nombre}.",
            stockActual = insumo.StockActual,
            costoPromedioUnitario = insumo.CostoPromedioUnitario
        });
    }

    [HttpPost("platos")]
    public async Task<ActionResult<PlatoDto>> CrearPlato([FromBody] CrearPlatoDto dto)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return BadRequest(new { mensaje = "El nombre del plato es obligatorio." });
        }

        if (dto.PrecioVenta < 0)
        {
            return BadRequest(new { mensaje = "El precio de venta no puede ser negativo." });
        }

        var categoria = await _db.CategoriasPlatos
            .FirstOrDefaultAsync(c => c.Id == dto.CategoriaPlatoId && c.InquilinoId == inquilinoId);

        if (categoria == null)
        {
            return BadRequest(new { mensaje = "Categoría de plato no encontrada." });
        }

        var codigoFinal = string.IsNullOrWhiteSpace(dto.Codigo)
            ? await GenerarSiguienteCodigoPlatoAsync(inquilinoId.Value)
            : dto.Codigo.Trim().ToUpper();

        var plato = new Plato
        {
            InquilinoId = inquilinoId.Value,
            CategoriaPlatoId = dto.CategoriaPlatoId,
            Codigo = codigoFinal,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            PrecioVenta = dto.PrecioVenta,
            CostoEstimado = 0,
            EstaDisponible = true,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Platos.Add(plato);
        await _db.SaveChangesAsync();

        return Ok(new PlatoDto(
            plato.Id,
            plato.CategoriaPlatoId,
            categoria.Nombre,
            plato.Codigo,
            plato.Nombre,
            plato.Descripcion,
            plato.PrecioVenta,
            plato.CostoEstimado,
            plato.EstaDisponible,
            false
        ));
    }

    [HttpPost("platos/{platoId}/receta")]
    public async Task<IActionResult> GuardarRecetaPlato(Guid platoId, [FromBody] GuardarRecetaDto dto)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var plato = await _db.Platos.FirstOrDefaultAsync(p => p.Id == platoId && p.InquilinoId == inquilinoId);
        if (plato == null) return NotFound(new { mensaje = "Plato no encontrado." });

        var recetaExistente = await _db.Recetas
            .Include(r => r.Ingredientes)
            .FirstOrDefaultAsync(r => r.PlatoId == platoId && r.InquilinoId == inquilinoId);

        if (recetaExistente != null)
        {
            _db.DetallesRecetas.RemoveRange(recetaExistente.Ingredientes);
            _db.Recetas.Remove(recetaExistente);
            await _db.SaveChangesAsync();
        }

        var nuevaReceta = new Receta
        {
            InquilinoId = inquilinoId.Value,
            PlatoId = platoId,
            RendimientoPorciones = dto.RendimientoPorciones <= 0 ? 1 : dto.RendimientoPorciones,
            IndicacionesPreparacion = dto.IndicacionesPreparacion,
            FechaCreacion = DateTime.UtcNow
        };

        decimal costoTotalCalculado = 0;

        foreach (var item in dto.Ingredientes)
        {
            var insumo = await _db.Insumos.FirstOrDefaultAsync(i => i.Id == item.InsumoId && i.InquilinoId == inquilinoId);
            if (insumo != null)
            {
                costoTotalCalculado += item.CantidadNecesaria * insumo.CostoPromedioUnitario;
                nuevaReceta.Ingredientes.Add(new DetalleReceta
                {
                    InquilinoId = inquilinoId.Value,
                    InsumoId = item.InsumoId,
                    CantidadNecesaria = item.CantidadNecesaria,
                    UnidadMedidaId = item.UnidadMedidaId,
                    FechaCreacion = DateTime.UtcNow
                });
            }
        }

        plato.CostoEstimado = costoTotalCalculado;
        _db.Recetas.Add(nuevaReceta);
        await _db.SaveChangesAsync();

        return Ok(new { mensaje = "Receta guardada exitosamente.", costoEstimado = plato.CostoEstimado });
    }

    [HttpGet("platos/{platoId}/receta")]
    public async Task<ActionResult<object>> ObtenerRecetaPlato(Guid platoId)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var receta = await _db.Recetas
            .Where(r => r.PlatoId == platoId && r.InquilinoId == inquilinoId)
            .Include(r => r.Ingredientes)
                .ThenInclude(i => i.Insumo)
            .Include(r => r.Ingredientes)
                .ThenInclude(i => i.UnidadMedida)
            .Select(r => new
            {
                r.Id,
                r.PlatoId,
                r.RendimientoPorciones,
                r.IndicacionesPreparacion,
                Ingredientes = r.Ingredientes.Select(i => new
                {
                    i.Id,
                    i.InsumoId,
                    InsumoNombre = i.Insumo.Nombre,
                    i.CantidadNecesaria,
                    UnidadCodigo = i.UnidadMedida.Codigo,
                    CostoEstimadoIngrediente = i.CantidadNecesaria * i.Insumo.CostoPromedioUnitario
                }),
                CostoTotalReceta = r.Ingredientes.Sum(i => i.CantidadNecesaria * i.Insumo.CostoPromedioUnitario)
            })
            .FirstOrDefaultAsync();

        if (receta == null) return NotFound(new { mensaje = "El plato no tiene una receta configurada." });

        return Ok(receta);
    }

    private async Task<string> GenerarSiguienteCodigoInsumoAsync(Guid inquilinoId)
    {
        var codigosExistentes = await _db.Insumos
            .Where(i => i.InquilinoId == inquilinoId && i.CodigoInterno.StartsWith("INS-"))
            .Select(i => i.CodigoInterno)
            .ToListAsync();

        int maxNumero = 0;
        foreach (var cod in codigosExistentes)
        {
            var parteNum = cod.Replace("INS-", "");
            if (int.TryParse(parteNum, out int n))
            {
                if (n > maxNumero) maxNumero = n;
            }
        }

        int siguiente = maxNumero > 0 ? maxNumero + 1 : codigosExistentes.Count + 1;
        return $"INS-{siguiente:D3}";
    }

    private async Task<string> GenerarSiguienteCodigoPlatoAsync(Guid inquilinoId)
    {
        var codigosExistentes = await _db.Platos
            .Where(p => p.InquilinoId == inquilinoId && p.Codigo.StartsWith("PLT-"))
            .Select(p => p.Codigo)
            .ToListAsync();

        int maxNumero = 0;
        foreach (var cod in codigosExistentes)
        {
            var parteNum = cod.Replace("PLT-", "");
            if (int.TryParse(parteNum, out int n))
            {
                if (n > maxNumero) maxNumero = n;
            }
        }

        int siguiente = maxNumero > 0 ? maxNumero + 1 : codigosExistentes.Count + 1;
        return $"PLT-{siguiente:D3}";
    }
}
