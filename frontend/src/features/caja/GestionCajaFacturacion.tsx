import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import {
  TurnoCajaActivo,
  ComandaActiva,
  VentaPorUsuario,
  ComprobanteEmitido,
  ConfiguracionSunat,
  MetodoPago,
  TipoComprobanteSunat
} from '../../tipos/modelos';
import {
  Receipt,
  DollarSign,
  CreditCard,
  QrCode,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  UserCheck,
  Download,
  FileCode,
  FileCheck,
  Settings,
  Key,
  ShieldCheck,
  X
} from 'lucide-react';

export const GestionCajaFacturacion: React.FC = () => {
  const [turnoActivo, setTurnoActivo] = useState<TurnoCajaActivo | null>(null);
  const [comandasActivas, setComandasActivas] = useState<ComandaActiva[]>([]);
  const [ventasPorUsuario, setVentasPorUsuario] = useState<VentaPorUsuario[]>([]);
  const [comprobantesRecientes, setComprobantesRecientes] = useState<ComprobanteEmitido[]>([]);
  const [configSunat, setConfigSunat] = useState<ConfiguracionSunat | null>(null);
  const [cargando, setCargando] = useState(true);

  // Modal de Configuración APIs Perú
  const [mostrarConfigSunat, setMostrarConfigSunat] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [activaSunatInput, setActivaSunatInput] = useState(false);
  const [ubigeoInput, setUbigeoInput] = useState('150101');
  const [departamentoInput, setDepartamentoInput] = useState('LIMA');
  const [provinciaInput, setProvinciaInput] = useState('LIMA');
  const [distritoInput, setDistritoInput] = useState('LIMA');
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  // Estados para Apertura y Cierre de Turno
  const [montoApertura, setMontoApertura] = useState<string>('150.00');
  const [montoCierreDeclarado, setMontoCierreDeclarado] = useState<string>('');
  const [mensajeResultado, setMensajeResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para Cobro de Comanda
  const [comandaSeleccionada, setComandaSeleccionada] = useState<ComandaActiva | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobanteSunat>('Boleta');
  const [tipoDocumento, setTipoDocumento] = useState<string>('1'); // 1: DNI, 6: RUC
  const [numeroDocumento, setNumeroDocumento] = useState<string>('00000000');
  const [razonSocial, setRazonSocial] = useState<string>('CLIENTE VARIOS');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [procesandoCobro, setProcesandoCobro] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [resTurno, resComandas, resVentas, resComprobantes, resConfig] = await Promise.allSettled([
        clienteApi.get<TurnoCajaActivo>('/cajas-facturacion/turnos/activo'),
        clienteApi.get<ComandaActiva[]>('/comandas/activas'),
        clienteApi.get<VentaPorUsuario[]>('/cajas-facturacion/ventas-por-usuario'),
        clienteApi.get<ComprobanteEmitido[]>('/cajas-facturacion/comprobantes/recientes'),
        clienteApi.get<ConfiguracionSunat>('/cajas-facturacion/configuracion-sunat'),
      ]);

      if (resTurno.status === 'fulfilled') setTurnoActivo(resTurno.value.data);
      else setTurnoActivo(null);

      if (resComandas.status === 'fulfilled') setComandasActivas(resComandas.value.data);
      if (resVentas.status === 'fulfilled') setVentasPorUsuario(resVentas.value.data);
      if (resComprobantes.status === 'fulfilled') setComprobantesRecientes(resComprobantes.value.data);

      if (resConfig.status === 'fulfilled') {
        const c = resConfig.value.data;
        setConfigSunat(c);
        setTokenInput(c.apisPeruToken || '');
        setActivaSunatInput(c.emisionElectronicaActiva);
        setUbigeoInput(c.ubigeo || '150101');
        setDepartamentoInput(c.departamento || 'LIMA');
        setProvinciaInput(c.provincia || 'LIMA');
        setDistritoInput(c.distrito || 'LIMA');
      }
    } catch (err) {
      console.error('Error cargando caja:', err);
    } finally {
      setCargando(false);
    }
  };

  const aperturarCaja = async () => {
    try {
      await clienteApi.post('/cajas-facturacion/turnos/apertura', {
        cajaId: '00000000-0000-0000-0000-000000000000',
        montoApertura: parseFloat(montoApertura) || 100,
      });

      setMensajeResultado('Turno de caja aperturado correctamente.');
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al aperturar turno de caja.');
    }
  };

  const cerrarCaja = async () => {
    if (!turnoActivo) return;
    try {
      const respuesta = await clienteApi.post('/cajas-facturacion/turnos/cierre', {
        turnoCajaId: turnoActivo.id,
        montoCierreDeclarado: parseFloat(montoCierreDeclarado) || 0,
      });

      setMensajeResultado(`Cierre completado. Diferencia de arqueo: S/ ${respuesta.data.diferencia.toFixed(2)}`);
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cerrar caja.');
    }
  };

  const cobrarComanda = async () => {
    if (!comandaSeleccionada || !turnoActivo) {
      setError('Se requiere una comanda y un turno de caja activo para facturar.');
      return;
    }

    setProcesandoCobro(true);
    setError(null);

    try {
      const respuesta = await clienteApi.post('/cajas-facturacion/comprobantes', {
        comandaId: comandaSeleccionada.id,
        turnoCajaId: turnoActivo.id,
        tipoComprobante,
        tipoDocumentoIdentidad: tipoDocumento,
        numeroDocumentoIdentidad: numeroDocumento,
        razonSocialCliente: razonSocial,
        metodoPago,
      });

      setMensajeResultado(`Comprobante ${respuesta.data.comprobanteNumero} emitido. Estado SUNAT: ${respuesta.data.sunatEstado}`);
      setComandaSeleccionada(null);
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al emitir comprobante.');
    } finally {
      setProcesandoCobro(false);
    }
  };

  const guardarConfiguracionSunat = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoConfig(true);
    setError(null);

    try {
      await clienteApi.put('/cajas-facturacion/configuracion-sunat', {
        emisionElectronicaActiva: activaSunatInput,
        apisPeruToken: tokenInput,
        ubigeo: ubigeoInput,
        departamento: departamentoInput,
        provincia: provinciaInput,
        distrito: distritoInput,
      });

      setMensajeResultado('Configuración de APIs Perú y credenciales SUNAT guardadas.');
      setMostrarConfigSunat(false);
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar configuración SUNAT.');
    } finally {
      setGuardandoConfig(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Alertas */}
      {mensajeResultado && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{mensajeResultado}</span>
          </div>
          <button onClick={() => setMensajeResultado(null)} className="text-emerald-700 hover:underline">
            Entendido
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Tarjeta de Estado del Turno de Caja y Botón de Configuración APIs Perú */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold border ${
            turnoActivo
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            {turnoActivo ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {turnoActivo ? `Turno Abierto — ${turnoActivo.cajaNombre}` : 'Caja Cerrada'}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                turnoActivo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {turnoActivo ? 'En Operación' : 'Requiere Apertura'}
              </span>

              {/* Badge de Estado APIs Perú */}
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                configSunat?.emisionElectronicaActiva && configSunat?.apisPeruToken
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {configSunat?.emisionElectronicaActiva && configSunat?.apisPeruToken
                  ? 'APIs Perú: Activo'
                  : 'APIs Perú: Modo Local'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {turnoActivo
                ? `Cajero a cargo: ${turnoActivo.cajeroNombre} • Aperturado con S/ ${turnoActivo.montoApertura.toFixed(2)}`
                : 'Aperture un turno con el fondo de caja inicial para comenzar a facturar.'}
            </p>
          </div>
        </div>

        {/* Acciones de Caja y Botón de Ajustes SUNAT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarConfigSunat(true)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Configurar Token APIs Perú"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuración SUNAT</span>
          </button>

          {turnoActivo ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.10"
                placeholder="Arqueo Final S/"
                value={montoCierreDeclarado}
                onChange={(e) => setMontoCierreDeclarado(e.target.value)}
                className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={cerrarCaja}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cierre Z/X</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.10"
                placeholder="Fondo Inicial S/ *"
                required
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                className="w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={aperturarCaja}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Aperturar Turno</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sección Principal de Cobro: Comandas por Cobrar vs Emisión SUNAT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Comandas Pendientes de Pago */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <span>Cuentas por Cobrar ({comandasActivas.length})</span>
              </h4>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {comandasActivas.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No hay comandas pendientes de cobro.</p>
                </div>
              ) : (
                comandasActivas.map((comanda) => {
                  const estaSeleccionada = comandaSeleccionada?.id === comanda.id;

                  return (
                    <div
                      key={comanda.id}
                      onClick={() => setComandaSeleccionada(comanda)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        estaSeleccionada
                          ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">
                            {comanda.codigoMesa}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Comanda #{comanda.numeroComandaDia}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Mesero: <span className="font-semibold text-slate-700">{comanda.meseroNombre}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-slate-900 block">
                          S/ {comanda.total.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-orange-600">
                          {comanda.detalles.length} platos
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Formulario de Emisión SUNAT */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Emisión de Comprobante (APIs Perú UBL 2.1)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {comandaSeleccionada
                  ? `Cobrando mesa ${comandaSeleccionada.codigoMesa} • Total: S/ ${comandaSeleccionada.total.toFixed(2)}`
                  : 'Seleccione una comanda a la izquierda para facturar.'}
              </p>
            </div>
            <Receipt className="w-5 h-5 text-orange-600" />
          </div>

          {comandaSeleccionada ? (
            <div className="space-y-4">
              {/* Tipo de Comprobante */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Tipo de Comprobante <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Boleta', 'Factura', 'NotaVenta'] as TipoComprobanteSunat[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => {
                        setTipoComprobante(tipo);
                        if (tipo === 'Factura') {
                          setTipoDocumento('6');
                          setNumeroDocumento('');
                          setRazonSocial('');
                        } else {
                          setTipoDocumento('1');
                          setNumeroDocumento('00000000');
                          setRazonSocial('CLIENTE VARIOS');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        tipoComprobante === tipo
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tipo === 'NotaVenta' ? 'Nota de Venta' : `${tipo} Electrónica`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {tipoComprobante === 'Factura' ? 'RUC Cliente (11 dígitos)' : 'DNI / Documento'} <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    placeholder={tipoComprobante === 'Factura' ? '20123456789' : '00000000'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Razón Social / Nombres <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="EMPRESA O CLIENTE S.A.C."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Método de Pago <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['Efectivo', 'TarjetaCredito', 'TarjetaDebito', 'Yape', 'Plin'] as MetodoPago[]).map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        metodoPago === metodo
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {metodo === 'Efectivo' && <DollarSign className="w-4 h-4" />}
                      {(metodo === 'TarjetaCredito' || metodo === 'TarjetaDebito') && <CreditCard className="w-4 h-4" />}
                      {(metodo === 'Yape' || metodo === 'Plin') && <QrCode className="w-4 h-4" />}
                      <span className="text-[11px]">{metodo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desglose Tributario */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Operación Gravada:</span>
                  <span className="font-semibold">S/ {(comandaSeleccionada.total / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>I.G.V. (18% SUNAT):</span>
                  <span className="font-semibold">S/ {(comandaSeleccionada.total - comandaSeleccionada.total / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 text-sm font-black pt-1.5 border-t border-slate-200">
                  <span>Total a Cobrar:</span>
                  <span className="text-orange-600">S/ {comandaSeleccionada.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de Emisión */}
              <button
                onClick={cobrarComanda}
                disabled={procesandoCobro}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                <span>
                  {procesandoCobro
                    ? 'Emitiendo vía APIs Perú...'
                    : `Emitir Comprobante y Cobrar S/ ${comandaSeleccionada.total.toFixed(2)}`}
                </span>
              </button>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 p-8 border border-dashed border-slate-200 rounded-3xl">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Ninguna comanda seleccionada para cobrar</p>
              <p className="text-[11px] text-slate-400 mt-1">Haga clic en una de las comandas a la izquierda para cargar sus datos y emitir la boleta/factura.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Comprobantes Emitidos con Descarga de XML, PDF, CDR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Comprobantes Emitidos y Archivos SUNAT</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Descarga directa de XML firmado, Representación Impresa (PDF) y Constancia de Recepción (CDR)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Comprobante</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Mesa / Cajero</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Estado SUNAT</th>
                <th className="pb-3 text-right">Archivos / Descargas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comprobantesRecientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aún no se han emitido comprobantes en este restaurante.
                  </td>
                </tr>
              ) : (
                comprobantesRecientes.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                    <td className="py-3">
                      <span className="font-bold text-slate-900 block font-mono">
                        {cp.serie}-{cp.correlativo.toString().padStart(8, '0')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{cp.tipoComprobante}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-slate-800 block truncate max-w-xs">{cp.razonSocialCliente}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">{cp.numeroDocumentoIdentidad}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-800 block">Mesa {cp.codigoMesa}</span>
                      <span className="text-[10px] text-slate-400 block">{cp.cajeroNombre}</span>
                    </td>
                    <td className="py-3 font-black text-slate-900">
                      S/ {cp.total.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        cp.sunatEstado?.includes('ACEPTADO')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {cp.sunatEstado || 'ACEPTADO'}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      {cp.sunatPdfUrl && (
                        <a
                          href={cp.sunatPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                        >
                          <FileText className="w-3 h-3 text-rose-600" />
                          <span>PDF</span>
                        </a>
                      )}
                      {cp.sunatXmlUrl && (
                        <a
                          href={cp.sunatXmlUrl}
                          download
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                        >
                          <FileCode className="w-3 h-3 text-blue-600" />
                          <span>XML</span>
                        </a>
                      )}
                      {cp.sunatCdrUrl && (
                        <a
                          href={cp.sunatCdrUrl}
                          download
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                        >
                          <FileCheck className="w-3 h-3 text-emerald-600" />
                          <span>CDR</span>
                        </a>
                      )}
                      {!cp.sunatPdfUrl && !cp.sunatXmlUrl && (
                        <span className="text-[11px] text-slate-400 italic">Modo Local</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuración APIs Perú */}
      {mostrarConfigSunat && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Key className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configuración Fiscal APIs Perú</h3>
                  <p className="text-xs text-slate-500 font-medium">Ingresa las credenciales para emisión electrónica real</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarConfigSunat(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarConfiguracionSunat} className="space-y-4">
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Emisión Electrónica Activa</span>
                  <span className="text-[11px] text-slate-500 block">
                    {activaSunatInput ? 'Transmitiendo en vivo con APIs Perú' : 'Modo prueba/local activo'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={activaSunatInput}
                  onChange={(e) => setActivaSunatInput(e.target.checked)}
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Token Bearer APIs Perú <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Ubigeo Fiscal <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="150101"
                    value={ubigeoInput}
                    onChange={(e) => setUbigeoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Departamento <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LIMA"
                    value={departamentoInput}
                    onChange={(e) => setDepartamentoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Provincia <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LIMA"
                    value={provinciaInput}
                    onChange={(e) => setProvinciaInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Distrito <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LIMA"
                    value={distritoInput}
                    onChange={(e) => setDistritoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarConfigSunat(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoConfig}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {guardandoConfig ? 'Guardando...' : 'Guardar Credenciales'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
