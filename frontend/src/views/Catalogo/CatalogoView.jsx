import React, { useState, useEffect, useCallback } from 'react';
import DetailDrawer from './DetailDrawer';
import ReportModal from '../Reportes/ReportModal';
import api from '../../services/api';
import InsumoModal from '../../components/Modals/InsumoModal';
import EditInsumoModal from '../../components/Modals/EditInsumoModal';
import PaginationControls from '../../components/PaginationControls'; //  Asegúrate de tener esta ruta correcta
import { toastService } from '../../services/toastService';

// Los mismos edificios que en Ventanilla
const EDIFICIOS_DISPONIBLES = ['ADM1', 'ADM2', 'ADM3', 'ADM4', 'LAB_SISTEMAS', 'BODEGA_CENTRAL'];

export default function CatalogoView() {
  // ─── ESTADOS DE BÚSQUEDA Y FILTROS ───
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState(''); // Estado para el retraso (Debounce)
  const [edificioFiltro, setEdificioFiltro] = useState('TODOS');
  
  // ─── ESTADOS DE PAGINACIÓN ───
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState(null);

  // ─── ESTADOS DE DATOS Y UI ───
  const [insumosRaw, setInsumosRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [isEditInsumoModalOpen, setIsEditModalOpen] = useState(false);

  //  LÓGICA DE DEBOUNCE (Retraso de 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1); // Si el usuario escribe una nueva búsqueda, lo regresamos a la página 1
    }, 500);

    return () => clearTimeout(timer); // Limpiamos el timer si el usuario sigue tecleando
  }, [searchTerm]);

  //  FETCH PRINCIPAL (Se dispara al cambiar página, límite, sede o el término con debounce)
  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true);
      // Petición a la API paginada
      const response = await api.get('/productos', {
        params: {
          page,
          limit,
          busqueda: debouncedTerm,
          edificio: edificioFiltro
        }
      });
      
      // El backend ahora devuelve { data: [...], pagination: {...} }
      setInsumosRaw(response.data.data || []);
      setPaginationInfo(response.data.pagination || null);
      setError(null);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setError('No se pudo cargar la lista de productos. Verifica la conexión con la base de datos.');
      toastService.error('ERROR EN EL SERVIDOR');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedTerm, edificioFiltro]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  // ─── CÁLCULO DE ESTADO CRÍTICO (El filtrado de texto ya lo hace el Backend) ───
  const insumosProcesados = insumosRaw.map(item => {
    let stockNumerico = 0;
    let stockMin = 0;

    if (edificioFiltro === 'TODOS') {
      if (item.existencias && item.existencias.length > 0) {
        stockNumerico = item.existencias.reduce((acc, curr) => acc + Number(curr.stock_actual), 0);
        stockMin = item.existencias.reduce((acc, curr) => acc + Number(curr.stock_minimo), 0);
      }
    } else {
      const existencia = item.existencias?.find(e => e.edificio === edificioFiltro);
      if (existencia) {
        stockNumerico = Number(existencia.stock_actual);
        stockMin = Number(existencia.stock_minimo);
      } else {
        stockMin = 5; 
      }
    }

    let estadoCalculado = 'ok';
    if (stockNumerico <= stockMin) estadoCalculado = 'low';
    else if (stockNumerico <= stockMin * 2) estadoCalculado = 'mid';

    return {
      ...item,
      stockCalculado: stockNumerico,
      stockMinimoCalculado: stockMin,
      estadoCalculado
    };
  });

  // ─── HANDLERS DE UI ───
  const handleRowClick = (producto) => {
    setSelectedProduct(producto);
    setIsDrawerOpen(true);
  };

  const handleOpenReport = () => {
    setIsDrawerOpen(false);
    setIsReportModalOpen(true);
  };

  const handleOpenEdit = () => {
    setIsDrawerOpen(false);
    setIsEditModalOpen(true);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Regresamos a la página 1 si cambia la cantidad de registros visibles
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      
      {/* Header de la sección */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h2 className="text-2xl font-heading font-bold text-text-primary">Catálogo General</h2>
          </div>
          <p className="text-text-muted text-sm mt-1">Gestión y control de inventario multi-sede</p>
        </div>
        
        {/* Controles: Refrescar, Sede, Búsqueda, Nuevo */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          
          <button 
            onClick={fetchProductos}
            disabled={loading}
            className="p-2.5 bg-card border border-border rounded-lg text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            title="Sincronizar directorio"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Selector de Edificio */}
          <select
            value={edificioFiltro}
            onChange={(e) => {
              setEdificioFiltro(e.target.value);
              setPage(1); // Reset de paginación al cambiar sede
            }}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-sm font-semibold text-text-primary outline-none focus:border-accent"
          >
            <option value="TODOS"> Stock Global (Todas las Sedes)</option>
            {EDIFICIOS_DISPONIBLES.map(edif => (
              <option key={edif} value={edif}> {edif}</option>
            ))}
          </select>

          {/* Input de Búsqueda Predictiva con Debounce */}
          <input 
            type="text" 
            placeholder="Filtrar catálogo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none flex-1 min-w-[200px] focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all"
          />
          
          <button onClick={() => setIsInsumoModalOpen(true)}
             className="flex items-center justify-center gap-2 px-4 rounded-lg bg-text-primary text-app font-heading font-bold text-sm transition-opacity hover:opacity-85 whitespace-nowrap dark:bg-accent dark:text-[#002D4C]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl mb-3">⚠️</span>
          <p className="text-red-500 font-bold mb-2">{error}</p>
          <button onClick={fetchProductos} className="px-4 py-2 mt-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col min-h-0">
          
          {/* Contenedor scrolleable de la tabla */}
          <div className="flex-1 overflow-auto relative rounded-t-xl">
            {loading && (
              <div className="absolute inset-0 bg-card/50 backdrop-blur-[1px] z-10 flex justify-center items-center">
                 <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="border-b border-border bg-inputBg">
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">ID</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Insumo</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted hidden sm:table-cell">Categoría</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-right">Stock {edificioFiltro !== 'TODOS' && `en ${edificioFiltro}`}</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {insumosProcesados.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-text-muted italic">
                      No se encontraron insumos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  insumosProcesados.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-tableHover cursor-pointer transition-colors group"
                    >
                      <td className="p-4 text-sm font-mono text-text-muted group-hover:text-text-primary">
                        #{item.id}
                      </td>
                      <td className="p-4 font-semibold text-text-primary">
                        {item.nombre}
                      </td>
                      <td className="p-4 text-sm text-text-secondary hidden sm:table-cell">
                        {item.categoria}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-heading font-bold text-accent text-base">
                          {item.stockCalculado.toFixed(2)}
                        </span>
                        <span className="text-xs text-text-muted ml-1">
                          {item.unidad_medida}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.estadoCalculado === "ok" && (
                          <span className="bg-green-500/10 text-green-600 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">NORMAL</span>
                        )}
                        {item.estadoCalculado === "mid" && (
                          <span className="bg-yellow-500/10 text-yellow-600 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">MODERADO</span>
                        )}
                        {item.estadoCalculado === "low" && (
                          <span className="bg-red-500/10 text-red-500 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">CRÍTICO</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/*  COMPONENTE DE PAGINACIÓN */}
          <PaginationControls 
            pagination={paginationInfo}
            onPageChange={(nuevaPag) => setPage(nuevaPag)}
            onLimitChange={handleLimitChange}
          />
          
        </div>
      )}

      {/* Modales */}
      <DetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        producto={selectedProduct} 
        onOpenReport={handleOpenReport}
        onOpenEdit={handleOpenEdit}
      />

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialScope="insumo"
        initialSubjectId={selectedProduct?.id}
      />
      
      <InsumoModal
        isOpen={isInsumoModalOpen}
        onClose={() => setIsInsumoModalOpen(false)}
        onSuccess={fetchProductos}
      />
      
      <EditInsumoModal
        isOpen={isEditInsumoModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProductos}
        insumo={selectedProduct} 
      />

    </div>
  );
}