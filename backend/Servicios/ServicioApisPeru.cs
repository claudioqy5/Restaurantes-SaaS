using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Servicios;

public class ServicioApisPeru : IServicioApisPeru
{
    private readonly HttpClient _httpClient;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ServicioApisPeru> _logger;
    private const string BASE_URL = "https://facturacion.apisperu.com/api/v1";

    public ServicioApisPeru(HttpClient httpClient, IWebHostEnvironment env, ILogger<ServicioApisPeru> logger)
    {
        _httpClient = httpClient;
        _env = env;
        _logger = logger;
    }

    public async Task<ResultadoEmisionSunat> EmitirComprobanteAsync(
        ComprobantePago comprobante,
        Inquilino inquilino,
        Sucursal sucursal,
        List<DetalleComanda> detalles)
    {
        try
        {
            // Modo Demo o Sin Token: Si aún no se ha configurado el token o la emisión está inactiva,
            // registramos el comprobante de forma local exitosa para que el sistema funcione siempre.
            if (!inquilino.EmisionElectronicaActiva || string.IsNullOrEmpty(inquilino.ApisPeruToken))
            {
                var hashDemo = Guid.NewGuid().ToString("N")[..28].ToUpper();
                return new ResultadoEmisionSunat(
                    true,
                    "Comprobante registrado en modo local (Pendiente de configuración de Token APIs Perú).",
                    null,
                    null,
                    null,
                    "ACEPTADO_LOCAL",
                    hashDemo
                );
            }

            var rucEmpresa = inquilino.Ruc;
            var token = inquilino.ApisPeruToken;

            // Determinar Tipo de Documento: "03" = Boleta, "01" = Factura
            string tipoDocComprobante = comprobante.TipoComprobante switch
            {
                TipoComprobanteSunat.Factura => "01",
                TipoComprobanteSunat.Boleta => "03",
                _ => "00"
            };

            // Para notas de venta internas no se envía a SUNAT
            if (tipoDocComprobante == "00")
            {
                return new ResultadoEmisionSunat(
                    true,
                    "Nota de Venta interna registrada correctamente.",
                    null,
                    null,
                    null,
                    "NOTA_VENTA",
                    null
                );
            }

            var serieComprobante = comprobante.Serie;
            var correlativoStr = comprobante.Correlativo.ToString();

            // Determinar Tipo y Número de Documento del Cliente
            string clienteTipoDoc = comprobante.TipoDocumentoIdentidad;
            string clienteNumDoc = comprobante.NumeroDocumentoIdentidad.Trim();
            string clienteRazonSocial = comprobante.RazonSocialCliente.Trim();

            if (tipoDocComprobante == "01" && (clienteTipoDoc != "6" || clienteNumDoc.Length != 11))
            {
                return new ResultadoEmisionSunat(
                    false,
                    "Para emitir una Factura es obligatorio un cliente con RUC válido (11 dígitos).",
                    null,
                    null,
                    null,
                    "ERROR_VALIDACION",
                    null
                );
            }

            var buyerData = new
            {
                tipoDoc = clienteTipoDoc,
                numDoc = clienteNumDoc,
                rznSocial = clienteRazonSocial,
                address = new
                {
                    direccion = "-"
                }
            };

            // Mapeo de Detalle de Venta con IGV 18% (Gravadas)
            var details = detalles.Select(d =>
            {
                var pvpTotalLinea = (double)Math.Round(d.Subtotal, 2);
                var pvpUnitario = (double)Math.Round(d.PrecioUnitario, 2);

                var valorUnitarioSinIgv = pvpUnitario / 1.18;
                var valorVentaSinIgv = pvpTotalLinea / 1.18;
                var igvDeLaLinea = pvpTotalLinea - valorVentaSinIgv;

                return new
                {
                    codProducto = d.Plato?.Codigo ?? "PLT",
                    unidad = "NIU", // Código SUNAT para "Unidad" (Bienes y Servicios)
                    cantidad = (double)d.Cantidad,
                    descripcion = d.Plato?.Nombre ?? "Consumo en Restaurante",
                    mtoValorUnitario = Math.Round(valorUnitarioSinIgv, 5),
                    mtoPrecioUnitario = pvpUnitario,
                    mtoValorVenta = Math.Round(valorVentaSinIgv, 2),
                    mtoBaseIgv = Math.Round(valorVentaSinIgv, 2),
                    porcentajeIgv = 18.0,
                    igv = Math.Round(igvDeLaLinea, 2),
                    tipAfeIgv = "10", // 10 = Gravado - Operación Onerosa
                    totalImpuestos = Math.Round(igvDeLaLinea, 2)
                };
            }).ToList();

            var totalVenta = (double)Math.Round(comprobante.Total, 2);
            var mtoOperGravadas = details.Sum(x => x.mtoBaseIgv);
            var mtoIgvTotal = details.Sum(x => x.igv);

            var comprobantePayload = new
            {
                ublVersion = "2.1",
                tipoOperacion = "0101", // Venta Interna
                tipoDoc = tipoDocComprobante,
                serie = serieComprobante,
                correlativo = correlativoStr,
                fechaEmision = comprobante.FechaCreacion.ToString("yyyy-MM-dd") + "T" + comprobante.FechaCreacion.ToString("HH:mm:ss") + "-05:00",
                formaPago = new
                {
                    moneda = "PEN",
                    tipo = "Contado"
                },
                tipoMoneda = "PEN",
                client = buyerData,
                company = new
                {
                    ruc = rucEmpresa,
                    razonSocial = inquilino.RazonSocial,
                    nombreComercial = inquilino.NombreComercial,
                    address = new
                    {
                        ubigueo = inquilino.Ubigeo ?? "150101",
                        direccion = inquilino.DireccionFiscal ?? sucursal.Direccion ?? "Av Principal 123",
                        provincia = inquilino.Provincia ?? "LIMA",
                        departamento = inquilino.Departamento ?? "LIMA",
                        distrito = inquilino.Distrito ?? "LIMA",
                        codLocal = sucursal.CodigoLocalSunat ?? "0000"
                    }
                },
                mtoOperGravadas = Math.Round(mtoOperGravadas, 2),
                mtoIGV = Math.Round(mtoIgvTotal, 2),
                totalImpuestos = Math.Round(mtoIgvTotal, 2),
                valorVenta = Math.Round(mtoOperGravadas, 2),
                subTotal = totalVenta,
                mtoImpVenta = totalVenta,
                details = details,
                legends = new[]
                {
                    new { code = "1000", value = $"SON {NumeroALetras(comprobante.Total)} SOLES" }
                }
            };

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var jsonPayload = JsonSerializer.Serialize(comprobantePayload);

            var response = await _httpClient.PostAsync(
                $"{BASE_URL}/invoice/send",
                new StringContent(jsonPayload, Encoding.UTF8, "application/json")
            );

            var responseBody = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Error APIsPERU (HTTP {Status}): {Body}", (int)response.StatusCode, responseBody);
                return new ResultadoEmisionSunat(
                    false,
                    $"Error APIsPERU (HTTP {(int)response.StatusCode}): {responseBody}",
                    null,
                    null,
                    null,
                    "ERROR",
                    null
                );
            }

            var result = JsonDocument.Parse(responseBody);
            string? xmlUrl = null, pdfUrl = null, cdrUrl = null, sunatStatus = "ACEPTADO", hashString = null;

            var serieCorrelativo = $"{serieComprobante}-{correlativoStr.PadLeft(8, '0')}";
            var storageDir = Path.Combine(_env.ContentRootPath, "uploads", "comprobantes", rucEmpresa);
            Directory.CreateDirectory(storageDir);

            // 1. Extraer Hash
            if (result.RootElement.TryGetProperty("hash", out var hashProp))
                hashString = hashProp.GetString();

            // 2. Extraer y guardar XML
            string? xmlContent = null;
            if (result.RootElement.TryGetProperty("xml", out var xmlProp))
                xmlContent = xmlProp.GetString();
            if (string.IsNullOrEmpty(xmlContent) && result.RootElement.TryGetProperty("xmlSigned", out var xmlSignedProp))
                xmlContent = xmlSignedProp.GetString();
            if (string.IsNullOrEmpty(xmlContent) && result.RootElement.TryGetProperty("document", out var docProp))
                xmlContent = docProp.GetString();

            if (!string.IsNullOrEmpty(xmlContent))
            {
                try
                {
                    byte[] xmlBytes;
                    try { xmlBytes = Convert.FromBase64String(xmlContent); }
                    catch { xmlBytes = Encoding.UTF8.GetBytes(xmlContent); }

                    var xmlFileName = $"{rucEmpresa}-{tipoDocComprobante}-{serieCorrelativo}.xml";
                    var xmlPath = Path.Combine(storageDir, xmlFileName);
                    await File.WriteAllBytesAsync(xmlPath, xmlBytes);
                    xmlUrl = $"/uploads/comprobantes/{rucEmpresa}/{xmlFileName}";
                }
                catch { }
            }

            // 3. Extraer y guardar CDR
            string? cdrContent = null;
            if (result.RootElement.TryGetProperty("cdr", out var cdrProp))
                cdrContent = cdrProp.GetString();
            if (string.IsNullOrEmpty(cdrContent) && result.RootElement.TryGetProperty("cdrZip", out var cdrZipProp))
                cdrContent = cdrZipProp.GetString();

            if (string.IsNullOrEmpty(cdrContent) && result.RootElement.TryGetProperty("sunatResponse", out var sr))
            {
                if (sr.TryGetProperty("cdr", out var srCdr))
                    cdrContent = srCdr.GetString();
                if (string.IsNullOrEmpty(cdrContent) && sr.TryGetProperty("cdrZip", out var srCdrZip))
                    cdrContent = srCdrZip.GetString();
            }

            if (!string.IsNullOrEmpty(cdrContent))
            {
                try
                {
                    byte[] cdrBytes;
                    try { cdrBytes = Convert.FromBase64String(cdrContent); }
                    catch { cdrBytes = Encoding.UTF8.GetBytes(cdrContent); }

                    var cdrFileName = $"R-{rucEmpresa}-{tipoDocComprobante}-{serieCorrelativo}.zip";
                    var cdrPath = Path.Combine(storageDir, cdrFileName);
                    await File.WriteAllBytesAsync(cdrPath, cdrBytes);
                    cdrUrl = $"/uploads/comprobantes/{rucEmpresa}/{cdrFileName}";
                }
                catch { }
            }

            // 4. Fallback URLs directas
            if (string.IsNullOrEmpty(xmlUrl))
            {
                if (result.RootElement.TryGetProperty("links", out var links))
                    xmlUrl = links.TryGetProperty("xml", out var lx) ? lx.GetString() : null;
                xmlUrl ??= result.RootElement.TryGetProperty("xmlUrl", out var xu) ? xu.GetString() : null;
                xmlUrl ??= result.RootElement.TryGetProperty("linkXml", out var lxu) ? lxu.GetString() : null;
            }
            if (string.IsNullOrEmpty(pdfUrl))
            {
                if (result.RootElement.TryGetProperty("links", out var links2))
                    pdfUrl = links2.TryGetProperty("pdf", out var lp) ? lp.GetString() : null;
                pdfUrl ??= result.RootElement.TryGetProperty("pdfUrl", out var pu) ? pu.GetString() : null;
                pdfUrl ??= result.RootElement.TryGetProperty("linkPdf", out var lpu) ? lpu.GetString() : null;
            }
            if (string.IsNullOrEmpty(cdrUrl))
            {
                if (result.RootElement.TryGetProperty("links", out var links3))
                    cdrUrl = links3.TryGetProperty("cdr", out var lc) ? lc.GetString() : null;
                cdrUrl ??= result.RootElement.TryGetProperty("cdrUrl", out var cu) ? cu.GetString() : null;
                cdrUrl ??= result.RootElement.TryGetProperty("linkCdr", out var lcu) ? lcu.GetString() : null;
            }

            // 5. Estado SUNAT
            bool isSuccess = true;
            string returnMessage = "Comprobante emitido y aceptado en SUNAT.";

            if (result.RootElement.TryGetProperty("sunatResponse", out var srObj))
            {
                if (srObj.TryGetProperty("success", out var sProp) && sProp.ValueKind == JsonValueKind.False)
                {
                    if (srObj.TryGetProperty("error", out var errObj))
                    {
                        var errCode = errObj.TryGetProperty("code", out var ec) ? ec.GetString() : "";
                        var errMsg = errObj.TryGetProperty("message", out var em) ? em.GetString() : "Error en SUNAT";

                        if (errCode == "1033")
                        {
                            isSuccess = true;
                            sunatStatus = "ACEPTADO (Registrado previamente)";
                            returnMessage = "Comprobante aceptado previamente en SUNAT.";
                        }
                        else
                        {
                            isSuccess = false;
                            returnMessage = $"SUNAT Error {errCode}: {errMsg}";
                            sunatStatus = returnMessage;
                        }
                    }
                    else
                    {
                        isSuccess = false;
                        returnMessage = "SUNAT no aceptó el comprobante.";
                        sunatStatus = returnMessage;
                    }
                }
            }

            if (isSuccess && (sunatStatus == "ACEPTADO" || sunatStatus == null))
            {
                if (result.RootElement.TryGetProperty("cdrResponse", out var cdrResponse))
                {
                    var desc = cdrResponse.TryGetProperty("description", out var d) ? d.GetString() : null;
                    sunatStatus = desc ?? "El comprobante ha sido aceptado";
                }
                else if (result.RootElement.TryGetProperty("sunatResponse", out var sunatRes) &&
                         sunatRes.TryGetProperty("cdrResponse", out var cdrRes))
                {
                    sunatStatus = cdrRes.TryGetProperty("description", out var d) ? d.GetString() : "ACEPTADO";
                }
                else
                {
                    sunatStatus = "ACEPTADO";
                }
            }

            return new ResultadoEmisionSunat(isSuccess, returnMessage, xmlUrl, pdfUrl, cdrUrl, sunatStatus, hashString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al emitir comprobante con APIs Perú");
            return new ResultadoEmisionSunat(false, $"Excepción al emitir comprobante: {ex.Message}", null, null, null, "ERROR", null);
        }
    }

    private string NumeroALetras(decimal monto)
    {
        var entero = Math.Truncate(monto);
        var decimales = Math.Round((monto - entero) * 100, 0);
        return $"{entero} CON {decimales:00}/100";
    }
}
