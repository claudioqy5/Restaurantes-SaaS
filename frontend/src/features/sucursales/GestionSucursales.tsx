import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { SucursalResumen, EstadoPlanInquilino } from '../../tipos/modelos';
import {
  Store,
  Plus,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Phone,
  X
} from 'lucide-react';

export const GestionSucursales: React.FC = () => {
  const [sucursales, setSucursales] = useState<SucursalResumen[]>([]);
  const [estadoPlan, setEstadoPlan] = useState<EstadoPlanInquilino | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario de Nueva Sucursal
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resSucursales, resPlan] = await Promise.all([
        clienteApi.get<SucursalResumen[]>('/sucursales'),
        clienteApi.get<EstadoPlanInquilino>('/sucursales/estado-plan'),
      ]);
      setSucursales(resSucursales.data);
      setEstadoPlan(resPlan.data);
    } catch (err) {
      console.error('Error cargando sucursales:', err);
    } finally {
      setCargando(false);
    }
  };

  const crearSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      await clienteApi.post('/sucursales', {
        codigo,
        nombre,
        direccion,
        telefono,
      });

      setMensaje(`Sucursal "${nombre}" creada con éxito.`);
      setMostrarModal(false);
      setCodigo('');
      setNombre('');
      setDireccion('');
      setTelefono('');
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al crear la sucursal.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Alertas */}
      {mensaje && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{mensaje}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="text-emerald-700 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Alerta de Límite de Plan Alcanzado */}
      {estadoPlan?.limiteSucursalesAlcanzado && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Has alcanzado el límite contratado de <strong>{estadoPlan.sucursalesActuales} de {estadoPlan.limiteSucursales} sucursal(es)</strong>. Para aperturar más sedes comerciales, solicita una ampliación de tu plan con el Super Administrador del SaaS.
            </span>
          </div>
        </div>
      )}

      {/* Cabecera y Botón de Nueva Sucursal */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Store className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Sedes y Sucursales de tu Restaurante</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administra múltiples locales físicos, su personal y sus salones de mesas independientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {estadoPlan && (
            <span className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80">
              Cupo Plan: <span className="font-black text-slate-900">{estadoPlan.sucursalesActuales}</span> / {estadoPlan.limiteSucursales ? `${estadoPlan.limiteSucursales} sedes` : 'Ilimitado'}
            </span>
          )}

          <button
            disabled={estadoPlan?.limiteSucursalesAlcanzado}
            onClick={() => setMostrarModal(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
              estadoPlan?.limiteSucursalesAlcanzado
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 cursor-pointer active:scale-[0.98]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Aperturar Nueva Sucursal</span>
          </button>
        </div>
      </div>

      {/* Grilla de Tarjetas de Sucursal */}
      {cargando ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-sm font-semibold">Cargando sucursales...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((suc) => (
            <div
              key={suc.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/70 flex items-center justify-center text-orange-600">
                    <Store className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {suc.esPrincipal ? (
                    <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      Sede Matriz Principal
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {suc.codigo}
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-lg">{suc.nombre}</h4>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-medium">
                  {suc.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{suc.direccion}</span>
                    </div>
                  )}
                  {suc.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{suc.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicadores de Capacidad en la Sucursal */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Zonas</span>
                  <span className="text-sm font-black text-slate-900">{suc.totalZonas}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Mesas</span>
                  <span className="text-sm font-black text-slate-900">{suc.totalMesas}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Personal</span>
                  <span className="text-sm font-black text-slate-900">{suc.totalTrabajadores}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear Sucursal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Store className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Aperturar Nueva Sucursal</h3>
                  <p className="text-xs text-slate-500 font-medium">Registra una nueva sede para asignar trabajadores y mesas</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={crearSucursal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Código de Sede <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SUC-03"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Nombre del Local <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sede Surco"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Dirección Física
                </label>
                <input
                  type="text"
                  placeholder="Av. Primavera 123, Santiago de Surco"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Teléfono de la Sede
                </label>
                <input
                  type="text"
                  placeholder="+51 987654323"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
