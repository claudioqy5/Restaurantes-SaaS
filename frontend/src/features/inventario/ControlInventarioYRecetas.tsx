import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { Insumo, Plato } from '../../tipos/modelos';
import {
  Boxes,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  X,
  Plus,
  ArrowDownToLine,
  Search,
  Sparkles
} from 'lucide-react';

interface UnidadMedidaItem {
  id: string;
  codigo: string;
  nombre: string;
}

interface CategoriaItem {
  id: string;
  nombre: string;
  icono?: string;
  totalPlatos: number;
}

export const ControlInventarioYRecetas: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedidaItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modal para ver receta / escandallo
  const [platoReceta, setPlatoReceta] = useState<any | null>(null);

  // Modales interactivos para creación y abastecimiento
  const [mostrarModalEntrada, setMostrarModalEntrada] = useState(false);
  const [mostrarModalNuevoInsumo, setMostrarModalNuevoInsumo] = useState(false);
  const [mostrarModalNuevoPlato, setMostrarModalNuevoPlato] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estado formulario: Entrada de Stock (ej. 20 kg de papa)
  const [entradaInsumoId, setEntradaInsumoId] = useState('');
  const [entradaCantidad, setEntradaCantidad] = useState('20');
  const [entradaCosto, setEntradaCosto] = useState('2.50');
  const [entradaMotivo, setEntradaMotivo] = useState('Compra de abastecimiento mercado');

  // Estado formulario: Nuevo Insumo
  const [nuevoInsumoNombre, setNuevoInsumoNombre] = useState('');
  const [nuevoInsumoCodigo, setNuevoInsumoCodigo] = useState('');
  const [nuevoInsumoUnidadId, setNuevoInsumoUnidadId] = useState('');
  const [nuevoInsumoStockInicial, setNuevoInsumoStockInicial] = useState('0');
  const [nuevoInsumoStockMinimo, setNuevoInsumoStockMinimo] = useState('5');
  const [nuevoInsumoCostoUnitario, setNuevoInsumoCostoUnitario] = useState('3.00');

  // Estado formulario: Nuevo Plato
  const [nuevoPlatoCategoriaId, setNuevoPlatoCategoriaId] = useState('');
  const [nuevoPlatoNombre, setNuevoPlatoNombre] = useState('');
  const [nuevoPlatoCodigo, setNuevoPlatoCodigo] = useState('');
  const [nuevoPlatoPrecioVenta, setNuevoPlatoPrecioVenta] = useState('35.00');
  const [nuevoPlatoDescripcion, setNuevoPlatoDescripcion] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resInsumos, resPlatos, resUnidades, resCategorias] = await Promise.all([
        clienteApi.get<Insumo[]>('/menu-inventario/insumos'),
        clienteApi.get<Plato[]>('/menu-inventario/platos'),
        clienteApi.get<UnidadMedidaItem[]>('/menu-inventario/unidades-medida'),
        clienteApi.get<CategoriaItem[]>('/menu-inventario/categorias'),
      ]);
      setInsumos(resInsumos.data);
      setPlatos(resPlatos.data);
      setUnidades(resUnidades.data);
      setCategorias(resCategorias.data);

      if (resInsumos.data.length > 0 && !entradaInsumoId) {
        setEntradaInsumoId(resInsumos.data[0].id);
      }
      if (resUnidades.data.length > 0 && !nuevoInsumoUnidadId) {
        setNuevoInsumoUnidadId(resUnidades.data[0].id);
      }
      if (resCategorias.data.length > 0 && !nuevoPlatoCategoriaId) {
        setNuevoPlatoCategoriaId(resCategorias.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setCargando(false);
    }
  };

  const verEscandalloReceta = async (plato: Plato) => {
    try {
      const res = await clienteApi.get(`/menu-inventario/platos/${plato.id}/receta`);
      setPlatoReceta({ ...res.data, nombrePlato: plato.nombre, precioVenta: plato.precioVenta });
    } catch (err) {
      console.error('Error cargando receta:', err);
    }
  };

  const abrirModalNuevoInsumo = async () => {
    try {
      const res = await clienteApi.get('/menu-inventario/siguiente-codigo?tipo=insumo');
      if (res.data?.codigo) {
        setNuevoInsumoCodigo(res.data.codigo);
      }
    } catch {
      const siguienteNum = insumos.length + 1;
      setNuevoInsumoCodigo(`INS-${String(siguienteNum).padStart(3, '0')}`);
    }
    setMostrarModalNuevoInsumo(true);
  };

  const abrirModalNuevoPlato = async () => {
    try {
      const res = await clienteApi.get('/menu-inventario/siguiente-codigo?tipo=plato');
      if (res.data?.codigo) {
        setNuevoPlatoCodigo(res.data.codigo);
      }
    } catch {
      const siguienteNum = platos.length + 1;
      setNuevoPlatoCodigo(`PLT-${String(siguienteNum).padStart(3, '0')}`);
    }
    setMostrarModalNuevoPlato(true);
  };

  const manejarEntradaStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entradaInsumoId || Number(entradaCantidad) <= 0) return;

    setGuardando(true);
    try {
      const res = await clienteApi.post('/menu-inventario/insumos/entrada-stock', {
        insumoId: entradaInsumoId,
        cantidad: parseFloat(entradaCantidad),
        costoUnitario: parseFloat(entradaCosto) || 0,
        motivo: entradaMotivo,
      });

      setMensajeExito(res.data?.mensaje || 'Stock abastecido correctamente en el Kardex.');
      setMostrarModalEntrada(false);
      await cargarDatos();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al registrar entrada de stock');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCrearInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumoNombre || !nuevoInsumoUnidadId) return;

    setGuardando(true);
    try {
      await clienteApi.post('/menu-inventario/insumos', {
        nombre: nuevoInsumoNombre,
        codigoInterno: nuevoInsumoCodigo,
        unidadMedidaId: nuevoInsumoUnidadId,
        stockInicial: parseFloat(nuevoInsumoStockInicial) || 0,
        stockMinimo: parseFloat(nuevoInsumoStockMinimo) || 0,
        costoUnitario: parseFloat(nuevoInsumoCostoUnitario) || 0,
      });

      setMensajeExito(`Insumo "${nuevoInsumoNombre}" registrado con éxito.`);
      setMostrarModalNuevoInsumo(false);
      setNuevoInsumoNombre('');
      setNuevoInsumoCodigo('');
      await cargarDatos();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear insumo');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCrearPlato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPlatoNombre || !nuevoPlatoCategoriaId) return;

    setGuardando(true);
    try {
      await clienteApi.post('/menu-inventario/platos', {
        categoriaPlatoId: nuevoPlatoCategoriaId,
        nombre: nuevoPlatoNombre,
        codigo: nuevoPlatoCodigo,
        precioVenta: parseFloat(nuevoPlatoPrecioVenta) || 0,
        descripcion: nuevoPlatoDescripcion,
      });

      setMensajeExito(`Plato "${nuevoPlatoNombre}" agregado a la carta.`);
      setMostrarModalNuevoPlato(false);
      setNuevoPlatoNombre('');
      setNuevoPlatoCodigo('');
      setNuevoPlatoDescripcion('');
      await cargarDatos();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear plato');
    } finally {
      setGuardando(false);
    }
  };

  const valorTotalInventario = insumos.reduce(
    (acc, ins) => acc + ins.stockActual * ins.costoPromedioUnitario,
    0
  );

  const insumosBajoStock = insumos.filter((i) => i.stockActual <= i.stockMinimo);

  return (
    <div className="p-8 space-y-8">
      {/* Alerta flotante de confirmación */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjetas de Resumen de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Insumos Registrados
            </span>
            <span className="text-3xl font-black text-slate-900">{insumos.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
            <Boxes className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Valorización Kardex
            </span>
            <span className="text-3xl font-black text-slate-900">
              S/ {valorTotalInventario.toFixed(2)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Alertas de Stock Mínimo
            </span>
            <span className={`text-3xl font-black ${insumosBajoStock.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {insumosBajoStock.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sección en dos columnas: Insumos de Inventario vs Platos con Recetas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tabla de Insumos */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Insumos y Materia Prima (Kardex)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control de existencias y costos unitarios de compra</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarModalEntrada(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Registrar ingreso de kilos, litros o unidades"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Ingresar Stock</span>
              </button>

              <button
                onClick={abrirModalNuevoInsumo}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nuevo Insumo</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Insumo</th>
                  <th className="pb-3">Stock Actual</th>
                  <th className="pb-3">Costo Unit.</th>
                  <th className="pb-3 text-right">Valorizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {insumos.map((i) => {
                  const bajoStock = i.stockActual <= i.stockMinimo;

                  return (
                    <tr key={i.id} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                      <td className="py-3 font-mono text-[11px] text-slate-500">{i.codigoInterno}</td>
                      <td className="py-3 font-bold text-slate-900">{i.nombre}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                          bajoStock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {i.stockActual.toFixed(2)} {i.unidadMedidaCodigo}
                        </span>
                      </td>
                      <td className="py-3">S/ {i.costoPromedioUnitario.toFixed(2)}</td>
                      <td className="py-3 text-right font-black text-slate-900">
                        S/ {(i.stockActual * i.costoPromedioUnitario).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de Platos y Escandallo de Recetas (Food Cost) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Carta y Recetas (Food Cost)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Platos con descuento automático en cocina</p>
            </div>

            <button
              onClick={abrirModalNuevoPlato}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Plato</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {platos.map((plato) => (
              <div
                key={plato.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 text-xs">{plato.nombre}</h5>
                    {plato.tieneReceta ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">
                        Receta Lista
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">
                        Sin Receta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Precio Venta: <span className="font-bold text-slate-900">S/ {plato.precioVenta.toFixed(2)}</span>
                  </p>
                </div>

                {plato.tieneReceta && (
                  <button
                    onClick={() => verEscandalloReceta(plato)}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-all border border-orange-200 cursor-pointer"
                  >
                    Ver Escandallo
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Ingresar Stock (ej. 20 kg de papa) */}
      {mostrarModalEntrada && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ArrowDownToLine className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Entrada de Stock</h3>
                  <p className="text-xs text-slate-500 font-medium">Abastecimiento de insumos al Kardex</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalEntrada(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarEntradaStock} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Insumo a Abastecer <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={entradaInsumoId}
                  onChange={(e) => setEntradaInsumoId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {insumos.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nombre} ({ins.codigoInterno}) • Stock actual: {ins.stockActual} {ins.unidadMedidaCodigo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Cantidad a Ingresar <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="ej: 20"
                    value={entradaCantidad}
                    onChange={(e) => setEntradaCantidad(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Costo Unitario S/ <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="ej: 2.50"
                    value={entradaCosto}
                    onChange={(e) => setEntradaCosto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Motivo o Detalle de Compra
                </label>
                <input
                  type="text"
                  placeholder="ej: Compra 20 kilos de papa mercado mayorista"
                  value={entradaMotivo}
                  onChange={(e) => setEntradaMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalEntrada(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Registrando...' : 'Ingresar al Kardex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Nuevo Insumo */}
      {mostrarModalNuevoInsumo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Boxes className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Nuevo Insumo</h3>
                  <p className="text-xs text-slate-500 font-medium">Crea una materia prima para recetas y control de stock</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalNuevoInsumo(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarCrearInsumo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Código Interno <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="INS-001"
                    value={nuevoInsumoCodigo}
                    onChange={(e) => setNuevoInsumoCodigo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Correlativo por defecto (editable).</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Unidad de Medida <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={nuevoInsumoUnidadId}
                    onChange={(e) => setNuevoInsumoUnidadId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre del Insumo <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Papa Amarilla Selección"
                  value={nuevoInsumoNombre}
                  onChange={(e) => setNuevoInsumoNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Stock Inicial <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0"
                    value={nuevoInsumoStockInicial}
                    onChange={(e) => setNuevoInsumoStockInicial(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Stock Mínimo <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="5"
                    value={nuevoInsumoStockMinimo}
                    onChange={(e) => setNuevoInsumoStockMinimo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Costo Unit. S/ <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="2.50"
                    value={nuevoInsumoCostoUnitario}
                    onChange={(e) => setNuevoInsumoCostoUnitario(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoInsumo(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Nuevo Plato a la Carta */}
      {mostrarModalNuevoPlato && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Utensils className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Agregar Plato a la Carta</h3>
                  <p className="text-xs text-slate-500 font-medium">Registra un nuevo plato para venta en comandas</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalNuevoPlato(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarCrearPlato} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Categoría del Menú <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={nuevoPlatoCategoriaId}
                    onChange={(e) => setNuevoPlatoCategoriaId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Código de Carta <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PLT-001"
                    value={nuevoPlatoCodigo}
                    onChange={(e) => setNuevoPlatoCodigo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Correlativo por defecto (editable).</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre del Plato <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Lomo Saltado Criollo"
                  value={nuevoPlatoNombre}
                  onChange={(e) => setNuevoPlatoNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Precio de Venta al Público (S/) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  placeholder="38.00"
                  value={nuevoPlatoPrecioVenta}
                  onChange={(e) => setNuevoPlatoPrecioVenta(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Descripción / Guarnición
                </label>
                <textarea
                  rows={2}
                  placeholder="Acompañado de papas fritas crocantes y arroz blanco."
                  value={nuevoPlatoDescripcion}
                  onChange={(e) => setNuevoPlatoDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoPlato(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Plato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Escandallo / Ficha Técnica de la Receta */}
      {platoReceta && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <ChefHat className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ficha Técnica — {platoReceta.nombrePlato}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Insumos y cálculo de costo por porción</p>
                </div>
              </div>
              <button
                onClick={() => setPlatoReceta(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Ingrediente</th>
                      <th className="pb-2">Cantidad Necesaria</th>
                      <th className="pb-2 text-right">Costo Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {platoReceta.ingredientes?.map((ing: any) => (
                      <tr key={ing.id} className="py-2.5 font-semibold text-slate-700">
                        <td className="py-2.5 text-slate-900 font-bold">{ing.insumoNombre}</td>
                        <td className="py-2.5">
                          {ing.cantidadNecesaria} {ing.unidadCodigo}
                        </td>
                        <td className="py-2.5 text-right font-black text-slate-900">
                          S/ {ing.costoEstimadoIngrediente.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Indicadores de Food Cost */}
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Costo Total de Insumos:</span>
                  <span className="font-extrabold text-slate-900">
                    S/ {platoReceta.costoTotalReceta?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Precio de Venta al Público:</span>
                  <span className="font-extrabold text-slate-900">
                    S/ {platoReceta.precioVenta?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-orange-950 font-black pt-2 border-t border-orange-200 text-sm">
                  <span>Margen / Food Cost:</span>
                  <span>
                    {((platoReceta.costoTotalReceta / platoReceta.precioVenta) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPlatoReceta(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
