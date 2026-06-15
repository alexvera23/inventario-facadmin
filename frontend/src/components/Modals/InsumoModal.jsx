import React, { useState } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService';

export default function InsumoModal({ isOpen, onClose, onSuccess }) {
  // 1. Estado para los datos básicos del insumo
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad_medida: 'Pzas',
    stock_actual: '',
    stock_minimo: ''
  });

  // 2. Estado para las reglas de embalaje dinámicas
  const [embalajes, setEmbalajes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // --- Manejadores de Estado ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmbalajeChange = (index, field, value) => {
    const nuevosEmbalajes = [...embalajes];
    nuevosEmbalajes[index][field] = value;
    setEmbalajes(nuevosEmbalajes);
  };

  const addEmbalaje = () => {
    setEmbalajes([...embalajes, { nombre_embalaje: '', factor_conversion: '' }]);
  };

  const removeEmbalaje = (index) => {
    setEmbalajes(embalajes.filter((_, i) => i !== index));
  };

  // --- Envío del Formulario (Transacción Frontend) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Preparar payload del insumo principal
      const payloadInsumo = {
        ...formData,
        stock_actual: parseFloat(formData.stock_actual) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 0
      };

      // 2. Crear el insumo en el backend
      const resProducto = await api.post('/productos', payloadInsumo);
      
      // Extraemos el ID generado (Ajusta resProducto.data.id si tu backend lo anida en .data.data)
      const productoId = resProducto.data?.data?.id || resProducto.data?.id;

      // 3. Registrar los embalajes vinculados (Si agregó alguno)
      if (productoId && embalajes.length > 0) {
        // Filtramos por si dejaron alguna fila en blanco a medias
        const embalajesValidos = embalajes.filter(e => e.nombre_embalaje.trim() !== '' && e.factor_conversion > 0);
        
        // Ejecutamos todas las peticiones de embalaje en paralelo
        await Promise.all(
          embalajesValidos.map(emb => 
            api.post(`/productos/${productoId}/embalajes`, {
              nombre_embalaje: emb.nombre_embalaje,
              factor_conversion: parseFloat(emb.factor_conversion)
            })
          )
        );
      }

      toastService.success('Insumo y embalajes registrados correctamente.');
      
      // 4. Limpiar formulario y notificar a la vista padre
      setFormData({ nombre: '', categoria: '', unidad_medida: 'Pzas', stock_actual: '', stock_minimo: '' });
      setEmbalajes([]);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error al crear insumo o embalajes:', error);
      toastService.error(error.response?.data?.message || 'Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Content - Ajustamos el max-height para que haga scroll si agregan muchos embalajes */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-inputBg shrink-0 rounded-t-2xl">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-text-primary">Nuevo Insumo</h3>
            <p className="text-xs text-text-muted mt-0.5">Agregar producto y sus presentaciones</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5 overflow-y-auto">
          
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Nombre del Insumo *</label>
              <input 
                type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                placeholder="Ej. Cloro Líquido Concentrado" 
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Categoría *</label>
                <input 
                  type="text" name="categoria" required value={formData.categoria} onChange={handleChange}
                  placeholder="Ej. Limpieza" 
                  className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Unidad Base *</label>
                <select 
                  name="unidad_medida" value={formData.unidad_medida} onChange={handleChange}
                  className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="Pzas">Piezas (Pzas)</option>
                  <option value="L">Litros (L)</option>
                  <option value="Kg">Kilogramos (Kg)</option>
                  <option value="Mts">Metros (Mts)</option>
                  <option value="Cajas">Cajas</option>
                  <option value="Paquetes">Paquetes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Stock Físico Inicial</label>
                <input 
                  type="number" step="0.01" name="stock_actual" value={formData.stock_actual} onChange={handleChange}
                  placeholder="0.00" 
                  className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm font-mono text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Stock Mínimo Alerta *</label>
                <input 
                  type="number" step="0.01" name="stock_minimo" required value={formData.stock_minimo} onChange={handleChange}
                  placeholder="Ej. 5" 
                  className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm font-mono text-text-primary outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <hr className="border-border border-dashed" />

          {/* SECCIÓN 2: EMBALAJES DINÁMICOS */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="block text-[0.75rem] font-heading font-bold uppercase text-text-primary">Presentaciones de Empaque</label>
                <p className="text-[0.65rem] text-text-muted">Agrega cajas, botes o paquetes que multipliquen la unidad base.</p>
              </div>
              <button 
                type="button" onClick={addEmbalaje}
                className="text-[0.7rem] font-heading font-bold text-accent hover:text-white bg-accent/10 hover:bg-accent px-2 py-1 rounded transition-colors"
              >
                + Agregar Regla
              </button>
            </div>

            {embalajes.length === 0 ? (
              <div className="text-center p-4 border border-border border-dashed rounded-lg bg-inputBg/50 text-text-muted text-xs">
                Este insumo solo se despachará por unidad base ({formData.unidad_medida}).
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {embalajes.map((emb, index) => (
                  <div key={index} className="flex gap-2 items-start animate-fade-in">
                    <div className="flex-1">
                      <input 
                        type="text" required placeholder="Ej. Caja Grande" 
                        value={emb.nombre_embalaje} 
                        onChange={(e) => handleEmbalajeChange(index, 'nombre_embalaje', e.target.value)}
                        className="w-full bg-inputBg border border-border rounded-lg p-2 text-sm text-text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <div className="w-24 relative">
                      <input 
                        type="number" step="0.01" required placeholder="Factor" 
                        value={emb.factor_conversion} 
                        onChange={(e) => handleEmbalajeChange(index, 'factor_conversion', e.target.value)}
                        className="w-full bg-inputBg border border-border rounded-lg p-2 text-sm font-mono text-text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <button 
                      type="button" onClick={() => removeEmbalaje(index)}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-2 shrink-0 pt-4 border-t border-border">
            <button 
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary font-heading font-bold text-sm hover:bg-inputBg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Guardar Insumo'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}