import React, { useState, useEffect } from 'react';
import { clienteApi } from '../../servicios/clienteApi';
import { Plato, CategoriaPlato } from '../../tipos/modelos';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Send,
  Utensils,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface ItemPedido {
  plato: Plato;
  cantidad: number;
  notasCocina: string;
}

interface ModalComandaProps {
  mesaId: string;
  codigoMesa: string;
  alCerrar: () => void;
  alComandaCreada: () => void;
}

export const ModalComanda: React.FC<ModalComandaProps> = ({
  mesaId,
  codigoMesa,
  alCerrar,
  alComandaCreada,
}) => {
  const [categorias, setCategorias] = useState<CategoriaPlato[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string | null>(null);
  const [itemsPedido, setItemsPedido] = useState<ItemPedido[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarCategoriasYPlatos();
  }, []);

  const cargarCategoriasYPlatos = async () => {
    try {
      const [resCat, resPlatos] = await Promise.all([
        clienteApi.get<CategoriaPlato[]>('/menu-inventario/categorias'),
        clienteApi.get<Plato[]>('/menu-inventario/platos'),
      ]);
      setCategorias(resCat.data);
      setPlatos(resPlatos.data);
      if (resCat.data.length > 0) {
        setCategoriaSeleccionadaId(resCat.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando menú:', err);
    }
  };

  const agregarPlato = (plato: Plato) => {
    setItemsPedido((prev) => {
      const existe = prev.find((item) => item.plato.id === plato.id);
      if (existe) {
        return prev.map((item) =>
          item.plato.id === plato.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { plato, cantidad: 1, notasCocina: '' }];
    });
  };

  const modificarCantidad = (platoId: string, cambio: number) => {
    setItemsPedido((prev) =>
      prev
        .map((item) => {
          if (item.plato.id === platoId) {
            const nuevaCantidad = item.cantidad + cambio;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter(Boolean) as ItemPedido[]
    );
  };

  const cambiarNotas = (platoId: string, notas: string) => {
    setItemsPedido((prev) =>
      prev.map((item) =>
        item.plato.id === platoId ? { ...item, notasCocina: notas } : item
      )
    );
  };

  const totalComanda = itemsPedido.reduce(
    (acc, item) => acc + item.plato.precioVenta * item.cantidad,
    0
  );

  const enviarComanda = async () => {
    if (itemsPedido.length === 0) {
      setError('Agregue al menos un plato al pedido.');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await clienteApi.post('/comandas', {
        mesaId,
        items: itemsPedido.map((item) => ({
          platoId: item.plato.id,
          cantidad: item.cantidad,
          notasCocina: item.notasCocina || null,
        })),
      });

      alComandaCreada();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al enviar la comanda.');
      setEnviando(false);
    }
  };

  const platosFiltrados = categoriaSeleccionadaId
    ? platos.filter((p) => p.categoriaPlatoId === categoriaSeleccionadaId)
    : platos;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-orange-600 font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Tomar Pedido — <span className="text-orange-600">{codigoMesa}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Seleccione los platos para la comanda</p>
            </div>
          </div>
          <button
            onClick={alCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Contenido en dos columnas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Columna Izquierda: Categorías y Platos */}
          <div className="w-7/12 border-r border-slate-100 flex flex-col bg-white">
            {/* Pestañas de Categoría */}
            <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionadaId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    categoriaSeleccionadaId === cat.id
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Grilla de Platos */}
            <div className="flex-1 p-5 overflow-y-auto grid grid-cols-2 gap-3.5 content-start">
              {platosFiltrados.map((plato) => (
                <div
                  key={plato.id}
                  onClick={() => agregarPlato(plato)}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md">
                        {plato.codigo}
                      </span>
                      {plato.tieneReceta && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Con Receta
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2 group-hover:text-orange-600 transition-colors">
                      {plato.nombre}
                    </h4>
                    {plato.descripcion && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {plato.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-sm font-extrabold text-slate-900">
                      S/ {plato.precioVenta.toFixed(2)}
                    </span>
                    <button className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Ticket / Resumen de la Comanda */}
          <div className="w-5/12 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ticket de Comanda ({itemsPedido.length} ítems)
              </span>
              {itemsPedido.length > 0 && (
                <button
                  onClick={() => setItemsPedido([])}
                  className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Lista de ítems en el ticket */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {itemsPedido.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <Utensils className="w-10 h-10 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold">No hay platos seleccionados.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Haga clic en los platos a la izquierda para agregarlos al pedido.</p>
                </div>
              ) : (
                itemsPedido.map((item) => (
                  <div
                    key={item.plato.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{item.plato.nombre}</h5>
                        <p className="text-[11px] text-slate-500">
                          S/ {item.plato.precioVenta.toFixed(2)} c/u
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs">
                        S/ {(item.plato.precioVenta * item.cantidad).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Nota: Sin cebolla, etc."
                        value={item.notasCocina}
                        onChange={(e) => cambiarNotas(item.plato.id, e.target.value)}
                        className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                      />

                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => modificarCantidad(item.plato.id, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-slate-900">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => modificarCantidad(item.plato.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total y Botón de Enviar a Cocina */}
            <div className="p-5 bg-white border-t border-slate-200 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Total a Pagar</span>
                <span className="text-xl font-extrabold text-slate-900">
                  S/ {totalComanda.toFixed(2)}
                </span>
              </div>

              <button
                onClick={enviarComanda}
                disabled={enviando || itemsPedido.length === 0}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4 stroke-[2.2]" />
                <span>{enviando ? 'Despachando a Cocina...' : 'Despachar Comanda a Cocina'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
