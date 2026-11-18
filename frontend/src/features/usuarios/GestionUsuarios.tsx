import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { UsuarioResumen, SucursalResumen, RolUsuario, EstadoPlanInquilino } from '../../tipos/modelos';
import {
  Users,
  Plus,
  Store,
  ShieldCheck,
  UserCheck,
  Coffee,
  ChefHat,
  Banknote,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [sucursales, setSucursales] = useState<SucursalResumen[]>([]);
  const [estadoPlan, setEstadoPlan] = useState<EstadoPlanInquilino | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario de Nuevo Trabajador
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<RolUsuario>('Mesero');
  const [sucursalId, setSucursalId] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resUsuarios, resSucursales, resPlan] = await Promise.all([
        clienteApi.get<UsuarioResumen[]>('/usuarios'),
        clienteApi.get<SucursalResumen[]>('/sucursales'),
        clienteApi.get<EstadoPlanInquilino>('/sucursales/estado-plan'),
      ]);
      setUsuarios(resUsuarios.data);
      setSucursales(resSucursales.data);
      setEstadoPlan(resPlan.data);

      if (resSucursales.data.length > 0) {
        setSucursalId(resSucursales.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando empleados:', err);
    } finally {
      setCargando(false);
    }
  };

  const alternarEstado = async (id: string) => {
    try {
      await clienteApi.put(`/usuarios/${id}/alternar-estado`);
      setMensaje('Estado del empleado actualizado.');
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado.');
    }
  };

  const crearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rol !== 'AdminRestaurante' && !sucursalId) {
      setError('Debe asignar obligatoriamente una sucursal al trabajador.');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      await clienteApi.post('/usuarios', {
        nombres,
        apellidos,
        correo,
        clave,
        telefono,
        rol,
        sucursalId: rol === 'AdminRestaurante' ? (sucursalId || null) : sucursalId,
      });

      setMensaje(`Empleado "${nombres} ${apellidos}" registrado y asignado exitosamente.`);
      setMostrarModal(false);
      setNombres('');
      setApellidos('');
      setCorreo('');
      setClave('');
      setTelefono('');
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al registrar el empleado.');
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

      {/* Alerta de Límite de Usuarios Alcanzado */}
      {estadoPlan?.limiteUsuariosAlcanzado && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Has alcanzado el límite contratado de <strong>{estadoPlan.usuariosActuales} de {estadoPlan.limiteUsuarios} empleados</strong> permitidos por tu plan SaaS. Para dar de alta más personal, solicita una ampliación de tu plan comercial al Super Administrador.
            </span>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Equipo de Trabajo y Trazabilidad de Ventas</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea empleados asignados por sede y verifica qué usuario realizó cada venta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {estadoPlan && (
            <span className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80">
              Cupo Plan: <span className="font-black text-slate-900">{estadoPlan.usuariosActuales}</span> / {estadoPlan.limiteUsuarios ? `${estadoPlan.limiteUsuarios} usuarios` : 'Ilimitado'}
            </span>
          )}

          <button
            disabled={estadoPlan?.limiteUsuariosAlcanzado}
            onClick={() => setMostrarModal(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
              estadoPlan?.limiteUsuariosAlcanzado
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 cursor-pointer active:scale-[0.98]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Tabla de Empleados con Trazabilidad Completa */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Empleado</th>
                <th className="pb-3">Rol</th>
                <th className="pb-3">Sucursal Asignada</th>
                <th className="pb-3">Registrado Por</th>
                <th className="pb-3">Comandas</th>
                <th className="pb-3">Cobros Realizados</th>
                <th className="pb-3 text-right">Ventas Totales</th>
                <th className="pb-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                  <td className="py-3.5">
                    <span className="font-bold text-slate-900 block">{u.nombres} {u.apellidos}</span>
                    <span className="text-[11px] text-slate-400 block">{u.correo}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      {u.rol === 'SuperAdmin' && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                      {u.rol === 'AdminRestaurante' && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                      {u.rol === 'Cajero' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                      {u.rol === 'Mesero' && <Coffee className="w-3.5 h-3.5 text-amber-600" />}
                      {u.rol === 'Cocinero' && <ChefHat className="w-3.5 h-3.5 text-orange-600" />}
                      <span>{u.rol}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{u.nombreSucursal}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-[11px] text-slate-500">
                    {u.creadoPor || 'Sistema'}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                      {u.comandasAtendidas} comandas
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                      {u.ventasCobradas} cobros
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-black text-slate-900 text-sm">
                    S/ {u.totalVendido.toFixed(2)}
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => alternarEstado(u.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        u.activo
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Empleado con Asignación de Sucursal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Registrar Empleado</h3>
                  <p className="text-xs text-slate-500 font-medium">Asigna rol y sucursal física de trabajo</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={crearEmpleado} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Nombres <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mateo"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Apellidos <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Silva"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Correo Institucional (Acceso) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="mateo.silva@demo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Contraseña Inicial <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+51 912345678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Rol Funcional <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as RolUsuario)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Mesero">Mesero (Salón)</option>
                    <option value="Cajero">Cajero (Facturación)</option>
                    <option value="Cocinero">Cocinero (KDS)</option>
                    <option value="AdminRestaurante">Administrador General</option>
                  </select>
                </div>

                {/* Asignación de Sucursal Obligatoria */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block mb-1">
                    Sucursal Asignada <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {sucursales.map((suc) => (
                      <option key={suc.id} value={suc.id}>
                        {suc.nombre} {suc.esPrincipal ? '(Matriz)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {guardando ? 'Guardando...' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
