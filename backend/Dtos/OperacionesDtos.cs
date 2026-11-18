using Restaurante.Api.Modelos;

namespace Restaurante.Api.Dtos;

// Mesas y Salón
public record MesaDto(
    Guid Id,
    Guid ZonaId,
    string ZonaNombre,
    string CodigoMesa,
    int CapacidadComensales,
    EstadoMesa Estado,
    double PosicionX,
    double PosicionY,
    Guid? ComandaActivaId,
    decimal TotalComandaActiva,
    string? MeseroNombre,
    DateTime? FechaAperturaComanda
);

public record ActualizarPosicionMesaDto(Guid MesaId, double PosicionX, double PosicionY);
public record CambiarEstadoMesaDto(Guid MesaId, EstadoMesa NuevoEstado);

// Comandas y Pedidos
public record DetalleItemComandaDto(
    Guid PlatoId,
    int Cantidad,
    string? NotasCocina
);

public record CrearComandaDto(
    Guid MesaId,
    List<DetalleItemComandaDto> Items
);

public record DetalleComandaResumenDto(
    Guid Id,
    Guid PlatoId,
    string PlatoNombre,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal,
    string? NotasCocina,
    EstadoKDS EstadoKds,
    DateTime? FechaInicioCoccion,
    DateTime? FechaPlatoListo
);

public record ComandaResumenDto(
    Guid Id,
    Guid MesaId,
    string CodigoMesa,
    string ZonaNombre,
    Guid UsuarioId,
    string MeseroNombre,
    int NumeroComandaDia,
    EstadoComanda Estado,
    decimal Total,
    DateTime FechaCreacion,
    List<DetalleComandaResumenDto> Detalles
);

// KDS (Pantalla de Cocina)
public record TicketKdsDto(
    Guid DetalleComandaId,
    Guid ComandaId,
    int NumeroComandaDia,
    string CodigoMesa,
    string PlatoNombre,
    int Cantidad,
    string? NotasCocina,
    EstadoKDS EstadoKds,
    DateTime FechaCreacion,
    int MinutosTranscurridos
);

public record CambiarEstadoKdsDto(
    Guid DetalleComandaId,
    EstadoKDS NuevoEstado
);

// Inventario y Platos
public record UnidadMedidaDto(
    Guid Id,
    string Codigo,
    string Nombre
);

public record InsumoDto(
    Guid Id,
    string CodigoInterno,
    string Nombre,
    Guid UnidadMedidaId,
    string UnidadMedidaCodigo,
    decimal StockActual,
    decimal StockMinimo,
    decimal CostoPromedioUnitario
);

public record CrearInsumoDto(
    string CodigoInterno,
    string Nombre,
    Guid UnidadMedidaId,
    decimal StockInicial,
    decimal StockMinimo,
    decimal CostoUnitario
);

public record RegistrarEntradaStockDto(
    Guid InsumoId,
    decimal Cantidad,
    decimal CostoUnitario,
    string? Motivo
);

public record PlatoDto(
    Guid Id,
    Guid CategoriaPlatoId,
    string CategoriaNombre,
    string Codigo,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta,
    decimal CostoEstimado,
    bool EstaDisponible,
    bool TieneReceta
);

public record CrearPlatoDto(
    Guid CategoriaPlatoId,
    string Codigo,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta
);

public record CrearDetalleRecetaDto(
    Guid InsumoId,
    decimal CantidadNecesaria,
    Guid UnidadMedidaId
);

public record GuardarRecetaDto(
    decimal RendimientoPorciones,
    string? IndicacionesPreparacion,
    List<CrearDetalleRecetaDto> Ingredientes
);

// Facturación y Cajas
public record AperturaTurnoCajaDto(Guid CajaId, decimal MontoApertura);
public record CierreTurnoCajaDto(Guid TurnoCajaId, decimal MontoCierreDeclarado);

public record EmitirComprobanteDto(
    Guid ComandaId,
    Guid TurnoCajaId,
    TipoComprobanteSunat TipoComprobante,
    string TipoDocumentoIdentidad,
    string NumeroDocumentoIdentidad,
    string RazonSocialCliente,
    MetodoPago MetodoPago
);

public record ComprobanteResumenDto(
    Guid Id,
    string Serie,
    int Correlativo,
    TipoComprobanteSunat TipoComprobante,
    string NumeroDocumentoIdentidad,
    string RazonSocialCliente,
    decimal Total,
    MetodoPago MetodoPago,
    string? SunatEstado,
    string? SunatMensajeRespuesta,
    string? SunatXmlUrl,
    string? SunatPdfUrl,
    string? SunatCdrUrl,
    string? SunatHash,
    DateTime FechaCreacion,
    string CajeroNombre,
    string CodigoMesa
);

public record ConfiguracionSunatDto(
    bool EmisionElectronicaActiva,
    string? ApisPeruToken,
    string? Ubigeo,
    string? Departamento,
    string? Provincia,
    string? Distrito
);
