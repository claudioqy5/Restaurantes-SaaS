using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Servicios;

public interface IServicioInventario
{
    Task DescontarStockPorRecetaAsync(Guid detalleComandaId, Guid? usuarioId);
}

public class ServicioInventario : IServicioInventario
{
    private readonly RestauranteDbContext _db;
    private readonly ILogger<ServicioInventario> _logger;

    public ServicioInventario(RestauranteDbContext db, ILogger<ServicioInventario> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task DescontarStockPorRecetaAsync(Guid detalleComandaId, Guid? usuarioId)
    {
        var detalle = await _db.DetallesComandas
            .Include(d => d.Plato)
                .ThenInclude(p => p.Receta)
                    .ThenInclude(r => r!.Ingredientes)
                        .ThenInclude(i => i.Insumo)
            .Include(d => d.Plato)
                .ThenInclude(p => p.Receta)
                    .ThenInclude(r => r!.Ingredientes)
                        .ThenInclude(i => i.UnidadMedida)
            .FirstOrDefaultAsync(d => d.Id == detalleComandaId);

        if (detalle?.Plato.Receta == null || !detalle.Plato.Receta.Ingredientes.Any())
        {
            _logger.LogInformation("El plato {Plato} no tiene receta configurada para descuento.", detalle?.Plato?.Nombre);
            return;
        }

        var receta = detalle.Plato.Receta;
        var porcionesPedidas = detalle.Cantidad;

        foreach (var ingrediente in receta.Ingredientes)
        {
            var insumo = ingrediente.Insumo;
            if (insumo == null) continue;

            // Conversión de unidad si aplica
            decimal factor = ingrediente.UnidadMedida.FactorAUnidadBase;
            decimal cantidadTotalDescontar = (ingrediente.CantidadNecesaria * porcionesPedidas) * factor;

            insumo.StockActual -= cantidadTotalDescontar;

            var movimiento = new MovimientoInventario
            {
                InquilinoId = detalle.InquilinoId,
                InsumoId = insumo.Id,
                TipoMovimiento = TipoMovimientoInventario.SalidaVenta,
                Cantidad = cantidadTotalDescontar,
                CostoUnitario = insumo.CostoPromedioUnitario,
                ReferenciaOrigenId = detalle.Id,
                Motivo = $"Venta Comanda #{detalle.ComandaId} - {detalle.Plato.Nombre} (x{detalle.Cantidad})",
                UsuarioId = usuarioId
            };

            _db.MovimientosInventario.Add(movimiento);
        }

        await _db.SaveChangesAsync();
    }
}
