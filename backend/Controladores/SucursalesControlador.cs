using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/sucursales")]
[Authorize]
public class SucursalesControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;

    public SucursalesControlador(RestauranteDbContext db, IInquilinoProveedor inquilinoProveedor)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SucursalResumenDto>>> ObtenerSucursales()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var sucursales = await _db.Sucursales
            .Where(s => s.InquilinoId == inquilinoId && s.Activo)
            .OrderByDescending(s => s.EsPrincipal)
            .ThenBy(s => s.Nombre)
            .Select(s => new SucursalResumenDto(
                s.Id,
                s.Codigo,
                s.Nombre,
                s.Direccion,
                s.Telefono,
                s.EsPrincipal,
                s.Zonas.Count(z => z.Activo),
                s.Zonas.SelectMany(z => z.Mesas).Count(m => m.Activo),
                s.UsuariosAsignados.Count(u => u.Activo),
                s.Activo
            ))
            .ToListAsync();

        return Ok(sucursales);
    }

    [HttpGet("estado-plan")]
    public async Task<ActionResult<EstadoPlanInquilinoDto>> ObtenerEstadoPlan()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == inquilinoId.Value);
        if (inquilino == null) return NotFound();

        var sucursalesActuales = await _db.Sucursales.CountAsync(s => s.InquilinoId == inquilinoId.Value && s.Activo);
        var usuariosActuales = await _db.Usuarios.CountAsync(u => u.InquilinoId == inquilinoId.Value && u.Activo);

        var limiteSucursalesAlcanzado = inquilino.LimiteSucursales.HasValue && inquilino.LimiteSucursales.Value > 0 && sucursalesActuales >= inquilino.LimiteSucursales.Value;
        var limiteUsuariosAlcanzado = inquilino.LimiteUsuarios.HasValue && inquilino.LimiteUsuarios.Value > 0 && usuariosActuales >= inquilino.LimiteUsuarios.Value;

        return Ok(new EstadoPlanInquilinoDto(
            sucursalesActuales,
            inquilino.LimiteSucursales,
            limiteSucursalesAlcanzado,
            usuariosActuales,
            inquilino.LimiteUsuarios,
            limiteUsuariosAlcanzado
        ));
    }

    [HttpPost]
    [Authorize(Roles = "AdminRestaurante,SuperAdmin")]
    public async Task<ActionResult<object>> CrearSucursal([FromBody] CrearSucursalDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        // Validar límite de sucursales configurado por el SuperAdmin
        var inquilino = await _db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == inquilinoId.Value);
        if (inquilino == null) return Unauthorized();

        if (inquilino.LimiteSucursales.HasValue && inquilino.LimiteSucursales.Value > 0)
        {
            var sucursalesActuales = await _db.Sucursales.CountAsync(s => s.InquilinoId == inquilinoId.Value && s.Activo);
            if (sucursalesActuales >= inquilino.LimiteSucursales.Value)
            {
                return BadRequest(new
                {
                    mensaje = $"Ha alcanzado el límite máximo de {inquilino.LimiteSucursales.Value} sucursal(es) contratadas en su plan SaaS. Por favor contacte a su asesor para ampliar su suscripción."
                });
            }
        }

        // Validar código único dentro del restaurante
        if (await _db.Sucursales.AnyAsync(s => s.InquilinoId == inquilinoId && s.Codigo == peticion.Codigo.Trim().ToUpper()))
        {
            return BadRequest(new { mensaje = "El código de sucursal ya existe en este restaurante." });
        }

        var nuevaSucursal = new Sucursal
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            Codigo = peticion.Codigo.Trim().ToUpper(),
            Nombre = peticion.Nombre.Trim(),
            Direccion = peticion.Direccion?.Trim(),
            Telefono = peticion.Telefono?.Trim(),
            EsPrincipal = false,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Sucursales.Add(nuevaSucursal);

        // Crear zona y caja por defecto para la nueva sucursal
        var zonaDefault = new Zona
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            SucursalId = nuevaSucursal.Id,
            Nombre = "Salón Principal",
            Activo = true
        };
        _db.Zonas.Add(zonaDefault);

        var cajaDefault = new Caja
        {
            Id = Guid.NewGuid(),
            InquilinoId = inquilinoId.Value,
            SucursalId = nuevaSucursal.Id,
            Nombre = $"Caja - {nuevaSucursal.Nombre}",
            Activo = true
        };
        _db.Cajas.Add(cajaDefault);

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerSucursales), new
        {
            mensaje = "Nueva sucursal creada con éxito.",
            sucursalId = nuevaSucursal.Id,
            nombre = nuevaSucursal.Nombre,
            codigo = nuevaSucursal.Codigo
        });
    }
}
