using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;

    public SuperAdminControlador(RestauranteDbContext db)
    {
        _db = db;
    }

    [HttpGet("inquilinos")]
    public async Task<ActionResult<IEnumerable<InquilinoResumenDto>>> ObtenerInquilinos()
    {
        var inquilinos = await _db.Inquilinos
            .IgnoreQueryFilters()
            .OrderByDescending(i => i.FechaCreacion)
            .Select(i => new InquilinoResumenDto(
                i.Id,
                i.RazonSocial,
                i.NombreComercial,
                i.Ruc,
                i.Subdominio,
                i.DireccionFiscal,
                i.Telefono,
                i.CorreoContacto,
                i.BloqueadoPorMora,
                i.Activo,
                _db.Sucursales.IgnoreQueryFilters().Count(s => s.InquilinoId == i.Id && s.Activo),
                _db.Usuarios.IgnoreQueryFilters().Count(u => u.InquilinoId == i.Id && u.Activo),
                i.LimiteSucursales,
                i.LimiteUsuarios,
                i.FechaCreacion
            ))
            .ToListAsync();

        return Ok(inquilinos);
    }

    [HttpGet("inquilinos/{id}")]
    public async Task<ActionResult<InquilinoResumenDto>> ObtenerInquilinoPorId(Guid id)
    {
        var inquilino = await _db.Inquilinos
            .IgnoreQueryFilters()
            .Where(i => i.Id == id)
            .Select(i => new InquilinoResumenDto(
                i.Id,
                i.RazonSocial,
                i.NombreComercial,
                i.Ruc,
                i.Subdominio,
                i.DireccionFiscal,
                i.Telefono,
                i.CorreoContacto,
                i.BloqueadoPorMora,
                i.Activo,
                _db.Sucursales.IgnoreQueryFilters().Count(s => s.InquilinoId == i.Id && s.Activo),
                _db.Usuarios.IgnoreQueryFilters().Count(u => u.InquilinoId == i.Id && u.Activo),
                i.LimiteSucursales,
                i.LimiteUsuarios,
                i.FechaCreacion
            ))
            .FirstOrDefaultAsync();

        if (inquilino == null) return NotFound(new { mensaje = "Restaurante cliente no encontrado." });

        return Ok(inquilino);
    }

    [HttpPut("inquilinos/{id}")]
    public async Task<ActionResult> ActualizarInquilino(Guid id, [FromBody] ActualizarInquilinoDto peticion)
    {
        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == id);
        if (inquilino == null) return NotFound(new { mensaje = "Restaurante cliente no encontrado." });

        if (string.IsNullOrWhiteSpace(peticion.NombreComercial))
            return BadRequest(new { mensaje = "El nombre comercial es obligatorio." });

        if (string.IsNullOrWhiteSpace(peticion.RazonSocial))
            return BadRequest(new { mensaje = "La razón social es obligatoria." });

        if (string.IsNullOrWhiteSpace(peticion.Ruc) || peticion.Ruc.Trim().Length != 11)
            return BadRequest(new { mensaje = "El RUC debe tener 11 dígitos numéricos." });

        var subdominioLimpio = peticion.Subdominio?.Trim().ToLower() ?? "";
        if (string.IsNullOrWhiteSpace(subdominioLimpio))
            return BadRequest(new { mensaje = "El subdominio es obligatorio." });

        // Validar subdominio único si cambió
        if (subdominioLimpio != inquilino.Subdominio && await _db.Inquilinos.IgnoreQueryFilters().AnyAsync(i => i.Subdominio == subdominioLimpio && i.Id != id))
        {
            return BadRequest(new { mensaje = "El subdominio ya está siendo utilizado por otro restaurante." });
        }

        inquilino.NombreComercial = peticion.NombreComercial.Trim();
        inquilino.RazonSocial = peticion.RazonSocial.Trim();
        inquilino.Ruc = peticion.Ruc.Trim();
        inquilino.Subdominio = subdominioLimpio;
        inquilino.DireccionFiscal = peticion.DireccionFiscal?.Trim();
        inquilino.Telefono = peticion.Telefono?.Trim();
        inquilino.CorreoContacto = peticion.CorreoContacto?.Trim();
        inquilino.LimiteSucursales = peticion.LimiteSucursales;
        inquilino.LimiteUsuarios = peticion.LimiteUsuarios;
        inquilino.FechaModificacion = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(peticion.NuevaClaveAdmin))
        {
            if (peticion.NuevaClaveAdmin.Trim().Length < 6)
            {
                return BadRequest(new { mensaje = "La nueva contraseña del administrador debe tener al menos 6 caracteres." });
            }

            var admin = await _db.Usuarios.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.InquilinoId == id && u.Rol == RolUsuario.AdminRestaurante)
                ?? await _db.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.InquilinoId == id);

            if (admin != null)
            {
                admin.ClaveHash = BCrypt.Net.BCrypt.HashPassword(peticion.NuevaClaveAdmin.Trim());
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { mensaje = "Datos del restaurante cliente actualizados exitosamente." });
    }

    [HttpGet("inquilinos/{id}/usuarios")]
    public async Task<ActionResult<IEnumerable<object>>> ObtenerUsuariosInquilino(Guid id)
    {
        var usuarios = await _db.Usuarios.IgnoreQueryFilters()
            .Where(u => u.InquilinoId == id)
            .Include(u => u.Sucursal)
            .OrderBy(u => u.Rol)
            .ThenBy(u => u.Nombres)
            .Select(u => new
            {
                u.Id,
                u.Nombres,
                u.Apellidos,
                u.Correo,
                u.Telefono,
                Rol = u.Rol.ToString(),
                u.Activo,
                NombreSucursal = u.Sucursal != null ? u.Sucursal.Nombre : "Todas las Sedes",
                u.FechaCreacion
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPut("inquilinos/{id}/usuarios/{usuarioId}/clave")]
    public async Task<ActionResult> CambiarClaveUsuarioInquilino(Guid id, Guid usuarioId, [FromBody] ResetearClaveDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NuevaClave) || dto.NuevaClave.Trim().Length < 6)
        {
            return BadRequest(new { mensaje = "La nueva contraseña debe tener al menos 6 caracteres." });
        }

        var usuario = await _db.Usuarios.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == usuarioId && u.InquilinoId == id);

        if (usuario == null)
        {
            return NotFound(new { mensaje = "Usuario no encontrado en este restaurante." });
        }

        usuario.ClaveHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevaClave.Trim());
        await _db.SaveChangesAsync();

        return Ok(new { mensaje = $"Contraseña actualizada exitosamente para el usuario {usuario.Nombres} {usuario.Apellidos} ({usuario.Correo})." });
    }

    [HttpDelete("inquilinos/{id}")]
    public async Task<ActionResult> EliminarInquilino(Guid id)
    {
        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == id);
        if (inquilino == null) return NotFound(new { mensaje = "Restaurante cliente no encontrado." });

        // Alternar estado de activación (Soft Delete)
        inquilino.Activo = !inquilino.Activo;
        inquilino.FechaModificacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var estado = inquilino.Activo ? "activado" : "desactivado";
        return Ok(new { mensaje = $"El restaurante cliente ha sido {estado} correctamente.", activo = inquilino.Activo });
    }

    [HttpPost("inquilinos")]
    public async Task<ActionResult<object>> CrearInquilino([FromBody] CrearInquilinoDto peticion)
    {
        var subdominioLimpio = peticion.Subdominio.Trim().ToLower();

        // Validar subdominio único
        if (await _db.Inquilinos.IgnoreQueryFilters().AnyAsync(i => i.Subdominio == subdominioLimpio))
        {
            return BadRequest(new { mensaje = "El subdominio ya está registrado para otro restaurante." });
        }

        // Validar correo de administrador único
        var correoAdminLimpio = peticion.CorreoAdmin.Trim().ToLower();
        if (await _db.Usuarios.IgnoreQueryFilters().AnyAsync(u => u.Correo == correoAdminLimpio))
        {
            return BadRequest(new { mensaje = "El correo del administrador ya está en uso." });
        }

        // 1. Crear Inquilino (Empresa / Marca del Restaurante)
        var inquilino = new Inquilino
        {
            Id = Guid.NewGuid(),
            RazonSocial = peticion.RazonSocial.Trim(),
            NombreComercial = peticion.NombreComercial.Trim(),
            Ruc = peticion.Ruc.Trim(),
            Subdominio = subdominioLimpio,
            DireccionFiscal = peticion.DireccionFiscal,
            Telefono = peticion.Telefono,
            CorreoContacto = peticion.CorreoContacto,
            LimiteSucursales = peticion.LimiteSucursales,
            LimiteUsuarios = peticion.LimiteUsuarios,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Inquilinos.Add(inquilino);

        // 2. Crear la Sucursal Principal por Defecto
        var nombreSucursal = string.IsNullOrWhiteSpace(peticion.NombreSucursalPrincipal) 
            ? "Sede Principal" 
            : peticion.NombreSucursalPrincipal.Trim();

        var sucursalPrincipal = new Sucursal
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilino.Id,
            Codigo = "SUC-01",
            Nombre = nombreSucursal,
            Direccion = peticion.DireccionFiscal,
            Telefono = peticion.Telefono,
            EsPrincipal = true,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        _db.Sucursales.Add(sucursalPrincipal);

        // 3. Crear el Administrador del Restaurante asignado a la empresa
        var adminRestaurante = new Usuario
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilino.Id,
            SucursalId = sucursalPrincipal.Id, // Vinculado a su sede inicial pero con rol multi-sucursal
            Nombres = peticion.NombresAdmin.Trim(),
            Apellidos = peticion.ApellidosAdmin.Trim(),
            Correo = correoAdminLimpio,
            ClaveHash = BCrypt.Net.BCrypt.HashPassword(peticion.ClaveAdmin),
            Rol = RolUsuario.AdminRestaurante,
            Telefono = peticion.Telefono,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Usuarios.Add(adminRestaurante);

        // 4. Crear configuraciones base para la sucursal (Caja y Zona inicial)
        var zonaDefault = new Zona
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilino.Id,
            SucursalId = sucursalPrincipal.Id,
            Nombre = "Salón Principal",
            Activo = true
        };
        _db.Zonas.Add(zonaDefault);

        var cajaDefault = new Caja
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilino.Id,
            SucursalId = sucursalPrincipal.Id,
            Nombre = "Caja Principal",
            Activo = true
        };
        _db.Cajas.Add(cajaDefault);

        // 5. Crear unidades de medida estándar para el restaurante
        _db.UnidadesMedida.AddRange(
            new UnidadMedida { InquilinoId = inquilino.Id, Codigo = "KG", Nombre = "Kilogramos", FactorAUnidadBase = 1 },
            new UnidadMedida { InquilinoId = inquilino.Id, Codigo = "GR", Nombre = "Gramos", FactorAUnidadBase = 0.001m },
            new UnidadMedida { InquilinoId = inquilino.Id, Codigo = "UND", Nombre = "Unidades", FactorAUnidadBase = 1 },
            new UnidadMedida { InquilinoId = inquilino.Id, Codigo = "LT", Nombre = "Litros", FactorAUnidadBase = 1 }
        );

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerInquilinos), new
        {
            mensaje = "Restaurante, Sucursal Principal y Administrador provisionados correctamente.",
            inquilinoId = inquilino.Id,
            nombreRestaurante = inquilino.NombreComercial,
            sucursalId = sucursalPrincipal.Id,
            nombreSucursal = sucursalPrincipal.Nombre,
            subdominio = inquilino.Subdominio,
            adminId = adminRestaurante.Id
        });
    }

    [HttpPut("inquilinos/{id}/alternar-mora")]
    public async Task<ActionResult> AlternarMora(Guid id)
    {
        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == id);
        if (inquilino == null) return NotFound(new { mensaje = "Inquilino no encontrado." });

        inquilino.BloqueadoPorMora = !inquilino.BloqueadoPorMora;
        await _db.SaveChangesAsync();

        return Ok(new { mensaje = $"Estado de mora actualizado. Bloqueado: {inquilino.BloqueadoPorMora}" });
    }

    [HttpPut("inquilinos/{id}/limites-plan")]
    public async Task<ActionResult> ActualizarLimitesPlan(Guid id, [FromBody] ActualizarLimitesPlanDto dto)
    {
        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == id);
        if (inquilino == null) return NotFound(new { mensaje = "Restaurante cliente no encontrado." });

        inquilino.LimiteSucursales = dto.LimiteSucursales;
        inquilino.LimiteUsuarios = dto.LimiteUsuarios;
        inquilino.FechaModificacion = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Límites del plan SaaS actualizados con éxito.",
            limiteSucursales = inquilino.LimiteSucursales,
            limiteUsuarios = inquilino.LimiteUsuarios
        });
    }

    [HttpGet("metricas-globales")]
    public async Task<ActionResult<object>> ObtenerMetricasGlobales()
    {
        var totalRestaurantes = await _db.Inquilinos.IgnoreQueryFilters().CountAsync();
        var totalRestaurantesActivos = await _db.Inquilinos.IgnoreQueryFilters().CountAsync(i => i.Activo && !i.BloqueadoPorMora);
        var totalUsuariosRegistrados = await _db.Usuarios.IgnoreQueryFilters().CountAsync();
        var totalVentasGlobales = await _db.ComprobantesPago.IgnoreQueryFilters().SumAsync(c => c.Total);
        var totalComandasEmitidas = await _db.Comandas.IgnoreQueryFilters().CountAsync();

        return Ok(new
        {
            totalRestaurantes,
            totalRestaurantesActivos,
            totalUsuariosRegistrados,
            totalVentasGlobales,
            totalComandasEmitidas
        });
    }
}
