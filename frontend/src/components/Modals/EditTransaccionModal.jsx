import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService';

export default function EditTransaccionModal({ isOpen, onClose, transaccion, onSuccess }) {
  const [formData, setFormData] = useState({
    cantidad: '',
    observaciones: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && transaccion) {
      setFormData({
        cantidad: transaccion.cantidad || '',
        observaciones: transaccion.observaciones || ''
      });
    }
  }, [isOpen, transaccion]);

  if (!isOpen || !transaccion) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        cantidad: parseFloat(formData.cantidad),
        observaciones: formData.observaciones
      };

      await api.put(`/movimientos/${transaccion.id}`, payload);
      toastService.success('Transacción corregida y stock compensado.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      toastService.error(error.response?.data?.message || 'Error al compensar el stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        <div className="flex items-center justify-between p-5 border-b border-border bg-inputBg">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-text-primary">Corregir Transacción</h3>
            <p className="text-xs text-text-muted mt-0.5">Operación # {transaccion.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          
          {/* Info de solo lectura */}
          <div className="p-3 bg-inputBg border border-border rounded-lg mb-2">
            <p className="text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1">Producto Afectado</p>
            <p className="font-semibold text-text-primary text-sm truncate">{transaccion.producto?.nombre}</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-[0.65rem] uppercase text-text-muted">Tipo</p>
                <p className={`text-xs font-bold ${transaccion.tipo === 'ENTRADA' ? 'text-green-500' : 'text-red-500'}`}>{transaccion.tipo}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase text-text-muted">Cantidad Original</p>
                <p className="text-xs font-bold text-text-secondary">{transaccion.cantidad} {transaccion.producto?.unidad_medida}</p>
              </div>
            </div>
          </div>

          {/* Campos Editables */}
          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Cantidad Real (Corregida) *</label>
            <input 
              type="number" step="0.01" name="cantidad" required value={formData.cantidad} onChange={handleChange}
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm font-mono text-text-primary outline-none focus:border-accent shadow-inner"
            />
            <p className="text-[0.65rem] text-accent mt-1.5 leading-tight">
               Al guardar, el sistema calculará la diferencia matemática y ajustará automáticamente el stock físico del almacén.
            </p>
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Motivo de la corrección *</label>
            <textarea 
              name="observaciones" required rows="2" value={formData.observaciones} onChange={handleChange}
              placeholder="Ej. Error de captura en ventanilla, se entregaron 4 en lugar de 5."
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent resize-none"
            ></textarea>
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary font-heading font-bold text-sm hover:bg-inputBg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Procesando...' : 'Aplicar Corrección'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}