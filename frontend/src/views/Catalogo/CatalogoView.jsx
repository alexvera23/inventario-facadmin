import React, { useState, useEffect } from 'react';
import DetailDrawer from './DetailDrawer';
import ReportModal from './ReportModal';
import api from '../../services/api';
import InsumoModal from '../../components/Modals/InsumoModal';
import EditInsumoModal from '../../components/Modals/EditInsumoModal';
import { toastService } from '../../services/toastService'; // Ajusta si es diferente

// Los mismos edificios que en Ventanilla
const EDIFICIOS_DISPONIBLES = ['ADM1', 'ADM2', 'ADM3', 'ADM4', 'LAB_SISTEMAS', 'BODEGA_CENTRAL'];

export default function CatalogoView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [edificioFiltro, setEdificioFiltro] = useState('TODOS'); //  Filtro geográfico
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Modales y Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen]= useState(false);
  const [isEditInsumoModalOpen, setIsEditModalOpen] = useState(false);

  // Estados para la conexión con el Backend
  const [insumosRaw, setInsumosRaw] = useState([]); // Guardamos la data cruda
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  


  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/productos');
      //  Ahora guardamos la data cruda tal como viene, con su array de 'existencias'
      setInsumosRaw(response.data); 
      setError(null);
    } catch (error) {
      setError('No se pudo cargar la lista de productos. Verifica la conexión con la base de datos.');
      toastService.error('ERROR EN EL SERVIDOR');
    } finally {
      setLoading(false);
    }
  };

  //  Lógica de filtrado dinámico y cálculo matemático por edificio
  const insumosProcesados = insumosRaw
    .filter(item => {
      // 1. Filtro por texto de búsqueda
      const nombre = item.nombre?.toLowerCase() || '';
      const categoria = item.categoria?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();
      return nombre.includes(query) || categoria.includes(query);
    })
    .map(item => {
      // 2. Cálculo de stock y mínimos basado en el edificio seleccionado
      let stockNumerico = 0;
      let stockMin = 0;

      if (edificioFiltro === 'TODOS') {
        // Sumar todo el inventario de todos los edificios
        if (item.existencias && item.existencias.length > 0) {
          stockNumerico = item.existencias.reduce((acc, curr) => acc + Number(curr.stock_actual), 0);
          stockMin = item.existencias.reduce((acc, curr) => acc + Number(curr.stock_minimo), 0);
        }
      } else {
        // Buscar el stock específico del edificio seleccionado
        const existencia = item.existencias?.find(e => e.edificio === edificioFiltro);
        if (existencia) {
          stockNumerico = Number(existencia.stock_actual);
          stockMin = Number(existencia.stock_minimo);
        } else {
          stockNumerico = 0;
          stockMin = 5; // Default si nunca ha entrado a ese edificio
        }
      }

      // 3. Determinar estado crítico de forma local al cálculo
      let estadoCalculado = 'ok';
      if (stockNumerico <= stockMin) estadoCalculado = 'low';
      else if (stockNumerico <= stockMin * 2) estadoCalculado = 'mid';

      // 4. Retornamos el objeto intacto pero inyectando nuestras propiedades calculadas
      return {
        ...item,
        stockCalculado: stockNumerico,
        stockMinimoCalculado: stockMin,
        estadoCalculado
      };
    });

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

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header de la sección */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Catálogo General</h2>
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/*  Selector de Edificio */}
          <select
            value={edificioFiltro}


            onChange={(e) => setEdificioFiltro(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-sm font-semibold text-text-primary outline-none focus:border-accent"
          >
            <option value="TODOS"> Stock Global (Todas las Sedes)</option>
            {EDIFICIOS_DISPONIBLES.map(edif => (
              <option key={edif} value={edif}> {edif}</option>
            ))}
          </select>

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

      {/* Renderizado condicional de carga / error / Tabla */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl mb-3">⚠️</span>
          <p className="text-red-500 font-bold mb-2">{error}</p>
          <button onClick={fetchProductos} className="px-4 py-2 mt-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-inputBg">
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">ID</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Insumo</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted hidden sm:table-cell">Categoría</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-right">Stock {edificioFiltro !== 'TODOS' && `en ${edificioFiltro}`}</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {insumosProcesados.map((item) => (
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
                      {/*  Renderizamos la variable calculada */}
                      <span className="font-heading font-bold text-accent text-base">
                        {item.stockCalculado.toFixed(2)}
                      </span>
                      <span className="text-xs text-text-muted ml-1">
                        {item.unidad_medida}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {/*  Renderizamos el estado calculado dinámicamente */}
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
                ))}
              </tbody>
            </table>

            {insumosProcesados.length === 0 && (
              <div className="p-8 text-center text-text-muted">
                No se encontraron insumos que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instancia del Drawer */}
      <DetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        producto={selectedProduct} 
        onOpenReport={handleOpenReport}
        onOpenEdit={handleOpenEdit}
      />

      {/* Instancia del Modal de Reportes */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialScope="insumo"
        initialSubjectId={selectedProduct?.id}
      />
      
      {/*Formulario Modal Insumo*/}
      <InsumoModal
        isOpen={isInsumoModalOpen}
        onClose={() => setIsInsumoModalOpen(false)}
        onSuccess={fetchProductos}
      />
      
      {/*Formulario modal de edición */}
      <EditInsumoModal
        isOpen={isEditInsumoModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProductos}
        insumo={selectedProduct} 
      />

    </div>
  );
}