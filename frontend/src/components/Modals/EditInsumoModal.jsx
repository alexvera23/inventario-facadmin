import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService';

export default function EditInsumoModal({ isOpen, onClose, insumo, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Limpieza',
    unidad_medida: 'Pzas',
    stock_actual: '',
    stock_minimo: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && insumo) {
      setFormData({
        nombre: insumo.nombre || '',
        categoria: insumo.categoria || 'Limpieza',
        unidad_medida: insumo.unidad || insumo.unidad_medida || 'Pzas',
        stock_actual: insumo.stock !== undefined ? insumo.stock : insumo.stock_actual,
        stock_minimo: insumo.stock_minimo || 0
      });
    }
  }, [isOpen, insumo]);

  if (!isOpen || !insumo) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        stock_actual: parseFloat(formData.stock_actual) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 0
      };

      await api.put(`/productos/${insumo.id}`, payload);
      toastService.success('Ajuste de insumo guardado correctamente.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar insumo:', error);
      toastService.error(error.response?.data?.message || 'Error al actualizar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el insumo "${insumo.nombre}"?`);
    if (!confirmar) return;

    setIsDeleting(true);
    try {
      await api.delete(`/productos/${insumo.id}`);
      toastService.success('Insumo eliminado del catálogo.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al eliminar insumo:', error);
      toastService.error(error.response?.data?.message || 'No se pudo eliminar el insumo. Verifica que no tenga movimientos históricos.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        <div className="flex items-center justify-between p-5 border-b border-border bg-inputBg">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-text-primary">Ajuste de Insumo</h3>
            <p className="text-xs text-text-muted mt-0.5">Editar información o corregir stock manual</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-5 flex flex-col gap-4">
          
          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Nombre del Insumo</label>
            <input 
              type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Categoría</label>
              <select 
                name="categoria" required value={formData.categoria} onChange={handleChange}
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              >
                <option value="Limpieza">Limpieza</option>
                <option value="Higiene">Higiene</option>
                <option value="Papeleria">Papeleria</option>
                <option value="Mobiliario escolar">Mobiliario escolar</option>
                <option value="Servicios Medicos">Servicios Médicos</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Unidad Base</label>
              <select 
                name="unidad_medida" value={formData.unidad_medida} onChange={handleChange}
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              >
                <option value="Pzas">Pzas</option>
                <option value="L">L</option>
                <option value="Kg">Kg</option>
                <option value="Mts">Mts</option>
                <option value="Cajas">Cajas</option>
                <option value="Paquetes">Paquetes</option>
              </select>
            </div>
          </div>

          {/* Zona de Peligro: Modificación directa de Stock */}
          <div className="p-4 border border-accent/30 bg-accent/5 rounded-xl">
            <p className="text-[0.65rem] font-heading font-bold uppercase text-accent mb-3 tracking-widest">Ajustes de Inventario Físico</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-primary mb-1.5">Stock Real Actual</label>
                <input 
                  type="number" step="0.01" name="stock_actual" required value={formData.stock_actual} onChange={handleChange}
                  className="w-full bg-card border border-border rounded-lg p-2 text-sm font-mono text-text-primary outline-none focus:border-accent shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-primary mb-1.5">Stock Mínimo</label>
                <input 
                  type="number" step="0.01" name="stock_minimo" required value={formData.stock_minimo} onChange={handleChange}
                  className="w-full bg-card border border-border rounded-lg p-2 text-sm font-mono text-text-primary outline-none focus:border-accent shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 pt-4 border-t border-border">
            <button 
              type="button" onClick={handleDelete} disabled={isDeleting || isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-heading font-bold text-sm hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
            <div className="flex gap-2">
              <button 
                type="button" onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary font-heading font-bold text-sm hover:bg-inputBg transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" disabled={isSubmitting || isDeleting}
                className="px-4 py-2 rounded-lg bg-accent text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}