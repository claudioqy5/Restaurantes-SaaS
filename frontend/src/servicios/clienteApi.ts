import axios from 'axios';
import { useAlmacenAutenticacion } from '../estado/almacenAutenticacion';

export const clienteApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

clienteApi.interceptors.request.use((config) => {
  const token = useAlmacenAutenticacion.getState().usuario?.token;
  const sucursalActivaId = useAlmacenAutenticacion.getState().sucursalActivaId;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (sucursalActivaId) {
    config.headers['X-Sucursal-Id'] = sucursalActivaId;
  }

  return config;
});

clienteApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAlmacenAutenticacion.getState().cerrarSesion();
    }
    return Promise.reject(error);
  }
);
