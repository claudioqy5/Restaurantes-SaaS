import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { servicioSignalR } from '../../servicios/signalrServicio';
import { useAlmacenAutenticacion } from '../../estado/almacenAutenticacion';
import { Mesa, Zona, EstadoMesa } from '../../tipos/modelos';
import { ModalComanda } from './ModalComanda';
import {
  Users,
  Utensils,
  Receipt,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  UserCheck
} from 'lucide-react';

export const MapaMesasSalon: React.FC = () => {
  const { sucursalActivaId } = useAlmacenAutenticacion();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [zonaActivaId, setZonaActivaId] = useState<string | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modal para tomar pedido
  const [mesaParaComanda, setMesaParaComanda] = useState<Mesa | null>(null);

  useEffect(() => {
    cargarZonasYMesas();

    // Conectar a SignalR para actualización de mesas en tiempo real
    servicioSignalR.conectarMesas(
      (datos) => {
        // Al actualizar estado de mesa
        setMesas((prev) =>
          prev.map((m) =>
            m.id === datos.mesaId
              ? {
                  ...m,
                  estado: datos.nuevoEstado,
                  totalComandaActiva: datos.total ?? m.totalComandaActiva,
                }
              : m
          )
        );
      },
      (datos) => {
        // Al mover mesa
        setMesas((prev) =>
          prev.map((m) =>
            m.id === datos.mesaId
              ? { ...m, posicionX: datos.posicionX, posicionY: datos.posicionY }
              : m
          )
        );
      }
    );
  }, [sucursalActivaId]);

  const cargarZonasYMesas = async () => {
    setCargando(true);
    try {
      const [resZonas, resMesas] = await Promise.all([
        clienteApi.get<Zona[]>('/mesas/zonas'),
        clienteApi.get<Mesa[]>('/mesas'),
      ]);

      setZonas(resZonas.data);
      setMesas(resMesas.data);

      if (resZonas.data.length > 0) {
        setZonaActivaId(resZonas.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando mesas del salón:', err);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoMesa = async (mesaId: string, nuevoEstado: EstadoMesa) => {
    try {
      await clienteApi.put(`/mesas/${mesaId}/estado`, {
        mesaId,
        nuevoEstado,
      });

      setMesas((prev) =>
        prev.map((m) => (m.id === mesaId ? { ...m, estado: nuevoEstado } : m))
      );
    } catch (err) {
      console.error('Error al cambiar estado de mesa:', err);
    }
  };

  const mesasDeLaZona = zonaActivaId
    ? mesas.filter((m) => m.zonaId === zonaActivaId)
    : mesas;

  // Renderizador de estilos según el estado de la mesa (Tema Claro Premium)
  const obtenerEstiloEstado = (estado: EstadoMesa) => {
    switch (estado) {
      case 'Libre':
        return {
          fondo: 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200 text-emerald-800',
          indicador: 'bg-emerald-500',
          badge: 'bg-emerald-100/70 text-emerald-800 border border-emerald-200',
          textoEstado: 'Mesa Libre',
        };
      case 'Ocupada':
        return {
          fondo: 'bg-amber-50/60 hover:bg-amber-50 border-amber-300 text-amber-900',
          indicador: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-900 border border-amber-200',
          textoEstado: 'Mesa Ocupada',
        };
      case 'EsperandoCuenta':
        return {
          fondo: 'bg-purple-50/60 hover:bg-purple-50 border-purple-300 text-purple-900',
          indicador: 'bg-purple-500',
          badge: 'bg-purple-100 text-purple-900 border border-purple-200',
          textoEstado: 'Pidiendo Cuenta',
        };
      default:
        return {
          fondo: 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800',
          indicador: 'bg-slate-400',
          badge: 'bg-slate-100 text-slate-700 border border-slate-200',
          textoEstado: estado,
        };
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Barra de Filtro de Zonas y Leyenda */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Selector de Zonas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-100 text-slate-400">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Zonas:</span>
          </div>

          {zonas.map((zona) => (
            <button
              key={zona.id}
              onClick={() => setZonaActivaId(zona.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                zonaActivaId === zona.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {zona.nombre} ({zona.totalMesas})
            </button>
          ))}
        </div>

        {/* Leyenda de Estados */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Esperando Cuenta</span>
          </div>
        </div>
      </div>

      {/* Grilla Interactiva de Mesas */}
      {cargando ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-sm font-semibold">Cargando salón interactivo...</p>
        </div>
      ) : mesasDeLaZona.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200 text-center p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No hay mesas en esta zona</h4>
          <p className="text-xs text-slate-500 mt-1">Seleccione otra zona o agregue mesas desde configuración.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mesasDeLaZona.map((mesa) => {
            const estilo = obtenerEstiloEstado(mesa.estado);

            return (
              <div
                key={mesa.id}
                className={`p-5 rounded-3xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${estilo.fondo}`}
              >
                {/* Cabecera de la Mesa */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      {mesa.codigoMesa}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${estilo.badge}`}>
                      {estilo.textoEstado}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Capacidad: {mesa.capacidadComensales} comensales</span>
                  </div>

                  {/* Datos de Comanda Activa si está ocupada */}
                  {mesa.estado !== 'Libre' && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Consumo:</span>
                        <span className="font-extrabold text-slate-900">
                          S/ {mesa.totalComandaActiva.toFixed(2)}
                        </span>
                      </div>

                      {mesa.meseroNombre && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                          <span className="truncate">Atiende: {mesa.meseroNombre}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de Acción Inmediata */}
                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                  {mesa.estado === 'Libre' && (
                    <button
                      onClick={() => setMesaParaComanda(mesa)}
                      className="w-full py-2.5 px-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Abrir Comanda</span>
                    </button>
                  )}

                  {mesa.estado === 'Ocupada' && (
                    <>
                      <button
                        onClick={() => setMesaParaComanda(mesa)}
                        className="flex-1 py-2 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Utensils className="w-3.5 h-3.5 text-orange-600" />
                        <span>+ Platos</span>
                      </button>
                      <button
                        onClick={() => cambiarEstadoMesa(mesa.id, 'EsperandoCuenta')}
                        className="flex-1 py-2 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Receipt className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Cuenta</span>
                      </button>
                    </>
                  )}

                  {mesa.estado === 'EsperandoCuenta' && (
                    <button
                      onClick={() => cambiarEstadoMesa(mesa.id, 'Libre')}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Liberar Mesa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Abrir Pedido / Comanda */}
      {mesaParaComanda && (
        <ModalComanda
          mesaId={mesaParaComanda.id}
          codigoMesa={mesaParaComanda.codigoMesa}
          alCerrar={() => setMesaParaComanda(null)}
          alComandaCreada={() => {
            setMesaParaComanda(null);
            cargarZonasYMesas();
          }}
        />
      )}
    </div>
  );
};
