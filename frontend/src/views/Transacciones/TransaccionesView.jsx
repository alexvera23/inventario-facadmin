import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import EditTransaccionModal from '../../components/Modals/EditTransaccionModal';
import PaginationControls from '../../components/PaginationControls';
import TransaccionDrawer from './TransaccionesDrawer';

const EDIFICIOS_DISPONIBLES = ['ADM1', 'ADM2', 'ADM3', 'ADM4', 'LAB_SISTEMAS', 'BODEGA_CENTRAL'];

export default function TransaccionesView() {
  // ─── ESTADOS DE BÚSQUEDA Y FILTROS ───
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [edificioFiltro, setEdificioFiltro] = useState('TODOS');

  // ─── ESTADOS DE PAGINACIÓN ───
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState(null);

  // ─── ESTADOS DE DATOS, MODAL Y DRAWER ───
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // LÓGICA DE DEBOUNCE (Retraso de 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1); // Regresamos a la página 1 si cambia la búsqueda
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FETCH PRINCIPAL CON PAGINACIÓN Y FILTROS
  const fetchMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/movimientos/historial', {
        params: {
          page,
          limit,
          busqueda: debouncedTerm,
          tipo: tipoFiltro,
          edificio: edificioFiltro
        }
      });

      setMovimientos(response.data.data || []);
      setPaginationInfo(response.data.pagination || null);
    } catch (err) {
      console.error('Error al obtener transacciones:', err);
      setError('No se pudo recuperar la bitácora de transacciones.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedTerm, tipoFiltro, edificioFiltro]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const handleOpenEdit = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setIsModalOpen(true);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleRowClick = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <h2 className="text-2xl font-heading font-bold text-text-primary">Historial de Transacciones</h2>
          </div>
          <p className="text-text-muted text-sm mt-1">Gestión, auditoría y corrección de entradas y salidas de almacén</p>
        </div>
        
        {/* Controles de Búsqueda y Filtros */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          
          <button 
            onClick={fetchMovimientos}
            disabled={loading}
            className="p-2.5 bg-card border border-border rounded-lg text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            title="Sincronizar historial"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Filtro por Tipo */}
          <select
            value={tipoFiltro}
            onChange={(e) => {
              setTipoFiltro(e.target.value);
              setPage(1);
            }}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-xs font-semibold text-text-primary outline-none focus:border-accent"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </select>

          {/* Filtro por Edificio */}
          <select
            value={edificioFiltro}
            onChange={(e) => {
              setEdificioFiltro(e.target.value);
              setPage(1);
            }}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-xs font-semibold text-text-primary outline-none focus:border-accent"
          >
            <option value="TODOS">Todas las Sedes</option>
            {EDIFICIOS_DISPONIBLES.map(edif => (
              <option key={edif} value={edif}>{edif}</option>
            ))}
          </select>

          {/* Input de Búsqueda con Debounce */}
          <input 
            type="text" 
            placeholder="Buscar por producto, encargado o solicitante..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-xs text-text-primary outline-none flex-1 min-w-[200px] focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Renderizado condicional: Error / Tabla */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl mb-3">⚠️</span>
          <p className="text-red-500 font-bold mb-2">{error}</p>
          <button onClick={fetchMovimientos} className="px-4 py-2 mt-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-auto relative rounded-t-xl">
            {loading && (
              <div className="absolute inset-0 bg-card/50 backdrop-blur-[1px] z-10 flex justify-center items-center">
                 <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="border-b border-border bg-inputBg">
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">ID / Fecha</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Tipo / Sede</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Producto</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-right">Cantidad</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Encargado / Solicitante</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movimientos.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-text-muted italic">
                      No se encontraron transacciones en la bitácora.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => handleRowClick(m)} 
                      className="hover:bg-tableHover cursor-pointer transition-colors group"
                    >
                      <td className="p-4">
                        <p className="font-bold text-text-primary text-sm font-mono">#{m.id}</p>
                        <p className="text-[0.7rem] text-text-muted">
                          {new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold font-heading uppercase ${m.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                            {m.tipo}
                          </span>
                          <span className="text-[0.7rem] font-mono font-semibold text-text-muted">
                             {m.edificio}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-text-primary text-sm truncate max-w-[200px]">{m.producto?.nombre}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono font-bold text-sm ${m.tipo === 'ENTRADA' ? 'text-green-500' : 'text-red-500'}`}>
                          {m.tipo === 'ENTRADA' ? '+' : '-'}{parseFloat(m.cantidad).toFixed(2)}
                        </span>
                        <span className="text-xs text-text-muted ml-1">{m.producto?.unidad_medida}</span>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="font-semibold text-text-primary truncate max-w-[160px]">
                          <span className="text-text-muted font-normal">Resp:</span> {m.encargado?.nombre || 'N/A'}
                        </p>
                        {m.solicitante && (
                          <p className="text-text-secondary truncate max-w-[160px]">
                            <span className="text-text-muted font-normal">Sol:</span> {m.solicitante.nombre}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEdit(m)}
                          className="px-3 py-1.5 bg-inputBg border border-border text-text-secondary hover:text-accent hover:border-accent rounded-lg text-xs font-bold transition-colors"
                        >
                          Corregir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* COMPONENTE DE PAGINACIÓN */}
          <PaginationControls 
            pagination={paginationInfo}
            onPageChange={(nuevaPag) => setPage(nuevaPag)}
            onLimitChange={handleLimitChange}
          />

        </div>
      )}

      {/* Instancia del Drawer */}
      <TransaccionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transaccion={selectedMovimiento}
        onOpenEdit={handleOpenEdit}
      />

      {/* Modal de edición */}
      <EditTransaccionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaccion={selectedMovimiento}
        onSuccess={fetchMovimientos}
      />
    </div>
  );
}