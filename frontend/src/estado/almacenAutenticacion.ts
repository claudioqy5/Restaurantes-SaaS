import { create } from 'zustand';
import { UsuarioAutenticado, SucursalResumen } from '../tipos/modelos';

interface EstadoAutenticacion {
  usuario: UsuarioAutenticado | null;
  sucursalActivaId: string | null;
  sucursalesDisponibles: SucursalResumen[];
  establecerUsuario: (usuario: UsuarioAutenticado) => void;
  establecerSucursalActiva: (sucursalId: string | null) => void;
  establecerSucursales: (sucursales: SucursalResumen[]) => void;
  cerrarSesion: () => void;
}

const USUARIO_STORAGE = 'resto_usuario_saas';
const SUCURSAL_STORAGE = 'resto_sucursal_activa_id';

export const useAlmacenAutenticacion = create<EstadoAutenticacion>((set) => {
  const usuarioGuardado = localStorage.getItem(USUARIO_STORAGE);
  const sucursalGuardada = localStorage.getItem(SUCURSAL_STORAGE);

  let usuarioInicial: UsuarioAutenticado | null = null;
  if (usuarioGuardado) {
    try {
      usuarioInicial = JSON.parse(usuarioGuardado);
    } catch {
      localStorage.removeItem(USUARIO_STORAGE);
    }
  }

  return {
    usuario: usuarioInicial,
    sucursalActivaId: sucursalGuardada || usuarioInicial?.sucursalId || null,
    sucursalesDisponibles: [],

    establecerUsuario: (usuario) => {
      localStorage.setItem(USUARIO_STORAGE, JSON.stringify(usuario));
      set({ 
        usuario, 
        sucursalActivaId: usuario.sucursalId || null 
      });
      if (usuario.sucursalId) {
        localStorage.setItem(SUCURSAL_STORAGE, usuario.sucursalId);
      }
    },

    establecerSucursalActiva: (sucursalId) => {
      if (sucursalId) {
        localStorage.setItem(SUCURSAL_STORAGE, sucursalId);
      } else {
        localStorage.removeItem(SUCURSAL_STORAGE);
      }
      set({ sucursalActivaId: sucursalId });
    },

    establecerSucursales: (sucursales) => {
      set({ sucursalesDisponibles: sucursales });
    },

    cerrarSesion: () => {
      localStorage.removeItem(USUARIO_STORAGE);
      localStorage.removeItem(SUCURSAL_STORAGE);
      set({ 
        usuario: null, 
        sucursalActivaId: null, 
        sucursalesDisponibles: [] 
      });
    },
  };
});
