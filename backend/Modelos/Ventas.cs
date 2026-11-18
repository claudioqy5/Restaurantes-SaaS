namespace Restaurante.Api.Modelos;

public class Comanda : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }

    // Sucursal física donde se atiende la comanda
    public Guid SucursalId { get; set; }
    public Sucursal Sucursal { get; set; } = null!;

    public Guid MesaId { get; set; }
    public Mesa Mesa { get; set; } = null!;

    // Trazabilidad de quién atendió la mesa / abrió la comanda
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int NumeroComandaDia { get; set; }
    public EstadoComanda Estado { get; set; } = EstadoComanda.Abierta;
    public decimal Total { get; set; } = 0;

    public ICollection<DetalleComanda> Detalles { get; set; } = new List<DetalleComanda>();
    public ComprobantePago? ComprobantePago { get; set; }
}

public class DetalleComanda : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid ComandaId { get; set; }
    public Comanda Comanda { get; set; } = null!;

    public Guid PlatoId { get; set; }
    public Plato Plato { get; set; } = null!;

    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public string? NotasCocina { get; set; }

    // Control KDS (Kitchen Display System)
    public EstadoKDS EstadoKds { get; set; } = EstadoKDS.Pendiente;
    public DateTime? FechaInicioCoccion { get; set; }
    public DateTime? FechaPlatoListo { get; set; }
}

public class Caja : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }

    // Cada caja física se encuentra en una Sucursal
    public Guid SucursalId { get; set; }
    public Sucursal Sucursal { get; set; } = null!;

    public string Nombre { get; set; } = string.Empty;
    public ICollection<TurnoCaja> Turnos { get; set; } = new List<TurnoCaja>();
}

public class TurnoCaja : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid CajaId { get; set; }
    public Caja Caja { get; set; } = null!;

    // Trazabilidad de qué cajero abrió/cerró el turno
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public DateTime FechaApertura { get; set; } = DateTime.UtcNow;
    public decimal MontoApertura { get; set; }
    public DateTime? FechaCierre { get; set; }
    public decimal? MontoCierreDeclarado { get; set; }
    public decimal? MontoCierreSistema { get; set; }
    public decimal? Diferencia { get; set; }
    public bool EstaCerrado { get; set; } = false;

    public ICollection<ComprobantePago> Comprobantes { get; set; } = new List<ComprobantePago>();
}

public class ComprobantePago : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid ComandaId { get; set; }
    public Comanda Comanda { get; set; } = null!;

    public Guid TurnoCajaId { get; set; }
    public TurnoCaja TurnoCaja { get; set; } = null!;

    // Trazabilidad directa de quién realizó el cobro y emitió la venta
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public TipoComprobanteSunat TipoComprobante { get; set; }
    public string Serie { get; set; } = string.Empty;
    public int Correlativo { get; set; }

    // Datos Cliente SUNAT
    public string TipoDocumentoIdentidad { get; set; } = "1"; // 1: DNI, 6: RUC, 0: Varios
    public string NumeroDocumentoIdentidad { get; set; } = "00000000";
    public string RazonSocialCliente { get; set; } = "CLIENTE VARIOS";

    // Cálculos Tributarios SUNAT UBL 2.1
    public decimal Gravadas { get; set; }
    public decimal Igv { get; set; }
    public decimal Total { get; set; }
    public MetodoPago MetodoPago { get; set; }

    // Estado y Documentos de Facturación Electrónica (APIs Perú / SUNAT)
    public string? SunatEstado { get; set; } = "PENDIENTE";
    public string? SunatMensajeRespuesta { get; set; }
    public string? SunatXmlUrl { get; set; }
    public string? SunatPdfUrl { get; set; }
    public string? SunatCdrUrl { get; set; }
    public string? SunatHash { get; set; }
}
