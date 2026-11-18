import * as signalR from '@microsoft/signalr';
import { useAlmacenAutenticacion } from '../estado/almacenAutenticacion';

class SignalRServicio {
  private conexionMesas: signalR.HubConnection | null = null;
  private conexionCocina: signalR.HubConnection | null = null;

  public async conectarMesas(alActualizarMesa: (datos: any) => void, alMoverMesa: (datos: any) => void) {
    if (this.conexionMesas?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = useAlmacenAutenticacion.getState().usuario?.token;
    const inquilinoId = useAlmacenAutenticacion.getState().usuario?.inquilinoId;

    this.conexionMesas = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/mesas', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    this.conexionMesas.on('MesaActualizada', alActualizarMesa);
    this.conexionMesas.on('MesaMovida', alMoverMesa);

    try {
      await this.conexionMesas.start();
      if (inquilinoId) {
        await this.conexionMesas.invoke('UnirseASalon', inquilinoId);
      }
    } catch (error) {
      console.warn('No se pudo conectar a SignalR Mesas:', error);
    }
  }

  public async conectarCocina(alRecibirTickets: (tickets: any) => void, alActualizarTicket: (datos: any) => void) {
    if (this.conexionCocina?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = useAlmacenAutenticacion.getState().usuario?.token;
    const inquilinoId = useAlmacenAutenticacion.getState().usuario?.inquilinoId;

    this.conexionCocina = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/cocina', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    this.conexionCocina.on('NuevosTicketsCocina', alRecibirTickets);
    this.conexionCocina.on('TicketCocinaActualizado', alActualizarTicket);

    try {
      await this.conexionCocina.start();
      if (inquilinoId) {
        await this.conexionCocina.invoke('UnirseACocina', inquilinoId);
      }
    } catch (error) {
      console.warn('No se pudo conectar a SignalR Cocina:', error);
    }
  }

  public desconectar() {
    this.conexionMesas?.stop();
    this.conexionCocina?.stop();
    this.conexionMesas = null;
    this.conexionCocina = null;
  }
}

export const servicioSignalR = new SignalRServicio();
