import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { servicioSignalR } from '../../servicios/signalrServicio';
import { TicketKds, EstadoKDS } from '../../tipos/modelos';
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  CheckCheck,
  Utensils
} from 'lucide-react';

export const PantallaCocina: React.FC = () => {
  const [tickets, setTickets] = useState<TicketKds[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarTickets();

    // Conectar a SignalR Cocina en tiempo real
    servicioSignalR.conectarCocina(
      (nuevosTickets: TicketKds[]) => {
        setTickets((prev) => [...nuevosTickets, ...prev]);
      },
      (datos) => {
        setTickets((prev) =>
          prev
            .map((t) =>
              t.detalleComandaId === datos.detalleComandaId
                ? { ...t, estadoKds: datos.nuevoEstado }
                : t
            )
            .filter((t) => t.estadoKds !== 'Entregado')
        );
      }
    );

    // Temporizador cada 60s para refrescar los minutos transcurridos
    const interval = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => ({
          ...t,
          minutosTranscurridos: t.minutosTranscurridos + 1,
        }))
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const cargarTickets = async () => {
    setCargando(true);
    try {
      const respuesta = await clienteApi.get<TicketKds[]>('/kds/tickets');
      setTickets(respuesta.data);
    } catch (err) {
      console.error('Error cargando tickets KDS:', err);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoTicket = async (detalleComandaId: string, nuevoEstado: EstadoKDS) => {
    try {
      await clienteApi.put(`/kds/tickets/${detalleComandaId}/estado`, {
        detalleComandaId,
        nuevoEstado,
      });

      if (nuevoEstado === 'Entregado') {
        setTickets((prev) => prev.filter((t) => t.detalleComandaId !== detalleComandaId));
      } else {
        setTickets((prev) =>
          prev.map((t) =>
            t.detalleComandaId === detalleComandaId
              ? { ...t, estadoKds: nuevoEstado }
              : t
          )
        );
      }
    } catch (err) {
      console.error('Error al actualizar estado KDS:', err);
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
    if (filtroEstado === 'TODOS') return true;
    return t.estadoKds === filtroEstado;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Cabecera y Filtros de Estado */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-orange-600">
            <Flame className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Kitchen Display System (KDS)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Gestión visual de tiempos de preparación y despacho de comandas
            </p>
          </div>
        </div>

        {/* Botones de Filtro */}
        <div className="flex items-center gap-2">
          {['TODOS', 'Pendiente', 'Preparando', 'Listo'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === estado
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {estado === 'TODOS' ? 'Todos los Tickets' : estado}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Tickets de Cocina */}
      {cargando ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-sm font-semibold">Cargando comandas en cocina...</p>
        </div>
      ) : ticketsFiltrados.length === 0 ? (
        <div className="py-24 bg-white rounded-3xl border border-slate-200 text-center p-8">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">Cocina al día</h4>
          <p className="text-xs text-slate-500 mt-1">No hay tickets pendientes de preparación en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {ticketsFiltrados.map((ticket) => {
            const esUrgente = ticket.minutosTranscurridos >= 15;
            const esCritico = ticket.minutosTranscurridos >= 25;

            return (
              <div
                key={ticket.detalleComandaId}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Barra superior de estado */}
                <div
                  className={`px-4 py-2.5 flex items-center justify-between text-xs font-bold border-b ${
                    ticket.estadoKds === 'Pendiente'
                      ? 'bg-amber-50 text-amber-800 border-amber-100'
                      : ticket.estadoKds === 'Preparando'
                      ? 'bg-blue-50 text-blue-800 border-blue-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900">{ticket.codigoMesa}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Comanda #{ticket.numeroComandaDia}</span>
                  </div>

                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    esCritico
                      ? 'bg-rose-600 text-white animate-pulse'
                      : esUrgente
                      ? 'bg-amber-600 text-white'
                      : 'bg-white/80 text-slate-700'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{ticket.minutosTranscurridos} min</span>
                  </div>
                </div>

                {/* Detalle del Plato */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                      {ticket.platoNombre}
                    </h4>
                    <span className="w-8 h-8 rounded-xl bg-orange-100/70 border border-orange-200 text-orange-700 font-black text-sm flex items-center justify-center shrink-0">
                      x{ticket.cantidad}
                    </span>
                  </div>

                  {ticket.notasCocina && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{ticket.notasCocina}</span>
                    </div>
                  )}

                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Estado: <span className="text-slate-800">{ticket.estadoKds}</span>
                  </div>
                </div>

                {/* Botón de Cambio de Estado en Cocina */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                  {ticket.estadoKds === 'Pendiente' && (
                    <button
                      onClick={() => actualizarEstadoTicket(ticket.detalleComandaId, 'Preparando')}
                      className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Empezar a Preparar</span>
                    </button>
                  )}

                  {ticket.estadoKds === 'Preparando' && (
                    <button
                      onClick={() => actualizarEstadoTicket(ticket.detalleComandaId, 'Listo')}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Marcar como Listo</span>
                    </button>
                  )}

                  {ticket.estadoKds === 'Listo' && (
                    <button
                      onClick={() => actualizarEstadoTicket(ticket.detalleComandaId, 'Entregado')}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4 stroke-[2.2]" />
                      <span>Despachar / Entregar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
