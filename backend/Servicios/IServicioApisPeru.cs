using Restaurante.Api.Modelos;

namespace Restaurante.Api.Servicios;

public record ResultadoEmisionSunat(
    bool Exito,
    string Mensaje,
    string? XmlUrl,
    string? PdfUrl,
    string? CdrUrl,
    string? SunatEstado,
    string? Hash
);

public interface IServicioApisPeru
{
    Task<ResultadoEmisionSunat> EmitirComprobanteAsync(
        ComprobantePago comprobante,
        Inquilino inquilino,
        Sucursal sucursal,
        List<DetalleComanda> detalles);
}
