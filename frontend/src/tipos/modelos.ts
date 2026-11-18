export type RolUsuario = 'SuperAdmin' | 'AdminRestaurante' | 'Cajero' | 'Mesero' | 'Cocinero';

export type EstadoMesa = 'Libre' | 'Ocupada' | 'EsperandoCuenta' | 'Reservada' | 'EnLimpieza';

export type EstadoKDS = 'Pendiente' | 'Preparando' | 'Listo' | 'Entregado' | 'Cancelado';

export type TipoComprobanteSunat = 'NotaVenta' | 'Factura' | 'Boleta';

export type MetodoPago = 'Efectivo' | 'TarjetaCredito' | 'TarjetaDebito' | 'Yape' | 'Plin' | 'Transferencia';

export interface UsuarioAutenticado {
  token: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolUsuario;
  inquilinoId: string | null;
  nombreRestaurante: string | null;
  subdominio: string | null;
  sucursalId: string | null;
  nombreSucursal: string | null;
}

export interface InquilinoResumen {
  id: string;
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  subdominio: string;
  direccionFiscal: string | null;
  telefono: string | null;
  correoContacto: string | null;
  bloqueadoPorMora: boolean;
  activo: boolean;
  totalSucursales: number;
  totalUsuarios: number;
  limiteSucursales: number | null;
  limiteUsuarios: number | null;
  fechaCreacion: string;
}

export interface EstadoPlanInquilino {
  sucursalesActuales: number;
  limiteSucursales: number | null;
  limiteSucursalesAlcanzado: boolean;
  usuariosActuales: number;
  limiteUsuarios: number | null;
  limiteUsuariosAlcanzado: boolean;
}

export interface SucursalResumen {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  totalZonas: number;
  totalMesas: number;
  totalTrabajadores: number;
  activo: boolean;
}

export interface UsuarioResumen {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  sucursalId: string | null;
  nombreSucursal: string | null;
  activo: boolean;
  fechaCreacion: string;
  creadoPor: string | null;
  comandasAtendidas: number;
  ventasCobradas: number;
  totalVendido: number;
}

export interface Zona {
  id: string;
  sucursalId?: string;
  nombre: string;
  totalMesas: number;
}

export interface Mesa {
  id: string;
  zonaId: string;
  zonaNombre: string;
  codigoMesa: string;
  capacidadComensales: number;
  estado: EstadoMesa;
  posicionX: number;
  posicionY: number;
  comandaActivaId: string | null;
  totalComandaActiva: number;
  meseroNombre: string | null;
  fechaAperturaComanda: string | null;
}

export interface CategoriaPlato {
  id: string;
  nombre: string;
  icono: string | null;
  totalPlatos: number;
}

export interface Plato {
  id: string;
  categoriaPlatoId: string;
  categoriaNombre: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  costoEstimado: number;
  estaDisponible: boolean;
  tieneReceta: boolean;
}

export interface Insumo {
  id: string;
  codigoInterno: string;
  nombre: string;
  unidadMedidaId: string;
  unidadMedidaCodigo: string;
  stockActual: number;
  stockMinimo: number;
  costoPromedioUnitario: number;
}

export interface TicketKds {
  detalleComandaId: string;
  comandaId: string;
  numeroComandaDia: number;
  codigoMesa: string;
  platoNombre: string;
  cantidad: number;
  notasCocina: string | null;
  estadoKds: EstadoKDS;
  fechaCreacion: string;
  minutosTranscurridos: number;
}

export interface ComandaActiva {
  id: string;
  mesaId: string;
  codigoMesa: string;
  zonaNombre: string;
  usuarioId: string;
  meseroNombre: string;
  numeroComandaDia: number;
  estado: string;
  total: number;
  fechaCreacion: string;
  detalles: {
    id: string;
    platoId: string;
    platoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    notasCocina: string | null;
    estadoKds: EstadoKDS;
  }[];
}

export interface TurnoCajaActivo {
  id: string;
  cajaId: string;
  cajaNombre: string;
  usuarioId: string;
  cajeroNombre: string;
  fechaApertura: string;
  montoApertura: number;
  totalVentas: number;
  cantidadComprobantes: number;
}

export interface VentaPorUsuario {
  usuarioId: string;
  empleado: string;
  rol: string;
  cantidadComprobantesEmitidos: number;
  totalRecaudado: number;
}

export interface ComprobanteEmitido {
  id: string;
  serie: string;
  correlativo: number;
  tipoComprobante: TipoComprobanteSunat;
  numeroDocumentoIdentidad: string;
  razonSocialCliente: string;
  total: number;
  metodoPago: MetodoPago;
  sunatEstado: string | null;
  sunatMensajeRespuesta: string | null;
  sunatXmlUrl: string | null;
  sunatPdfUrl: string | null;
  sunatCdrUrl: string | null;
  sunatHash: string | null;
  fechaCreacion: string;
  cajeroNombre: string;
  codigoMesa: string;
}

export interface ConfiguracionSunat {
  emisionElectronicaActiva: boolean;
  apisPeruToken: string | null;
  ubigeo: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
}
