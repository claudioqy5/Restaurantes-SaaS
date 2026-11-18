namespace Restaurante.Api.Modelos;

public class UnidadMedida : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public string Codigo { get; set; } = string.Empty; // ej: "KG", "GR", "LT", "ML", "UND"
    public string Nombre { get; set; } = string.Empty;
    public decimal FactorAUnidadBase { get; set; } = 1; // Factor de conversión a unidad estándar
}

public class Insumo : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public string CodigoInterno { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    public Guid UnidadMedidaId { get; set; }
    public UnidadMedida UnidadMedida { get; set; } = null!;

    public decimal StockActual { get; set; } = 0;
    public decimal StockMinimo { get; set; } = 0;
    public decimal CostoPromedioUnitario { get; set; } = 0;

    public ICollection<DetalleReceta> DetallesReceta { get; set; } = new List<DetalleReceta>();
    public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
}

public class CategoriaPlato : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public string Nombre { get; set; } = string.Empty; // ej: "Entradas", "Fondos", "Pastas", "Bebidas"
    public string? Icono { get; set; }
    public int OrdenVisual { get; set; } = 0;
    public ICollection<Plato> Platos { get; set; } = new List<Plato>();
}

public class Plato : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid CategoriaPlatoId { get; set; }
    public CategoriaPlato CategoriaPlato { get; set; } = null!;

    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal CostoEstimado { get; set; }
    public string? ImagenUrl { get; set; }
    public bool EstaDisponible { get; set; } = true;

    // Receta opcional vinculada para descuento automático de stock
    public Receta? Receta { get; set; }
}

public class Receta : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid PlatoId { get; set; }
    public Plato Plato { get; set; } = null!;

    public decimal RendimientoPorciones { get; set; } = 1;
    public string? IndicacionesPreparacion { get; set; }

    public ICollection<DetalleReceta> Ingredientes { get; set; } = new List<DetalleReceta>();
}

public class DetalleReceta : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid RecetaId { get; set; }
    public Receta Receta { get; set; } = null!;

    public Guid InsumoId { get; set; }
    public Insumo Insumo { get; set; } = null!;

    public decimal CantidadNecesaria { get; set; }
    public Guid UnidadMedidaId { get; set; }
    public UnidadMedida UnidadMedida { get; set; } = null!;
}

public class MovimientoInventario : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid InsumoId { get; set; }
    public Insumo Insumo { get; set; } = null!;

    public TipoMovimientoInventario TipoMovimiento { get; set; }
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public Guid? ReferenciaOrigenId { get; set; } // Id del detalle de comanda o compra
    public string? Motivo { get; set; }
    public Guid? UsuarioId { get; set; } // Usuario que generó el movimiento
}
