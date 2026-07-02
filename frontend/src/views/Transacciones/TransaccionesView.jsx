import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import EditTransaccionModal from '../../components/Modals/EditTransaccionModal';

export default function TransaccionesView() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/movimientos/historial'); 
      setMovimientos(response.data);
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setIsModalOpen(true);
  };

  // Filtrado básico
  const movimientosFiltrados = movimientos.filter(m => {
    const query = searchTerm.toLowerCase();
    const producto = m.producto?.nombre?.toLowerCase() || '';
    const responsable = m.encargado?.nombre?.toLowerCase() || '';
    return producto.includes(query) || responsable.includes(query);
  });

  return (
    <div className="flex flex-col h-full animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Historial de Transacciones</h2>
          <p className="text-text-muted text-sm mt-1">Gestión y corrección de entradas y salidas de almacén</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Buscar por producto o encargado..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none flex-1 sm:w-64 focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
             <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-inputBg">
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">ID / Fecha</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Tipo</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Producto</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-right">Cantidad</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Encargado</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movimientosFiltrados.map((m) => (
                  <tr key={m.id} className="hover:bg-tableHover transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-text-primary text-sm">#{m.id}</p>
                      <p className="text-[0.7rem] text-text-muted">{new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold font-heading uppercase ${m.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-text-primary text-sm truncate max-w-[200px]">{m.producto?.nombre}</p>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-mono font-bold text-sm ${m.tipo === 'ENTRADA' ? 'text-green-500' : 'text-red-500'}`}>
                        {m.tipo === 'ENTRADA' ? '+' : '-'}{parseFloat(m.cantidad).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-secondary truncate max-w-[150px]">
                      {m.encargado?.nombre}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleOpenEdit(m)}
                        className="px-3 py-1.5 bg-inputBg border border-border text-text-secondary hover:text-accent hover:border-accent rounded-lg text-xs font-bold transition-colors"
                      >
                        Corregir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {movimientosFiltrados.length === 0 && (
              <div className="p-10 text-center text-text-muted">
                No se encontraron transacciones.
              </div>
            )}
          </div>
        )}
      </div>

      <EditTransaccionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaccion={selectedMovimiento}
        onSuccess={fetchMovimientos}
      />
    </div>
  );
}