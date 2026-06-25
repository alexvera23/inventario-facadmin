import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toastService } from '../../services/toastService';

export default function LoginView() {
  const [formData, setFormData] = useState({ id_interno: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Llamamos a la función global del contexto
    const result = await login(formData.id_interno, formData.password);
    
    if (result.success) {
      toastService.success('Bienvenido al sistema FacAdmin');
    } else {
      toastService.error(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h2 className="text-2xl font-heading font-black text-text-primary tracking-tight">FacAdmin BUAP</h2>
          <p className="text-sm text-text-muted mt-2">Control de Inventario y Almacén</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Matrícula / ID</label>
            <input 
              type="text" 
              name="id_interno" 
              required 
              autoComplete="off"
              value={formData.id_interno} 
              onChange={handleChange}
              placeholder="Ej: EMP-2026-0001"
              className="w-full bg-inputBg border border-border rounded-lg p-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5">Contraseña</label>
            <input 
              type="password" 
              name="password" 
              required 
              value={formData.password} 
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-inputBg border border-border rounded-lg p-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-2 bg-accent text-white font-heading font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

      </div>
    </div>
  );
}