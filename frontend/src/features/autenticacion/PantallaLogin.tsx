import React, { useState } from 'react';
import { useAlmacenAutenticacion } from '../../estado/almacenAutenticacion';
import { clienteApi } from '../../servicios/clienteApi';
import {
  UtensilsCrossed,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Coffee,
  Banknote,
  ChefHat,
  AlertCircle
} from 'lucide-react';

export const PantallaLogin: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const establecerUsuario = useAlmacenAutenticacion((state) => state.establecerUsuario);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !clave) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const respuesta = await clienteApi.post('/autenticacion/login', {
        correo,
        clave,
      });

      establecerUsuario(respuesta.data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarComo = (correoDemo: string, claveDemo: string) => {
    setCorreo(correoDemo);
    setClave(claveDemo);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Columna Izquierda: Información de la plataforma */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-8 shadow-inner">
              <UtensilsCrossed className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Sistema POS Gastronómico Multi-Tenant
            </h1>
            <p className="mt-4 text-orange-100 text-sm leading-relaxed">
              Gestión centralizada de restaurantes, sucursales físicas, sincronización de comandas en tiempo real (KDS), recetas y facturación electrónica SUNAT.
            </p>
          </div>

          <div className="pt-8 border-t border-white/15">
            <p className="text-xs font-semibold text-orange-200 uppercase tracking-wider mb-2">
              Arquitectura de Negocio
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-white">
              <span className="px-3 py-1 bg-white/20 rounded-lg">Multi-Sucursal</span>
              <span className="px-3 py-1 bg-white/20 rounded-lg">SignalR Realtime</span>
              <span className="px-3 py-1 bg-white/20 rounded-lg">SUNAT UBL 2.1</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Login */}
        <div className="p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
              <p className="text-xs text-slate-500 mt-1">Ingrese con su usuario institucional</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={manejarEnvio} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Correo Electrónico <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@restodemo.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Contraseña <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{cargando ? 'Accediendo...' : 'Entrar al Sistema'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </form>
          </div>

          {/* Accesos Rápidos para Prueba Inmediata */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Acceso Rápido por Rol (Demostración)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => iniciarComo('admin@saasresto.com', 'Admin123!')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-2 transition-all text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">SuperAdmin SaaS</span>
              </button>

              <button
                type="button"
                onClick={() => iniciarComo('gerente@demo.com', 'Demo123!')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-2 transition-all text-left"
              >
                <UserCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="truncate">Dueño Restaurante</span>
              </button>

              <button
                type="button"
                onClick={() => iniciarComo('mesero@demo.com', 'Demo123!')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-2 transition-all text-left"
              >
                <Coffee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Mesero Miraflores</span>
              </button>

              <button
                type="button"
                onClick={() => iniciarComo('mesero.si@demo.com', 'Demo123!')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-2 transition-all text-left"
              >
                <Coffee className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Mesero San Isidro</span>
              </button>

              <button
                type="button"
                onClick={() => iniciarComo('cajero@demo.com', 'Demo123!')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-2 transition-all text-left"
              >
                <Banknote className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Cajera Facturación</span>
              </button>

              <button
                type="button"
                onClick={() => iniciarComo('cocina@demo.com', 'Demo123!')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 flex items-center gap-2 transition-all text-left"
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Cocinero (KDS)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
