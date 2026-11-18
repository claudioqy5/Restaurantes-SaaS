using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "AdminRestaurante,SuperAdmin")]
public class UsuariosControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;

    public UsuariosControlador(RestauranteDbContext db, IInquilinoProveedor inquilinoProveedor)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioResumenDto>>> ObtenerUsuarios([FromQuery] Guid? sucursalId)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized(new { mensaje = "Inquilino no identificado." });

        var query = _db.Usuarios
            .Where(u => u.InquilinoId == inquilinoId)
            .Include(u => u.Sucursal)
            .Include(u => u.CreadoPorUsuario)
            .AsQueryable();

        if (sucursalId.HasValue)
        {
            query = query.Where(u => u.SucursalId == sucursalId.Value);
        }

        var usuarios = await query
            .OrderBy(u => u.Rol)
            .ThenBy(u => u.Nombres)
            .Select(u => new UsuarioResumenDto(
                u.Id,
                u.Nombres,
                u.Apellidos,
                u.Correo,
                u.Telefono,
                u.Rol,
                u.SucursalId,
                u.Sucursal != null ? u.Sucursal.Nombre : "Todas las Sucursales (Administrador General)",
                u.Activo,
                u.FechaCreacion,
                u.CreadoPorUsuario != null ? $"{u.CreadoPorUsuario.Nombres} {u.CreadoPorUsuario.Apellidos}" : "Sistema / Registro Inicial",
                _db.Comandas.Count(c => c.UsuarioId == u.Id),
                _db.ComprobantesPago.Count(cp => cp.UsuarioId == u.Id),
                _db.ComprobantesPago.Where(cp => cp.UsuarioId == u.Id).Sum(cp => (decimal?)cp.Total) ?? 0
            ))
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPost]
    public async Task<ActionResult<object>> CrearUsuario([FromBody] CrearUsuarioEmpleadoDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var creadorId = _inquilinoProveedor.ObtenerUsuarioId();

        if (inquilinoId == null) return Unauthorized(new { mensaje = "Inquilino no identificado." });

        // Validar límite de usuarios contratados en el plan SaaS
        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == inquilinoId.Value);
        if (inquilino == null) return Unauthorized();

        if (inquilino.LimiteUsuarios.HasValue && inquilino.LimiteUsuarios.Value > 0)
        {
            var usuariosActuales = await _db.Usuarios.CountAsync(u => u.InquilinoId == inquilinoId.Value && u.Activo);
            if (usuariosActuales >= inquilino.LimiteUsuarios.Value)
            {
                return BadRequest(new
                {
                    mensaje = $"Ha alcanzado el límite máximo de {inquilino.LimiteUsuarios.Value} usuario(s) permitidos en su plan SaaS. Por favor contacte a su asesor para ampliar su suscripción."
                });
            }
        }

        var correoLimpio = peticion.Correo.Trim().ToLower();
        if (await _db.Usuarios.IgnoreQueryFilters().AnyAsync(u => u.Correo == correoLimpio))
        {
            return BadRequest(new { mensaje = "El correo ya está registrado para otro usuario." });
        }

        // Impedir que se creen SuperAdmins desde este endpoint
        if (peticion.Rol == RolUsuario.SuperAdmin)
        {
            return Forbid();
        }

        // Validación estricta de Sucursal: los trabajadores (Mesero, Cajero, Cocinero) deben estar asignados a una sucursal física
        if (peticion.Rol != RolUsuario.AdminRestaurante && (!peticion.SucursalId.HasValue || peticion.SucursalId == Guid.Empty))
        {
            return BadRequest(new { mensaje = "Es obligatorio asignar una sucursal al trabajador (Mesero, Cajero o Cocinero)." });
        }

        // Si se envió SucursalId, validar que pertenezca al restaurante
        if (peticion.SucursalId.HasValue)
        {
            var sucursalExiste = await _db.Sucursales.AnyAsync(s => s.Id == peticion.SucursalId.Value && s.InquilinoId == inquilinoId);
            if (!sucursalExiste)
            {
                return BadRequest(new { mensaje = "La sucursal seleccionada no existe o no pertenece a este restaurante." });
            }
        }

        var nuevoUsuario = new Usuario
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            SucursalId = peticion.SucursalId,
            Nombres = peticion.Nombres.Trim(),
            Apellidos = peticion.Apellidos.Trim(),
            Correo = correoLimpio,
            ClaveHash = BCrypt.Net.BCrypt.HashPassword(peticion.Clave),
            Telefono = peticion.Telefono?.Trim(),
            Rol = peticion.Rol,
            CreadoPorUsuarioId = creadorId,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Usuarios.Add(nuevoUsuario);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerUsuarios), new
        {
            mensaje = "Usuario creado exitosamente.",
            usuarioId = nuevoUsuario.Id,
            nombre = $"{nuevoUsuario.Nombres} {nuevoUsuario.Apellidos}",
            rol = nuevoUsuario.Rol.ToString(),
            sucursalId = nuevoUsuario.SucursalId
        });
    }

    [HttpPut("{id}/alternar-estado")]
    public async Task<ActionResult> AlternarEstado(Guid id)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id && u.InquilinoId == inquilinoId);

        if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

        usuario.Activo = !usuario.Activo;
        await _db.SaveChangesAsync();

        return Ok(new { mensaje = $"Estado actualizado. Activo: {usuario.Activo}" });
    }

    [HttpPut("{id}/cambiar-clave")]
    public async Task<ActionResult> CambiarClave(Guid id, [FromBody] ResetearClaveDto dto)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Trim().Length < 6)
        {
            return BadRequest(new { mensaje = "La nueva contraseña debe tener al menos 6 caracteres." });
        }

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id && u.InquilinoId == inquilinoId);
        if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

        usuario.ClaveHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevaClave.Trim());
        await _db.SaveChangesAsync();

        return Ok(new { mensaje = $"Contraseña actualizada exitosamente para {usuario.Nombres} {usuario.Apellidos}." });
    }
}
