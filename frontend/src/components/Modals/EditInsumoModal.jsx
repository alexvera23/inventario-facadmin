import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService'; // Ajusta la ruta si es necesario

export default function EditInsumoModal({ isOpen, onClose, insumo, onSuccess }) {
  // --------------------------------------------------------
  // ESTADOS DEL FORMULARIO PRINCIPAL
  // --------------------------------------------------------
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Limpieza',
    unidad_medida: 'Pzas'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --------------------------------------------------------
  // ESTADOS PARA EMBALAJES
  // --------------------------------------------------------
  const [embalajes, setEmbalajes] = useState([]);
  const [nuevoEmbalaje, setNuevoEmbalaje] = useState({ nombre_embalaje: '', factor_conversion: '' });
  const [isAddingEmbalaje, setIsAddingEmbalaje] = useState(false);

  useEffect(() => {
    if (isOpen && insumo) {
      setFormData({
        nombre: insumo.nombre || '',
        categoria: insumo.categoria || 'Limpieza',
        unidad_medida: insumo.unidad || insumo.unidad_medida || 'Pzas'
      });
      // Cargamos los embalajes actuales del insumo
      setEmbalajes(insumo.embalajes || []);
    }
  }, [isOpen, insumo]);

  if (!isOpen || !insumo) return null;

  // --------------------------------------------------------
  // HANDLERS DEL PRODUCTO PRINCIPAL
  // --------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/productos/${insumo.id}`, formData);
      toastService.success('Información del insumo actualizada correctamente.');
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

  // --------------------------------------------------------
  // HANDLERS DE EMBALAJES (AGREGAR / ELIMINAR)
  // --------------------------------------------------------
  const handleAddEmbalaje = async () => {
    if (!nuevoEmbalaje.nombre_embalaje || !nuevoEmbalaje.factor_conversion) {
      return toastService.error('Debes completar el nombre y el factor de conversión.');
    }

    setIsAddingEmbalaje(true);
    try {
      const payload = {
        nombre_embalaje: nuevoEmbalaje.nombre_embalaje,
        factor_conversion: parseFloat(nuevoEmbalaje.factor_conversion)
      };

      const response = await api.post(`/productos/${insumo.id}/embalajes`, payload);
      
      // Actualizamos la lista local y limpiamos el formulario
      setEmbalajes([...embalajes, response.data]);
      setNuevoEmbalaje({ nombre_embalaje: '', factor_conversion: '' });
      toastService.success('Embalaje agregado correctamente.');
      onSuccess(); // Para que el catálogo de fondo también se actualice
    } catch (error) {
      console.error('Error al agregar embalaje:', error);
      toastService.error('Error al registrar la nueva presentación.');
    } finally {
      setIsAddingEmbalaje(false);
    }
  };

  const handleDeleteEmbalaje = async (idEmbalaje) => {
    try {
      await api.delete(`/embalajes/${idEmbalaje}`);
      setEmbalajes(embalajes.filter(e => e.id !== idEmbalaje));
      toastService.success('Embalaje eliminado.');
      onSuccess();
    } catch (error) {
      console.error('Error al eliminar embalaje:', error);
      toastService.error('No se pudo eliminar esta presentación.');
    }
  };

  // --------------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-border bg-inputBg shrink-0">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-text-primary">Editar Insumo</h3>
            <p className="text-xs text-text-muted mt-0.5">#{insumo.id} - Gestión de datos y presentaciones</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          
          {/* SECCIÓN 1: DATOS PRINCIPALES */}
          <form id="edit-insumo-form" onSubmit={handleUpdate} className="flex flex-col gap-4">
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
          </form>

          <hr className="border-border" />

          {/* SECCIÓN 2: GESTIÓN DE EMBALAJES */}
          <div>
            <h4 className="text-[0.75rem] font-heading font-bold uppercase tracking-wider text-accent mb-3">
              Presentaciones / Embalajes (Opcional)
            </h4>
            
            {/* Lista de Embalajes Existentes */}
            <div className="space-y-2 mb-4">
              {embalajes.length === 0 ? (
                <p className="text-xs text-text-muted italic bg-inputBg p-3 rounded-lg text-center border border-dashed border-border">
                  Este producto solo se distribuye por unidad base ({formData.unidad_medida}).
                </p>
              ) : (
                embalajes.map(emb => (
                  <div key={emb.id} className="flex items-center justify-between bg-inputBg border border-border p-2.5 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{emb.nombre_embalaje}</p>
                      <p className="text-xs text-text-secondary font-mono mt-0.5">Equivale a: <span className="font-bold text-accent">{emb.factor_conversion}</span> {formData.unidad_medida}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteEmbalaje(emb.id)}
                      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Eliminar embalaje"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para Agregar Nuevo Embalaje */}
            <div className="flex gap-2 items-end bg-accent/5 border border-accent/20 p-3 rounded-xl">
              <div className="flex-1">
                <label className="block text-[0.65rem] font-bold uppercase text-text-muted mb-1">Nombre (Ej: Caja chica)</label>
                <input 
                  type="text" 
                  value={nuevoEmbalaje.nombre_embalaje} 
                  onChange={(e) => setNuevoEmbalaje({...nuevoEmbalaje, nombre_embalaje: e.target.value})}
                  className="w-full bg-card border border-border rounded-lg p-2 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div className="w-24">
                <label className="block text-[0.65rem] font-bold uppercase text-text-muted mb-1">Factor (Uds)</label>
                <input 
                  type="number" step="0.01"
                  value={nuevoEmbalaje.factor_conversion} 
                  onChange={(e) => setNuevoEmbalaje({...nuevoEmbalaje, factor_conversion: e.target.value})}
                  className="w-full bg-card border border-border rounded-lg p-2 text-xs text-text-primary outline-none focus:border-accent font-mono"
                />
              </div>
              <button 
                type="button"
                onClick={handleAddEmbalaje}
                disabled={isAddingEmbalaje || !nuevoEmbalaje.nombre_embalaje || !nuevoEmbalaje.factor_conversion}
                className="h-[34px] px-3 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isAddingEmbalaje ? '...' : 'Añadir'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border bg-inputBg shrink-0 flex justify-between items-center">
          <button 
            type="button" onClick={handleDelete} disabled={isDeleting || isSubmitting}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-heading font-bold text-sm hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Insumo'}
          </button>
          
          <div className="flex gap-2">
            <button 
              type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-text-secondary font-heading font-bold text-sm hover:bg-card transition-colors"
            >
              Cerrar
            </button>
            <button 
              type="submit" form="edit-insumo-form" disabled={isSubmitting || isDeleting}
              className="px-5 py-2 rounded-lg bg-text-primary text-app font-heading font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 dark:bg-accent dark:text-[#002D4C]"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}