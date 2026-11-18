import React from 'react';
import { useAlmacenAutenticacion } from '../estado/almacenAutenticacion';
import {
  UtensilsCrossed,
  LayoutGrid,
  Flame,
  Receipt,
  Boxes,
  Users,
  Store,
  Building2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Coffee,
  ChefHat,
  Banknote
} from 'lucide-react';

interface BarraLateralProps {
  seccionActiva: string;
  alSeleccionarSeccion: (seccion: string) => void;
}

export const BarraLateral: React.FC<BarraLateralProps> = ({
  seccionActiva,
  alSeleccionarSeccion,
}) => {
  const { usuario, cerrarSesion, sucursalesDisponibles, sucursalActivaId, establecerSucursalActiva } = useAlmacenAutenticacion();

  if (!usuario) return null;

  const esSuperAdmin = usuario.rol === 'SuperAdmin';
  const esAdmin = usuario.rol === 'AdminRestaurante';

  // Ícono de rol con SVG
  const renderIconoRol = () => {
    switch (usuario.rol) {
      case 'SuperAdmin': return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'AdminRestaurante': return <UserCheck className="w-4 h-4 text-orange-600" />;
      case 'Mesero': return <Coffee className="w-4 h-4 text-emerald-600" />;
      case 'Cocinero': return <ChefHat className="w-4 h-4 text-amber-600" />;
      case 'Cajero': return <Banknote className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const elementosMenu = [];

  if (esSuperAdmin) {
    elementosMenu.push(
      { id: 'superadmin', etiqueta: 'Clientes SaaS', icono: Building2 }
    );
  } else {
    // Si es Admin, Mesero o Cajero
    if (usuario.rol === 'AdminRestaurante' || usuario.rol === 'Mesero' || usuario.rol === 'Cajero') {
      elementosMenu.push({ id: 'pos', etiqueta: 'Salón y Mesas', icono: LayoutGrid });
    }

    // Si es Cocinero o Admin
    if (usuario.rol === 'AdminRestaurante' || usuario.rol === 'Cocinero' || usuario.rol === 'Mesero') {
      elementosMenu.push({ id: 'kds', etiqueta: 'Pantalla Cocina (KDS)', icono: Flame });
    }

    // Si es Cajero o Admin
    if (usuario.rol === 'AdminRestaurante' || usuario.rol === 'Cajero') {
      elementosMenu.push({ id: 'caja', etiqueta: 'Caja y Facturación', icono: Receipt });
    }

    // Solo para Admin de Restaurante
    if (esAdmin) {
      elementosMenu.push(
        { id: 'inventario', etiqueta: 'Inventario y Recetas', icono: Boxes },
        { id: 'sucursales', etiqueta: 'Sucursales', icono: Store },
        { id: 'usuarios', etiqueta: 'Empleados y Ventas', icono: Users }
      );
    }
  }

  return (
    <aside className="w-72 bg-white border-r border-slate-200/90 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Cabecera / Identidad de Marca */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/70 flex items-center justify-center text-orange-600 shadow-sm">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
              Resto<span className="text-orange-600">POS</span>
            </h1>
            <p className="text-xs font-medium text-slate-400">
              {esSuperAdmin ? 'Plataforma SaaS Matriz' : (usuario.nombreRestaurante || 'Panel Gastronómico')}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Sucursal Activa (Para Administradores con múltiples locales) */}
      {esAdmin && sucursalesDisponibles.length > 0 && (
        <div className="px-5 pt-4 pb-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Sucursal Activa
          </label>
          <div className="relative">
            <select
              value={sucursalActivaId || ''}
              onChange={(e) => establecerSucursalActiva(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              {sucursalesDisponibles.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre} {suc.esPrincipal ? '(Matriz)' : ''}
                </option>
              ))}
            </select>
            <Store className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Para trabajadores fijos, muestra la sucursal asignada */}
      {!esSuperAdmin && !esAdmin && usuario.nombreSucursal && (
        <div className="px-5 pt-4 pb-1">
          <div className="bg-orange-50/70 border border-orange-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
            <Store className="w-4 h-4 text-orange-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-orange-700 block tracking-wide">Sede Asignada</span>
              <span className="text-xs font-semibold text-slate-800 truncate block">{usuario.nombreSucursal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Menú de Navegación */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos del Sistema
        </div>
        {elementosMenu.map((item) => {
          const Icono = item.icono;
          const estaActivo = seccionActiva === item.id;

          return (
            <button
              key={item.id}
              onClick={() => alSeleccionarSeccion(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                estaActivo
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icono
                  className={`w-5 h-5 transition-transform group-hover:scale-105 stroke-[2] ${
                    estaActivo ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>{item.etiqueta}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  estaActivo ? 'text-white/80 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Pie con Perfil de Usuario y Botón de Salida */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200">
              {usuario.nombres[0]}
              {usuario.apellidos[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {usuario.nombres} {usuario.apellidos}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {renderIconoRol()}
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  {usuario.rol}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-200/80 bg-rose-50/50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
