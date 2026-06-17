import React, { useState, useEffect } from 'react';
import DetailDrawer from './DetailDrawer';
import ReportModal from './ReportModal';
import api from '../../services/api';
import InsumoModal from '../../components/Modals/InsumoModal';
import EditInsumoModal from '../../components/Modals/EditInsumoModal';

export default function CatalogoView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Estados para la conexión con el Backend
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInsumoModalOpen, setIsInsumoModalOpen]= useState(false);
  const [isEditInsumoModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/productos');
      
      
      const productosSeguros = response.data.map(item => {
        // Convertimos el stock estrictamente a Número para evitar el crasheo del .toFixed()
        const valorStock = item.stockActual || item.stock_actual || item.stock || 0;
        const stockNumerico = Number(valorStock); 
        
        const valorMinimo = item.stockMinimo || item.stock_minimo || 5;
        const stockMin = Number(valorMinimo);

        let estadoCalculado = 'ok';
        if (stockNumerico <= stockMin) estadoCalculado = 'low';
        else if (stockNumerico <= stockMin * 2) estadoCalculado = 'mid';

        return {
          ...item,
          stock: stockNumerico, // Lo estandarizamos a "stock" para el resto del frontend
          stockMinimo: stockMin,
          estado: estadoCalculado
        };
      });

      setInsumos(productosSeguros);
    } catch (error) {
      console.error('Error al conectar con la BD:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de búsqueda seguro
  const insumosFiltrados = insumos.filter(item => {
    const nombre = item.nombre?.toLowerCase() || '';
    const categoria = item.categoria?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    
    return nombre.includes(query) || categoria.includes(query);
  });

  const handleRowClick = (producto) => {
    setSelectedProduct(producto);
    setIsDrawerOpen(true);
  };

  const handleOpenReport = (producto) => {
    setIsDrawerOpen(false);
    setIsReportModalOpen(true);
  };
  const handleOpenEdit = (producto) =>{
    setIsDrawerOpen(false);
    setIsEditModalOpen(true);
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Catálogo General</h2>
          <p className="text-text-muted text-sm mt-1">Gestión y control de inventario físico</p>
        </div>
        
        {/* Buscador local y botones */}
        <div className="flex gap-3 w-full sm:w-auto">
           {/* Botón de recarga manual */}
          <button 
            onClick={fetchProductos}
            disabled={loading}
            className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            title="Sincronizar directorio"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.212 15M16 11.5H21.5V6" />
            </svg>
          </button>

          <input 
            type="text" 
            placeholder="Filtrar catálogo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none w-full sm:w-64 focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all"
          />
          <button onClick={() => setIsInsumoModalOpen(true)}
             className="flex items-center justify-center gap-2 px-4 rounded-lg bg-text-primary text-app font-heading font-bold text-sm transition-opacity hover:opacity-85 whitespace-nowrap dark:bg-accent dark:text-[#002D4C]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Renderizado condicional de carga / Tabla */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
           <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-right">Stock</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {insumosFiltrados.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-tableHover cursor-pointer transition-colors group"
                  >
                    <td className="p-4 text-sm font-mono text-text-muted group-hover:text-text-primary">#{item.id}</td>
                    <td className="p-4 font-semibold text-text-primary">{item.nombre}</td>
                    <td className="p-4 text-sm text-text-secondary hidden sm:table-cell">{item.categoria}</td>
                    <td className="p-4 text-right">
                      <span className="font-heading font-bold text-accent text-base">{item.stock.toFixed(2)}</span>
                      <span className="text-xs text-text-muted ml-1">{item.unidad}</span>
                    </td>
                    <td className="p-4 text-center">
                      {item.estado === 'ok' && <span className="bg-green-500/10 text-green-600 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">NORMAL</span>}
                      {item.estado === 'mid' && <span className="bg-yellow-500/10 text-yellow-600 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">MODERADO</span>}
                      {item.estado === 'low' && <span className="bg-red-500/10 text-red-500 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">CRÍTICO</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {insumosFiltrados.length === 0 && (
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