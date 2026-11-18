import React from 'react';
import { useAlmacenAutenticacion } from '../estado/almacenAutenticacion';
import { Store, Wifi, Calendar, Sparkles } from 'lucide-react';

interface BarraSuperiorProps {
  titulo: string;
  subtitulo?: string;
}

export const BarraSuperior: React.FC<BarraSuperiorProps> = ({ titulo, subtitulo }) => {
  const { usuario, sucursalActivaId, sucursalesDisponibles } = useAlmacenAutenticacion();

  const sucursalActual = sucursalesDisponibles.find((s) => s.id === sucursalActivaId);
  const nombreSede = sucursalActual?.nombre || usuario?.nombreSucursal || 'Sede Principal';

  const fechaActual = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="h-20 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 shadow-sm">
      {/* Título de la sección */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
          {titulo}
        </h2>
        {subtitulo && <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitulo}</p>}
      </div>

      {/* Indicadores de contexto */}
      <div className="flex items-center gap-4">
        {/* Indicador de Sede / Sucursal */}
        {usuario?.rol !== 'SuperAdmin' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <Store className="w-4 h-4 text-orange-600" />
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Local Activo</span>
              <span className="font-bold text-slate-800">{nombreSede}</span>
            </div>
          </div>
        )}

        {/* Indicador de Fecha */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 capitalize">{fechaActual}</span>
        </div>

        {/* Estado SignalR en Vivo */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/70 rounded-xl text-emerald-800 text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>SignalR Sincronizado</span>
        </div>
      </div>
    </header>
  );
};
