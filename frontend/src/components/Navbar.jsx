import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const EDIFICIOS_DISPONIBLES = ['ADM1', 'ADM2', 'ADM3', 'ADM4', 'LAB_SISTEMAS', 'BODEGA_CENTRAL'];

export default function Navbar({ setMobileOpen, sedeActual, setSedeActual }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  // Estado para el menú desplegable del perfil
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Helper para iniciales
  const getInitials = (name) => {
    if (!name) return 'US';
    return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[60px] bg-header border-b border-border flex items-center justify-between px-4 sm:px-6 transition-colors duration-300 relative z-30">
      
      {/* SECCIÓN IZQUIERDA: Hamburguesa + Selector de Sede + Status */}
      <div className="flex items-center gap-3">
        {/* Botón de Hamburguesa para móviles */}
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:bg-inputBg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/*  NUEVO: Selector Rápido de Sede Operativa (Si se pasa por props o context) */}
        {setSedeActual && (
          <div className="hidden sm:flex items-center gap-2 bg-inputBg border border-border rounded-lg px-2.5 py-1">
            <span className="text-xs font-heading font-bold text-text-muted">Sede:</span>
            <select
              value={sedeActual || 'ADM1'}
              onChange={(e) => setSedeActual(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary outline-none cursor-pointer"
            >
              {EDIFICIOS_DISPONIBLES.map(edif => (
                <option key={edif} value={edif} className="bg-card text-text-primary">{edif}</option>
              ))}
            </select>
          </div>
        )}

        {/*  NUEVO: Indicador de Conexión en Tiempo Real */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[0.65rem] font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Theme Toggle + Profile Dropdown */}
      <div className="flex items-center gap-3">
        
        {/* Switch de Tema */}
        <button 
          onClick={toggleTheme}
          className="w-[34px] h-[34px] flex flex-shrink-0 items-center justify-center rounded-lg bg-inputBg border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
          title={`Cambiar a modo ${theme === 'light' ? 'Oscuro' : 'Claro'}`}
        >
          {theme === 'light' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>

        {/* Divisor Visual */}
        <div className="w-px h-5 bg-border mx-0.5"></div>

        {/*  CONTENEDOR DEL PERFIL Y DROPDOWN */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 cursor-pointer group p-1 rounded-lg hover:bg-inputBg transition-colors"
          >
            <div className="hidden sm:block text-right">
              <p className="text-[0.78rem] font-bold text-text-primary leading-tight truncate max-w-[140px] group-hover:text-accent transition-colors">
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-[0.6rem] text-text-muted font-bold uppercase tracking-wider truncate max-w-[140px]">
                {user?.rol || 'Solicitante'}
              </p>
            </div>

            {/* Avatar interactivo */}
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-heading font-bold text-[0.7rem] flex-shrink-0 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
              {getInitials(user?.nombre)}
            </div>
          </div>

          {/*  MODAL / DROPDOWN DETALLADO DEL USUARIO */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-fade-in z-50 text-xs">
              
              {/* Header de la tarjeta */}
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center font-heading font-bold text-sm flex-shrink-0 shadow-md">
                  {getInitials(user?.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-primary text-sm truncate">{user?.nombre}</p>
                  <p className="text-[0.65rem] text-text-muted font-mono font-bold uppercase">{user?.id_interno || 'S/N'}</p>
                </div>
              </div>

              {/* Ficha de Detalles de la Cuenta */}
              <div className="py-3 space-y-2 font-mono text-[0.72rem]">
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-text-muted">Correo:</span>
                  <span className="font-semibold text-text-primary truncate max-w-[160px]">{user?.correo || 'No especificado'}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-text-muted">Departamento:</span>
                  <span className="font-semibold text-text-primary truncate max-w-[150px]">{user?.departamento || 'Por Asignar'}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-text-muted">Rol en Sistema:</span>
                  <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-bold uppercase text-[0.65rem]">
                    {user?.rol || 'SOLICITANTE'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span className="text-text-muted">Estado:</span>
                  <span className="text-green-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Activo
                  </span>
                </div>
              </div>

              {/* Botón para Cerrar Sesión */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-heading font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}