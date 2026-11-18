using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Hubs;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/mesas")]
[Authorize]
public class MesasControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;
    private readonly IHubContext<MesasHub> _hubMesas;

    public MesasControlador(
        RestauranteDbContext db,
        IInquilinoProveedor inquilinoProveedor,
        IHubContext<MesasHub> hubMesas)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
        _hubMesas = hubMesas;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MesaDto>>> ObtenerMesas([FromQuery] Guid? zonaId, [FromQuery] Guid? sucursalId)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        // Determinar sucursal: del empleado en token o del query param (para admin)
        var sucursalFiltro = sucursalId ?? _inquilinoProveedor.ObtenerSucursalId();

        var query = _db.Mesas
            .Where(m => m.InquilinoId == inquilinoId && m.Activo)
            .Include(m => m.Zona)
            .Include(m => m.Comandas.Where(c => c.Estado == EstadoComanda.Abierta))
                .ThenInclude(c => c.Usuario)
            .AsQueryable();

        if (sucursalFiltro.HasValue)
        {
            query = query.Where(m => m.Zona.SucursalId == sucursalFiltro.Value);
        }

        if (zonaId.HasValue)
        {
            query = query.Where(m => m.ZonaId == zonaId.Value);
        }

        var mesas = await query
            .OrderBy(m => m.Zona.Nombre)
            .ThenBy(m => m.CodigoMesa)
            .Select(m => new MesaDto(
                m.Id,
                m.ZonaId,
                m.Zona.Nombre,
                m.CodigoMesa,
                m.CapacidadComensales,
                m.Estado,
                m.PosicionX,
                m.PosicionY,
                m.Comandas.Where(c => c.Estado == EstadoComanda.Abierta).Select(c => (Guid?)c.Id).FirstOrDefault(),
                m.Comandas.Where(c => c.Estado == EstadoComanda.Abierta).Select(c => c.Total).FirstOrDefault(),
                m.Comandas.Where(c => c.Estado == EstadoComanda.Abierta).Select(c => $"{c.Usuario.Nombres} {c.Usuario.Apellidos}").FirstOrDefault(),
                m.Comandas.Where(c => c.Estado == EstadoComanda.Abierta).Select(c => (DateTime?)c.FechaCreacion).FirstOrDefault()
            ))
            .ToListAsync();

        return Ok(mesas);
    }

    [HttpGet("zonas")]
    public async Task<ActionResult<IEnumerable<object>>> ObtenerZonas([FromQuery] Guid? sucursalId)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var sucursalFiltro = sucursalId ?? _inquilinoProveedor.ObtenerSucursalId();

        var query = _db.Zonas
            .Where(z => z.InquilinoId == inquilinoId && z.Activo)
            .AsQueryable();

        if (sucursalFiltro.HasValue)
        {
            query = query.Where(z => z.SucursalId == sucursalFiltro.Value);
        }

        var zonas = await query
            .Select(z => new
            {
                z.Id,
                z.SucursalId,
                z.Nombre,
                TotalMesas = z.Mesas.Count(m => m.Activo)
            })
            .ToListAsync();

        return Ok(zonas);
    }

    [HttpPut("{id}/posicion")]
    public async Task<ActionResult> ActualizarPosicion(Guid id, [FromBody] ActualizarPosicionMesaDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var mesa = await _db.Mesas.FirstOrDefaultAsync(m => m.Id == id && m.InquilinoId == inquilinoId);

        if (mesa == null) return NotFound(new { mensaje = "Mesa no encontrada." });

        mesa.PosicionX = peticion.PosicionX;
        mesa.PosicionY = peticion.PosicionY;
        await _db.SaveChangesAsync();

        // Notificar en tiempo real a todos los clientes del restaurante
        await _hubMesas.Clients.Group($"inquilino_{inquilinoId}").SendAsync("MesaMovida", new
        {
            mesaId = mesa.Id,
            posicionX = mesa.PosicionX,
            posicionY = mesa.PosicionY
        });

        return Ok(new { mensaje = "Posición actualizada." });
    }

    [HttpPut("{id}/estado")]
    public async Task<ActionResult> CambiarEstado(Guid id, [FromBody] CambiarEstadoMesaDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var mesa = await _db.Mesas.FirstOrDefaultAsync(m => m.Id == id && m.InquilinoId == inquilinoId);

        if (mesa == null) return NotFound(new { mensaje = "Mesa no encontrada." });

        mesa.Estado = peticion.NuevoEstado;
        await _db.SaveChangesAsync();

        // Notificar en tiempo real
        await _hubMesas.Clients.Group($"inquilino_{inquilinoId}").SendAsync("MesaActualizada", new
        {
            mesaId = mesa.Id,
            nuevoEstado = mesa.Estado
        });

        return Ok(new { mensaje = "Estado de mesa actualizado.", estado = mesa.Estado });
    }
}
