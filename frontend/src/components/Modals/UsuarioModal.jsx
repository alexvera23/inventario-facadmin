import React, { useState } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService';

export default function UsuarioModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    id_interno: '',
    nombre: '',
    correo: '',
    departamento: 'Sistemas',
    rol: 'SOLICITANTE',
    password: '' // 🚀 Inicializamos el campo de contraseña
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 🚀 BLINDAJE: Si el rol es SOLICITANTE, nos aseguramos de no enviar contraseña
      const payload = { ...formData };
      if (payload.rol === 'SOLICITANTE') {
        delete payload.password;
      }

      await api.post('/usuarios', payload);
      toastService.success('Usuario registrado exitosamente.');
      
      // Limpiar formulario completo incluyendo la contraseña
      setFormData({ id_interno: '', nombre: '', correo: '', departamento: 'Sistemas', rol: 'SOLICITANTE', password: '' });
      
      // Avisar a la vista principal para que recargue la tabla y cerrar modal
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      const mensaje = error.response?.data?.message || 'Hubo un error al registrar el usuario.';
      toastService.error(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-inputBg">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-text-primary">Registrar Usuario</h3>
            <p className="text-xs text-text-muted mt-0.5">Alta de personal de la facultad</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Matrícula / ID *</label>
              <input 
                type="text" name="id_interno" required value={formData.id_interno} onChange={handleChange}
                placeholder="Ej. 201834567" 
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Rol del Sistema</label>
              <select 
                name="rol" value={formData.rol} onChange={handleChange}
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              >
                <option value="SOLICITANTE">Solicitante</option>
                <option value="ENCARGADO">Encargado de Almacén</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Nombre Completo *</label>
            <input 
              type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
              placeholder="Nombre del personal o administrativo" 
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Departamento de Adscripción *</label>
            <select 
              name="departamento" required value={formData.departamento} onChange={handleChange}
              className='w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent'
              >
                <option value="Sistemas">Sistemas</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Intendencia">Intendencia y Limpieza</option>
                <option value="Prefectura">Prefectura</option>
                <option value="Otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Correo Electrónico (Opcional)</label>
            <input 
              type="email" name="correo" value={formData.correo} onChange={handleChange}
              placeholder="usuario@alumno.buap.mx" 
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          {/* 🚀 BLINDAJE: Renderizado condicional de la contraseña */}
          {(formData.rol === 'ADMIN' || formData.rol === 'ENCARGADO') && (
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Contraseña de Acceso *</label>
              <input 
                type="password" name="password" required value={formData.password} onChange={handleChange}
                placeholder="••••••••" 
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
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
                'Guardar Usuario'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}