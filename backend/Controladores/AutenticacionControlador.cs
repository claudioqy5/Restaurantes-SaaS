using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Modelos;
using Restaurante.Api.Servicios;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/autenticacion")]
public class AutenticacionControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IServicioToken _servicioToken;
    private readonly IInquilinoProveedor _inquilinoProveedor;

    public AutenticacionControlador(
        RestauranteDbContext db,
        IServicioToken servicioToken,
        IInquilinoProveedor inquilinoProveedor)
    {
        _db = db;
        _servicioToken = servicioToken;
        _inquilinoProveedor = inquilinoProveedor;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginRespuestaDto>> IniciarSesion([FromBody] LoginPeticionDto peticion)
    {
        var usuario = await _db.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Inquilino)
            .Include(u => u.Sucursal)
            .FirstOrDefaultAsync(u => u.Correo == peticion.Correo.Trim().ToLower() && u.Activo);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(peticion.Clave, usuario.ClaveHash))
        {
            return Unauthorized(new { mensaje = "Credenciales incorrectas o usuario inactivo." });
        }

        if (usuario.Inquilino != null && !usuario.Inquilino.Activo)
        {
            return StatusCode(403, new { mensaje = "El servicio para este restaurante se encuentra actualmente inactivo." });
        }

        if (usuario.Inquilino != null && usuario.Inquilino.BloqueadoPorMora)
        {
            return StatusCode(403, new { mensaje = "El acceso al restaurante se encuentra temporalmente suspendido por pagos pendientes." });
        }

        var token = _servicioToken.GenerarToken(usuario, usuario.Inquilino);

        return Ok(new LoginRespuestaDto(
            token,
            usuario.Id,
            usuario.Nombres,
            usuario.Apellidos,
            usuario.Correo,
            usuario.Rol,
            usuario.InquilinoId,
            usuario.Inquilino?.NombreComercial,
            usuario.Inquilino?.Subdominio,
            usuario.SucursalId,
            usuario.Sucursal?.Nombre
        ));
    }

    [Authorize]
    [HttpGet("perfil")]
    public async Task<ActionResult<object>> ObtenerPerfil()
    {
        var usuarioId = _inquilinoProveedor.ObtenerUsuarioId();
        if (usuarioId == null) return Unauthorized();

        var usuario = await _db.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Inquilino)
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

        return Ok(new
        {
            usuario.Id,
            usuario.Nombres,
            usuario.Apellidos,
            usuario.Correo,
            usuario.Telefono,
            Rol = usuario.Rol.ToString(),
            usuario.InquilinoId,
            Restaurante = usuario.Inquilino != null ? new
            {
                usuario.Inquilino.RazonSocial,
                usuario.Inquilino.NombreComercial,
                usuario.Inquilino.Ruc,
                usuario.Inquilino.Subdominio,
                usuario.Inquilino.LogoUrl
            } : null
        });
    }
}
