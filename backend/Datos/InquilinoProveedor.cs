using System.Security.Claims;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Datos;

public class InquilinoProveedor : IInquilinoProveedor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _inquilinoSobrescritoId;
    private Guid? _sucursalSobrescritaId;

    public InquilinoProveedor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? ObtenerInquilinoId()
    {
        if (_inquilinoSobrescritoId.HasValue)
            return _inquilinoSobrescritoId.Value;

        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        var claimInquilino = context.User.FindFirst("InquilinoId")?.Value 
                          ?? context.User.FindFirst("tenant_id")?.Value;

        if (Guid.TryParse(claimInquilino, out var inquilinoId))
        {
            return inquilinoId;
        }

        // Permitir header opcional si es SuperAdmin inspeccionando un inquilino
        if (EsSuperAdmin() && context.Request.Headers.TryGetValue("X-Inquilino-Id", out var headerVal))
        {
            if (Guid.TryParse(headerVal, out var headerInquilinoId))
                return headerInquilinoId;
        }

        return null;
    }

    public Guid? ObtenerSucursalId()
    {
        if (_sucursalSobrescritaId.HasValue)
            return _sucursalSobrescritaId.Value;

        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        // Si el usuario es empleado (Mesero, Cajero, Cocinero), su sucursal fija viene en el token
        var claimSucursal = context.User.FindFirst("SucursalId")?.Value;
        if (Guid.TryParse(claimSucursal, out var sucursalClaimId))
        {
            return sucursalClaimId;
        }

        // Si es AdminRestaurante (que tiene visión de todas las sucursales), puede seleccionar la sucursal activa vía header
        if (context.Request.Headers.TryGetValue("X-Sucursal-Id", out var headerSucursal))
        {
            if (Guid.TryParse(headerSucursal, out var sucursalHeaderId))
                return sucursalHeaderId;
        }

        return null;
    }

    public Guid? ObtenerUsuarioId()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        var claimUsuario = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? context.User.FindFirst("sub")?.Value;

        if (Guid.TryParse(claimUsuario, out var usuarioId))
        {
            return usuarioId;
        }

        return null;
    }

    public string? ObtenerRol()
    {
        var context = _httpContextAccessor.HttpContext;
        return context?.User.FindFirst(ClaimTypes.Role)?.Value;
    }

    public bool EsSuperAdmin()
    {
        return ObtenerRol() == RolUsuario.SuperAdmin.ToString();
    }

    public void EstablecerInquilinoId(Guid inquilinoId)
    {
        _inquilinoSobrescritoId = inquilinoId;
    }

    public void EstablecerSucursalId(Guid sucursalId)
    {
        _sucursalSobrescritaId = sucursalId;
    }
}
