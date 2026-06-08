import React, { useState } from 'react';
import DetailDrawer from './DetailDrawer';
import ReportModal from './ReportModal';

// Datos de prueba (Luego los conectaremos a tu backend con Axios)
const INSUMOS_MOCK = [
  { id: 1, nombre: 'Cloro Líquido Concentrado', categoria: 'Limpieza', stock: 12.00, unidad: 'L', estado: 'ok' },
  { id: 2, nombre: 'Papel Higiénico Institucional', categoria: 'Higiene', stock: 480.00, unidad: 'Pzas', estado: 'ok' },
  { id: 3, nombre: 'Jabón para Manos (Rellenable)', categoria: 'Higiene', stock: 2.50, unidad: 'L', estado: 'low' },
  { id: 4, nombre: 'Marcadores Magistral Negro', categoria: 'Papelería', stock: 15.00, unidad: 'Pzas', estado: 'mid' },
];

export default function CatalogoView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filtrado de búsqueda
  const insumosFiltrados = INSUMOS_MOCK.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (producto) => {
    setSelectedProduct(producto);
    setIsDrawerOpen(true);
  };

// Función para abrir el reporte desde el Drawer
  const handleOpenReport = (producto) => {
    setIsDrawerOpen(false); // Cerramos el drawer temporalmente (opcional)
    setIsReportModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Catálogo General</h2>
          <p className="text-text-muted text-sm mt-1">Gestión y control de inventario físico</p>
        </div>
        
        {/* Buscador local */}
        <div className= "flex gap-3 w-full sm:w-auto">
           <input 
          type="text" 
          placeholder="Filtrar catálogo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none w-full sm:w-64 focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all"
        />
        <button className="flex items-center justify-center gap-2 px-4 rounded-lg bg-text-primary text-app font-heading font-bold text-sm transition-opacity hover:opacity-85 whitespace-nowrap dark:bg-accent dark:text-[#002D4C]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">Nuevo Insumo</span>
        </button>
        </div>
       
      </div>

      {/* Tarjeta de la Tabla */}
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

      {/* Instancia del Drawer */}
      <DetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        producto={selectedProduct} 
        onOpenReport={handleOpenReport} // <-- Pasamos la función al Drawer
      />

      {/* Instancia del nuevo Modal de Reportes */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialScope="insumo"
        initialSubjectId={selectedProduct?.id}
      />
    </div>
  );
}