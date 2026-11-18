import React, { useState, useEffect, useMemo } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { InquilinoResumen } from '../../tipos/modelos';
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Store,
  X,
  SlidersHorizontal,
  Pencil,
  Power,
  Search,
  RotateCcw,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface UsuarioInquilinoItem {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  nombreSucursal: string;
  fechaCreacion: string;
}

export const PanelSuperAdmin: React.FC = () => {
  const [inquilinos, setInquilinos] = useState<InquilinoResumen[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Modal para Crear Nuevo Restaurante
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [ruc, setRuc] = useState('');
  const [subdominio, setSubdominio] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correoContacto, setCorreoContacto] = useState('');
  const [nombreSucursalPrincipal, setNombreSucursalPrincipal] = useState('Sede Principal');
  const [nombresAdmin, setNombresAdmin] = useState('');
  const [apellidosAdmin, setApellidosAdmin] = useState('');
  const [correoAdmin, setCorreoAdmin] = useState('');
  const [claveAdmin, setClaveAdmin] = useState('');
  const [limiteSucursales, setLimiteSucursales] = useState('1');
  const [limiteUsuarios, setLimiteUsuarios] = useState('5');
  const [creando, setCreando] = useState(false);

  // Modal para Editar Restaurante Completo (CRUD + Plan SaaS + Cambio de Clave)
  const [clienteAEditar, setClienteAEditar] = useState<InquilinoResumen | null>(null);
  const [editRazonSocial, setEditRazonSocial] = useState('');
  const [editNombreComercial, setEditNombreComercial] = useState('');
  const [editRuc, setEditRuc] = useState('');
  const [editSubdominio, setEditSubdominio] = useState('');
  const [editDireccionFiscal, setEditDireccionFiscal] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editCorreoContacto, setEditCorreoContacto] = useState('');
  const [editFormLimiteSucursales, setEditFormLimiteSucursales] = useState('1');
  const [editFormLimiteUsuarios, setEditFormLimiteUsuarios] = useState('5');
  const [editNuevaClaveAdmin, setEditNuevaClaveAdmin] = useState('');
  const [mostrarClaveEdit, setMostrarClaveEdit] = useState(false);
  const [adminUsuarioInfo, setAdminUsuarioInfo] = useState<UsuarioInquilinoItem | null>(null);
  const [otrosUsuariosInquilino, setOtrosUsuariosInquilino] = useState<UsuarioInquilinoItem[]>([]);
  const [mostrarOtrosUsuarios, setMostrarOtrosUsuarios] = useState(false);
  const [usuarioSeleccionadoClave, setUsuarioSeleccionadoClave] = useState<UsuarioInquilinoItem | null>(null);
  const [claveOtroUsuario, setClaveOtroUsuario] = useState('');
  const [mostrarClaveOtroUsuario, setMostrarClaveOtroUsuario] = useState(false);
  const [guardandoClaveOtroUsuario, setGuardandoClaveOtroUsuario] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Modal / Confirmación de Cambio de Estado (Activar / Desactivar)
  const [clienteAAlternarEstado, setClienteAAlternarEstado] = useState<InquilinoResumen | null>(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resInquilinos, resMetricas] = await Promise.all([
        clienteApi.get<InquilinoResumen[]>('/superadmin/inquilinos'),
        clienteApi.get('/superadmin/metricas-globales'),
      ]);
      setInquilinos(resInquilinos.data);
      setMetricas(resMetricas.data);
    } catch (err) {
      console.error('Error cargando superadmin:', err);
    } finally {
      setCargando(false);
    }
  };

  // Generador de clave segura temporal legible
  const generarClaveSegura = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Resto2026!${rand}`;
  };

  // Copiar al portapapeles
  const copiarAlPortapapeles = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setMensaje('Contraseña copiada al portapapeles.');
      setTimeout(() => setMensaje(null), 3000);
    } catch {
      setMensaje('Contraseña: ' + texto);
    }
  };

  // Filtrado de inquilinos
  const inquilinosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return inquilinos;
    const q = busqueda.toLowerCase().trim();
    return inquilinos.filter(
      (inq) =>
        inq.nombreComercial.toLowerCase().includes(q) ||
        inq.razonSocial.toLowerCase().includes(q) ||
        inq.ruc.includes(q) ||
        inq.subdominio.toLowerCase().includes(q)
    );
  }, [inquilinos, busqueda]);

  // Alternar Mora
  const alternarMora = async (inquilinoId: string) => {
    try {
      await clienteApi.put(`/superadmin/inquilinos/${inquilinoId}/alternar-mora`);
      setMensaje('Estado de suspensión por mora actualizado.');
      await cargarDatos();
      setTimeout(() => setMensaje(null), 4500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Abrir Modal de Edición Completa
  const abrirModalEditarCliente = async (inq: InquilinoResumen) => {
    setClienteAEditar(inq);
    setEditNombreComercial(inq.nombreComercial || '');
    setEditRazonSocial(inq.razonSocial || '');
    setEditRuc(inq.ruc || '');
    setEditSubdominio(inq.subdominio || '');
    setEditDireccionFiscal(inq.direccionFiscal || '');
    setEditTelefono(inq.telefono || '');
    setEditCorreoContacto(inq.correoContacto || '');
    setEditFormLimiteSucursales(inq.limiteSucursales && inq.limiteSucursales > 0 ? String(inq.limiteSucursales) : '0');
    setEditFormLimiteUsuarios(inq.limiteUsuarios && inq.limiteUsuarios > 0 ? String(inq.limiteUsuarios) : '0');
    setEditNuevaClaveAdmin('');
    setMostrarClaveEdit(false);
    setAdminUsuarioInfo(null);
    setOtrosUsuariosInquilino([]);
    setMostrarOtrosUsuarios(false);
    setUsuarioSeleccionadoClave(null);
    setClaveOtroUsuario('');

    // Cargar cuentas de usuarios de este restaurante para mostrar al administrador
    try {
      const res = await clienteApi.get<UsuarioInquilinoItem[]>(`/superadmin/inquilinos/${inq.id}/usuarios`);
      const admin = res.data.find((u) => u.rol === 'AdminRestaurante') || res.data[0] || null;
      setAdminUsuarioInfo(admin);
      setOtrosUsuariosInquilino(res.data.filter((u) => u.id !== admin?.id));
    } catch (err) {
      console.error('Error cargando usuarios del restaurante:', err);
    }
  };

  // Guardar Cambios de Edición Completa (datos generales, límites y contraseña del cliente)
  const guardarEdicionCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteAEditar) return;
    setGuardandoEdicion(true);
    setError(null);

    try {
      const valSuc = parseInt(editFormLimiteSucursales);
      const valUsu = parseInt(editFormLimiteUsuarios);

      await clienteApi.put(`/superadmin/inquilinos/${clienteAEditar.id}`, {
        razonSocial: editRazonSocial,
        nombreComercial: editNombreComercial,
        ruc: editRuc,
        subdominio: editSubdominio,
        direccionFiscal: editDireccionFiscal,
        telefono: editTelefono,
        correoContacto: editCorreoContacto,
        limiteSucursales: isNaN(valSuc) || valSuc <= 0 ? null : valSuc,
        limiteUsuarios: isNaN(valUsu) || valUsu <= 0 ? null : valUsu,
        nuevaClaveAdmin: editNuevaClaveAdmin.trim() ? editNuevaClaveAdmin.trim() : null
      });

      setMensaje(
        editNuevaClaveAdmin.trim()
          ? `Datos y nueva contraseña del restaurante "${editNombreComercial}" guardados exitosamente.`
          : `Datos y límites del restaurante "${editNombreComercial}" actualizados exitosamente.`
      );
      setClienteAEditar(null);
      await cargarDatos();
      setTimeout(() => setMensaje(null), 4500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar los datos del restaurante cliente.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Guardar clave para otro usuario específico del restaurante desde el mismo modal
  const guardarClaveOtroUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteAEditar || !usuarioSeleccionadoClave) return;

    if (!claveOtroUsuario.trim() || claveOtroUsuario.trim().length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    setGuardandoClaveOtroUsuario(true);
    try {
      await clienteApi.put(
        `/superadmin/inquilinos/${clienteAEditar.id}/usuarios/${usuarioSeleccionadoClave.id}/clave`,
        { nuevaClave: claveOtroUsuario.trim() }
      );

      setMensaje(
        `Contraseña actualizada para ${usuarioSeleccionadoClave.nombres} (${usuarioSeleccionadoClave.correo}).`
      );
      setUsuarioSeleccionadoClave(null);
      setClaveOtroUsuario('');
      setTimeout(() => setMensaje(null), 4500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar la contraseña del usuario.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setGuardandoClaveOtroUsuario(false);
    }
  };

  // Alternar Activo / Desactivar (DELETE /superadmin/inquilinos/:id)
  const alternarEstadoCliente = async () => {
    if (!clienteAAlternarEstado) return;
    setProcesandoEstado(true);
    try {
      const res = await clienteApi.delete(`/superadmin/inquilinos/${clienteAAlternarEstado.id}`);
      setMensaje(res.data?.mensaje || 'Estado del restaurante modificado.');
      setClienteAAlternarEstado(null);
      await cargarDatos();
      setTimeout(() => setMensaje(null), 4500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al modificar estado del restaurante.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcesandoEstado(false);
    }
  };

  // Crear Nuevo Restaurante
  const crearNuevoRestaurante = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setError(null);

    try {
      const valSuc = parseInt(limiteSucursales);
      const valUsu = parseInt(limiteUsuarios);

      await clienteApi.post('/superadmin/inquilinos', {
        razonSocial,
        nombreComercial,
        ruc,
        subdominio,
        direccionFiscal,
        telefono,
        correoContacto,
        nombreSucursalPrincipal,
        nombresAdmin,
        apellidosAdmin,
        correoAdmin,
        claveAdmin,
        limiteSucursales: isNaN(valSuc) || valSuc <= 0 ? null : valSuc,
        limiteUsuarios: isNaN(valUsu) || valUsu <= 0 ? null : valUsu,
      });

      setMensaje(`Restaurante "${nombreComercial}" y su cuenta administradora aprovisionados exitosamente.`);
      setMostrarModalCrear(false);
      // Limpiar formulario
      setRazonSocial('');
      setNombreComercial('');
      setRuc('');
      setSubdominio('');
      setDireccionFiscal('');
      setTelefono('');
      setCorreoContacto('');
      setCorreoAdmin('');
      setClaveAdmin('');
      setLimiteSucursales('1');
      setLimiteUsuarios('5');
      await cargarDatos();
      setTimeout(() => setMensaje(null), 4500);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al crear el restaurante cliente.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="p-8 space-y-8 relative">
      {/* Notificaciones Flotantes en la parte inferior derecha */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {mensaje && (
          <div className="pointer-events-auto p-4 bg-white border border-emerald-200 text-slate-800 rounded-2xl flex items-start gap-3 shadow-xl shadow-slate-900/10 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-slate-900">Operación Exitosa</p>
              <p className="text-slate-600 font-medium mt-0.5 leading-snug">{mensaje}</p>
            </div>
            <button
              onClick={() => setMensaje(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="pointer-events-auto p-4 bg-white border border-rose-200 text-slate-800 rounded-2xl flex items-start gap-3 shadow-xl shadow-slate-900/10 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-slate-900">Atención / Error</p>
              <p className="text-slate-600 font-medium mt-0.5 leading-snug">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tarjetas de Métricas Globales del SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Restaurantes Clientes
            </span>
            <span className="text-3xl font-black text-slate-900">
              {metricas?.totalRestaurantes || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Usuarios Plataforma
            </span>
            <span className="text-3xl font-black text-slate-900">
              {metricas?.totalUsuariosRegistrados || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Comandas Procesadas
            </span>
            <span className="text-3xl font-black text-slate-900">
              {metricas?.totalComandasEmitidas || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Ventas Totales SaaS
            </span>
            <span className="text-3xl font-black text-slate-900">
              S/ {(metricas?.totalVentasGlobales || 0).toFixed(2)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabla de Restaurantes Clientes - Gestión CRUD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Cartera de Restaurantes Clientes</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control de datos comerciales, límites de plan, contraseñas y estado de suscripción</p>
          </div>
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Restaurante Cliente</span>
          </button>
        </div>

        {/* Buscador de Restaurantes Clientes */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, razón social, RUC o subdominio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Limpiar
            </button>
          )}
          <span className="text-xs font-semibold text-slate-400 ml-auto">
            Total: {inquilinosFiltrados.length} restaurante{inquilinosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Restaurante / Razón Social</th>
                <th className="pb-3">RUC</th>
                <th className="pb-3">Subdominio</th>
                <th className="pb-3">Cupo Sedes</th>
                <th className="pb-3">Cupo Usuarios</th>
                <th className="pb-3">Estado Suscripción</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inquilinosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-xs">No se encontraron restaurantes clientes.</p>
                    {busqueda && <p className="text-[11px] text-slate-400 mt-0.5">Intenta con otro término de búsqueda.</p>}
                  </td>
                </tr>
              ) : (
                inquilinosFiltrados.map((inq) => {
                  const limiteSuc = inq.limiteSucursales && inq.limiteSucursales > 0 ? inq.limiteSucursales : null;
                  const limiteUsu = inq.limiteUsuarios && inq.limiteUsuarios > 0 ? inq.limiteUsuarios : null;

                  const cupoSucLleno = limiteSuc !== null && inq.totalSucursales >= limiteSuc;
                  const cupoUsuLleno = limiteUsu !== null && inq.totalUsuarios >= limiteUsu;

                  return (
                    <tr
                      key={inq.id}
                      className={`hover:bg-slate-50/70 font-semibold transition-colors ${
                        !inq.activo ? 'opacity-60 bg-slate-50/40' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            inq.activo ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block">{inq.nombreComercial}</span>
                              {!inq.activo && (
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black uppercase rounded tracking-wider">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{inq.razonSocial}</span>
                            {inq.direccionFiscal && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[200px]">{inq.direccionFiscal}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600">{inq.ruc}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-mono border border-slate-200/60">
                          {inq.subdominio}.posresto.com
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black ${cupoSucLleno ? 'text-amber-600' : 'text-slate-900'}`}>
                            {inq.totalSucursales}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500 font-semibold text-[11px]">
                            {limiteSuc ? `${limiteSuc} máx` : 'Ilimitado'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black ${cupoUsuLleno ? 'text-amber-600' : 'text-slate-900'}`}>
                            {inq.totalUsuarios}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500 font-semibold text-[11px]">
                            {limiteUsu ? `${limiteUsu} máx` : 'Ilimitado'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        {inq.bloqueadoPorMora ? (
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Suspendido por Mora</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activo al Día</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {/* BOTÓN 1: EDITAR (MODAL COMPLETO CON DATOS, LÍMITES Y CONTRASEÑA) */}
                        <button
                          onClick={() => abrirModalEditarCliente(inq)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Editar información general, datos fiscales, cupos del plan y contraseña de acceso"
                        >
                          <Pencil className="w-3.5 h-3.5 text-orange-600" />
                          <span>Editar</span>
                        </button>

                        {/* BOTÓN 2: ALTERNAR MORA */}
                        <button
                          onClick={() => alternarMora(inq.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer inline-flex items-center gap-1.5 shadow-sm ${
                            inq.bloqueadoPorMora
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={inq.bloqueadoPorMora ? 'Levantar suspensión por falta de pago' : 'Suspender acceso temporalmente por mora'}
                        >
                          {inq.bloqueadoPorMora ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{inq.bloqueadoPorMora ? 'Reactivar' : 'Mora'}</span>
                        </button>

                        {/* BOTÓN 3: ALTERNAR ESTADO ACTIVO / BAJA (SOFT DELETE) */}
                        <button
                          onClick={() => setClienteAAlternarEstado(inq)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer inline-flex items-center justify-center shadow-sm ${
                            inq.activo
                              ? 'border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={inq.activo ? 'Dar de baja / Desactivar restaurante' : 'Reactivar restaurante cliente'}
                        >
                          {inq.activo ? <Power className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Crear Restaurante Cliente */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Building2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Crear Restaurante Cliente</h3>
                  <p className="text-xs text-slate-500 font-medium">Aprovisiona el restaurante, límites de plan y credenciales de acceso</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalCrear(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={crearNuevoRestaurante} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Nombre Comercial <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Pizzería Don Luigi"
                    value={nombreComercial}
                    onChange={(e) => setNombreComercial(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Razón Social <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GASTRONOMIA LUIGI S.A.C."
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    RUC (11 Dígitos) <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="20609876543"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Subdominio Único <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="donluigi"
                    value={subdominio}
                    onChange={(e) => setSubdominio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Larco 123, Miraflores"
                    value={direccionFiscal}
                    onChange={(e) => setDireccionFiscal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Teléfono Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="+51 987654321"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Correo Contacto
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@donluigi.com"
                    value={correoContacto}
                    onChange={(e) => setCorreoContacto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre Sede Matriz Inicial <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sede Miraflores (Principal)"
                  value={nombreSucursalPrincipal}
                  onChange={(e) => setNombreSucursalPrincipal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* SECCIÓN RESTRICCIONES DE PLAN SAAS */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block mb-2">
                  Límites y Restricciones del Plan SaaS (SuperAdmin)
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Límite de Sucursales <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="1 (0 para Ilimitado)"
                      value={limiteSucursales}
                      onChange={(e) => setLimiteSucursales(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Coloque 0 para sedes ilimitadas.</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Límite de Usuarios/Empleados <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="5 (0 para Ilimitado)"
                      value={limiteUsuarios}
                      onChange={(e) => setLimiteUsuarios(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Coloque 0 para usuarios ilimitados.</span>
                  </div>
                </div>
              </div>

              {/* Sección del Administrador / Dueño */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block mb-2">
                  Credenciales del Dueño / Administrador del Restaurante
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Nombres del Dueño <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Luigi"
                      value={nombresAdmin}
                      onChange={(e) => setNombresAdmin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Apellidos del Dueño <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rossi"
                      value={apellidosAdmin}
                      onChange={(e) => setApellidosAdmin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Correo de Acceso <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="gerente@donluigi.com"
                      value={correoAdmin}
                      onChange={(e) => setCorreoAdmin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Contraseña de Acceso <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={claveAdmin}
                      onChange={(e) => setClaveAdmin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {creando ? 'Aprovisionando...' : 'Crear Restaurante Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRUD: Editar Información Completa del Restaurante Cliente (Incluye Datos, Plan SaaS y Contraseña) */}
      {clienteAEditar && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Pencil className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Editar Restaurante Cliente</h3>
                  <p className="text-xs text-slate-500 font-medium">Actualiza datos comerciales, fiscales, cupos del plan y contraseña</p>
                </div>
              </div>
              <button
                onClick={() => setClienteAEditar(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionCliente} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Nombre Comercial <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombreComercial}
                    onChange={(e) => setEditNombreComercial(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Razón Social <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editRazonSocial}
                    onChange={(e) => setEditRazonSocial(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    RUC (11 Dígitos) <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={editRuc}
                    onChange={(e) => setEditRuc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Subdominio Único <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      value={editSubdominio}
                      onChange={(e) => setEditSubdominio(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                    <span className="px-3 py-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs font-mono text-slate-500">
                      .posresto.com
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Principal 123"
                    value={editDireccionFiscal}
                    onChange={(e) => setEditDireccionFiscal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="+51 987654321"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Correo de Contacto
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={editCorreoContacto}
                    onChange={(e) => setEditCorreoContacto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* SECCIÓN PLAN SAAS INTEGRADA DENTRO DE EDITAR */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block">
                      Límites y Restricciones del Plan SaaS
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Configuración de cupos máximos permitidos para este restaurante
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Límite de Sucursales Físicas <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="1 (0 para Ilimitado)"
                      value={editFormLimiteSucursales}
                      onChange={(e) => setEditFormLimiteSucursales(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Actualmente tiene {clienteAEditar.totalSucursales} sede(s) activa(s). 0 = Sin límite.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Límite de Usuarios/Empleados <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="5 (0 para Ilimitado)"
                      value={editFormLimiteUsuarios}
                      onChange={(e) => setEditFormLimiteUsuarios(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Actualmente tiene {clienteAEditar.totalUsuarios} usuario(s) activo(s). 0 = Sin límite.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DESTACADA: CAMBIO DE CONTRASEÑA DEL CLIENTE */}
              <div className="pt-4 border-t border-slate-100 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <KeyRound className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Restablecer Contraseña de Acceso del Cliente
                      </span>
                      {adminUsuarioInfo ? (
                        <span className="text-[11px] text-slate-500 block">
                          Usuario: <strong className="text-slate-800">{adminUsuarioInfo.nombres} {adminUsuarioInfo.apellidos}</strong> ({adminUsuarioInfo.correo})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 block">
                          Ingresa una nueva contraseña si el cliente la ha olvidado
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const temp = generarClaveSegura();
                      setEditNuevaClaveAdmin(temp);
                      setMostrarClaveEdit(true);
                      copiarAlPortapapeles(temp);
                    }}
                    className="px-3 py-1.5 text-[11px] font-bold text-orange-700 bg-white hover:bg-orange-100 border border-orange-300 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
                    title="Genera una clave aleatoria segura y la copia al portapapeles"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span>Generar y Copiar</span>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Nueva Contraseña para el Cliente
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarClaveEdit ? 'text' : 'password'}
                      placeholder="Dejar vacío si no deseas cambiar la contraseña actual"
                      value={editNuevaClaveAdmin}
                      onChange={(e) => setEditNuevaClaveAdmin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 pr-20 shadow-xs"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {editNuevaClaveAdmin && (
                        <button
                          type="button"
                          onClick={() => copiarAlPortapapeles(editNuevaClaveAdmin)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Copiar contraseña"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMostrarClaveEdit(!mostrarClaveEdit)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title={mostrarClaveEdit ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {mostrarClaveEdit ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Mínimo 6 caracteres. Al presionar <strong>"Guardar Cambios"</strong>, la nueva contraseña se encriptará inmediatamente y el cliente podrá ingresar con ella.
                  </p>
                </div>

                {/* Subsección opcional: Ver y cambiar contraseñas de otros usuarios del local */}
                {otrosUsuariosInquilino.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/50">
                    <button
                      type="button"
                      onClick={() => setMostrarOtrosUsuarios(!mostrarOtrosUsuarios)}
                      className="text-[11px] font-bold text-slate-600 hover:text-orange-600 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Cambiar clave de otros usuarios del restaurante ({otrosUsuariosInquilino.length})</span>
                      {mostrarOtrosUsuarios ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {mostrarOtrosUsuarios && (
                      <div className="mt-3 space-y-2 bg-white p-3 rounded-xl border border-slate-200/80">
                        {usuarioSeleccionadoClave ? (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                              <span>Cambiar clave a: {usuarioSeleccionadoClave.nombres} ({usuarioSeleccionadoClave.rol})</span>
                              <button
                                type="button"
                                onClick={() => setUsuarioSeleccionadoClave(null)}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type={mostrarClaveOtroUsuario ? 'text' : 'password'}
                                placeholder="Nueva clave (mín. 6 caracteres)"
                                value={claveOtroUsuario}
                                onChange={(e) => setClaveOtroUsuario(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-orange-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const t = generarClaveSegura();
                                  setClaveOtroUsuario(t);
                                  setMostrarClaveOtroUsuario(true);
                                  copiarAlPortapapeles(t);
                                }}
                                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-orange-600"
                                title="Generar clave aleatoria"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={guardarClaveOtroUsuario}
                                disabled={guardandoClaveOtroUsuario}
                                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 disabled:opacity-50"
                              >
                                {guardandoClaveOtroUsuario ? 'Guardando...' : 'Aplicar'}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                          {otrosUsuariosInquilino.map((usr) => (
                            <div key={usr.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 block">{usr.nombres} {usr.apellidos}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">{usr.correo} • {usr.rol}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUsuarioSeleccionadoClave(usr);
                                  const t = generarClaveSegura();
                                  setClaveOtroUsuario(t);
                                  setMostrarClaveOtroUsuario(true);
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              >
                                Cambiar Clave
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClienteAEditar(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {guardandoEdicion ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Baja / Reactivación de Cliente */}
      {clienteAAlternarEstado && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                clienteAAlternarEstado.activo
                  ? 'bg-rose-50 border border-rose-200 text-rose-600'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              }`}>
                {clienteAAlternarEstado.activo ? <Power className="w-6 h-6 stroke-[2.2]" /> : <RotateCcw className="w-6 h-6 stroke-[2.2]" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {clienteAAlternarEstado.activo ? 'Dar de baja restaurante' : 'Reactivar restaurante'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{clienteAAlternarEstado.nombreComercial}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {clienteAAlternarEstado.activo ? (
                <>
                  ¿Estás seguro de que deseas desactivar a <strong className="text-slate-900">{clienteAAlternarEstado.nombreComercial}</strong>? Sus usuarios y sucursales no podrán acceder a la plataforma mientras se encuentre en estado inactivo.
                </>
              ) : (
                <>
                  ¿Deseas reactivar el acceso de <strong className="text-slate-900">{clienteAAlternarEstado.nombreComercial}</strong>? Sus usuarios podrán volver a ingresar inmediatamente.
                </>
              )}
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClienteAAlternarEstado(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={alternarEstadoCliente}
                disabled={procesandoEstado}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                  clienteAAlternarEstado.activo
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {procesandoEstado ? 'Procesando...' : clienteAAlternarEstado.activo ? 'Sí, Desactivar' : 'Sí, Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};