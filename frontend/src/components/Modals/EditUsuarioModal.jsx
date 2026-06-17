import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService';

export default function EditUsuarioModal({ isOpen, onClose, usuario, onSuccess }) {
  const [formData, setFormData] = useState({
    id_interno: '',
    nombre: '',
    correo: '',
    departamento: '',
    rol: 'SOLICITANTE',
    activo: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rellenar los datos cuando el modal se abre con un usuario seleccionado
  useEffect(() => {
    if (isOpen && usuario) {
      setFormData({
        id_interno: usuario.id_interno || '',
        nombre: usuario.nombre || '',
        correo: usuario.correo || '',
        departamento: usuario.departamento || '',
        rol: usuario.rol || 'SOLICITANTE',
        activo: usuario.activo ?? true
      });
    }
  }, [isOpen, usuario]);

  if (!isOpen || !usuario) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/usuarios/${usuario.id}`, formData);
      toastService.success('Usuario actualizado correctamente.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toastService.error(error.response?.data?.message || 'Error al actualizar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    setIsDeleting(true);
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      toastService.success('Usuario eliminado del sistema.');
      onSuccess(); // Deberá cerrar el Drawer padre y refrescar la tabla
      onClose();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      // Muestra el error 409 si el usuario no puede ser borrado por integridad referencial
      toastService.error(error.response?.data?.message || 'No se pudo eliminar al usuario.');
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
            <h3 className="font-heading font-extrabold text-lg text-text-primary">Editar Usuario</h3>
            <p className="text-xs text-text-muted mt-0.5">Modificar datos o dar de baja</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-5 flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Matrícula / ID</label>
              <input 
                type="text" name="id_interno" required value={formData.id_interno} onChange={handleChange}
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Rol</label>
              <select 
                name="rol" value={formData.rol} onChange={handleChange}
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
              >
                <option value="SOLICITANTE">Solicitante</option>
                <option value="ENCARGADO">Encargado de Almacén</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Nombre Completo</label>
            <input 
              type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Departamento</label>
            <input 
              type="text" name="departamento" required value={formData.departamento} onChange={handleChange}
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Correo Electrónico</label>
            <input 
              type="email" name="correo" value={formData.correo} onChange={handleChange}
              className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          {/* Toggle de Estado */}
          <div className="flex items-center gap-3 p-3 bg-inputBg border border-border rounded-lg mt-2">
            <input 
              type="checkbox" id="activo" name="activo" 
              checked={formData.activo} onChange={handleChange}
              className="w-4 h-4 text-accent bg-card border-border rounded focus:ring-accent focus:ring-2"
            />
            <label htmlFor="activo" className="text-sm font-semibold text-text-primary cursor-pointer">
              Usuario Activo en el sistema
            </label>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
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
                {isSubmitting ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}