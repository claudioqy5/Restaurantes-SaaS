using Microsoft.AspNetCore.SignalR;

namespace Restaurante.Api.Hubs;

public class MesasHub : Hub
{
    public async Task UnirseASalon(string inquilinoId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"inquilino_{inquilinoId}");
    }

    public async Task SalirDeSalon(string inquilinoId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"inquilino_{inquilinoId}");
    }
}

public class CocinaHub : Hub
{
    public async Task UnirseACocina(string inquilinoId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"cocina_{inquilinoId}");
    }

    public async Task SalirDeCocina(string inquilinoId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"cocina_{inquilinoId}");
    }
}
