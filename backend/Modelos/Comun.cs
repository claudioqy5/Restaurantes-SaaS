namespace Restaurante.Api.Modelos;

public interface IEntidadInquilino
{
    Guid InquilinoId { get; set; }
}

public abstract class EntidadBase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacion { get; set; }
    public bool Activo { get; set; } = true;
}

public enum RolUsuario
{
    SuperAdmin = 1,
    AdminRestaurante = 2,
    Cajero = 3,
    Mesero = 4,
    Cocinero = 5
}

public enum EstadoMesa
{
    Libre = 1,
    Ocupada = 2,
    EsperandoCuenta = 3,
    Reservada = 4,
    EnLimpieza = 5
}

public enum EstadoComanda
{
    Abierta = 1,
    Cerrada = 2,
    Cancelada = 3
}

public enum EstadoKDS
{
    Pendiente = 1,
    Preparando = 2,
    Listo = 3,
    Entregado = 4,
    Cancelado = 5
}

public enum TipoMovimientoInventario
{
    EntradaCompra = 1,
    SalidaVenta = 2,
    Merma = 3,
    AjusteManual = 4
}

public enum TipoComprobanteSunat
{
    NotaVenta = 0,
    Factura = 1,  // Código SUNAT 01
    Boleta = 3     // Código SUNAT 03
}

public enum MetodoPago
{
    Efectivo = 1,
    TarjetaCredito = 2,
    TarjetaDebito = 3,
    Yape = 4,
    Plin = 5,
    Transferencia = 6
}
