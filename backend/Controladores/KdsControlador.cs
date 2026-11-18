using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Datos;
using Restaurante.Api.Dtos;
using Restaurante.Api.Hubs;
using Restaurante.Api.Modelos;
using Restaurante.Api.Servicios;

namespace Restaurante.Api.Controladores;

[ApiController]
[Route("api/kds")]
[Authorize]
public class KdsControlador : ControllerBase
{
    private readonly RestauranteDbContext _db;
    private readonly IInquilinoProveedor _inquilinoProveedor;
    private readonly IServicioInventario _servicioInventario;
    private readonly IHubContext<CocinaHub> _hubCocina;

    public KdsControlador(
        RestauranteDbContext db,
        IInquilinoProveedor inquilinoProveedor,
        IServicioInventario servicioInventario,
        IHubContext<CocinaHub> hubCocina)
    {
        _db = db;
        _inquilinoProveedor = inquilinoProveedor;
        _servicioInventario = servicioInventario;
        _hubCocina = hubCocina;
    }

    [HttpGet("tickets")]
    public async Task<ActionResult<IEnumerable<TicketKdsDto>>> ObtenerTicketsActivos()
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        if (inquilinoId == null) return Unauthorized();

        var ahora = DateTime.UtcNow;

        var tickets = await _db.DetallesComandas
            .Where(d => d.InquilinoId == inquilinoId && 
                        d.EstadoKds != EstadoKDS.Entregado && 
                        d.EstadoKds != EstadoKDS.Cancelado &&
                        d.Comanda.Estado == EstadoComanda.Abierta)
            .Include(d => d.Comanda)
                .ThenInclude(c => c.Mesa)
            .Include(d => d.Plato)
            .OrderBy(d => d.FechaCreacion)
            .Select(d => new TicketKdsDto(
                d.Id,
                d.ComandaId,
                d.Comanda.NumeroComandaDia,
                d.Comanda.Mesa.CodigoMesa,
                d.Plato.Nombre,
                d.Cantidad,
                d.NotasCocina,
                d.EstadoKds,
                d.FechaCreacion,
                (int)(ahora - d.FechaCreacion).TotalMinutes
            ))
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpPut("tickets/{detalleId}/estado")]
    public async Task<ActionResult> CambiarEstadoTicket(Guid detalleId, [FromBody] CambiarEstadoKdsDto peticion)
    {
        var inquilinoId = _inquilinoProveedor.ObtenerInquilinoId();
        var usuarioId = _inquilinoProveedor.ObtenerUsuarioId();

        var detalle = await _db.DetallesComandas
            .Include(d => d.Plato)
            .Include(d => d.Comanda)
                .ThenInclude(c => c.Mesa)
            .FirstOrDefaultAsync(d => d.Id == detalleId && d.InquilinoId == inquilinoId);

        if (detalle == null) return NotFound(new { mensaje = "Ticket no encontrado." });

        var estadoAnterior = detalle.EstadoKds;
        detalle.EstadoKds = peticion.NuevoEstado;

        if (peticion.NuevoEstado == EstadoKDS.Preparando && estadoAnterior == EstadoKDS.Pendiente)
        {
            detalle.FechaInicioCoccion = DateTime.UtcNow;

            // Descuento automático de inventario mediante recetas
            await _servicioInventario.DescontarStockPorRecetaAsync(detalle.Id, usuarioId);
        }
        else if (peticion.NuevoEstado == EstadoKDS.Listo)
        {
            detalle.FechaPlatoListo = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        // Notificar en tiempo real a cocina
        await _hubCocina.Clients.Group($"cocina_{inquilinoId}").SendAsync("TicketCocinaActualizado", new
        {
            detalleComandaId = detalle.Id,
            comandaId = detalle.ComandaId,
            nuevoEstado = detalle.EstadoKds,
            codigoMesa = detalle.Comanda.Mesa.CodigoMesa,
            platoNombre = detalle.Plato.Nombre
        });

        return Ok(new { mensaje = "Estado de cocina actualizado.", nuevoEstado = detalle.EstadoKds });
    }
}
