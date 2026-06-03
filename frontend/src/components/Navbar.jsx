import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ setMobileOpen }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-[60px] bg-header border-b border-border flex items-center justify-between px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Botón de Hamburguesa para móviles */}
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:bg-inputBg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Buscador Rápido (Oculto en pantallas muy pequeñas) */}
        <div className="hidden md:block relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Buscar insumo o usuario..." 
            className="bg-inputBg border-2 border-border rounded-lg py-1.5 pl-9 pr-4 text-[0.8rem] text-text-primary outline-none w-[240px] focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all"
          />
        </div>

        {/* Switch de Tema Claro/Oscuro */}
        <button 
          onClick={toggleTheme}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-inputBg border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
          title={`Cambiar a modo ${theme === 'light' ? 'Oscuro' : 'Claro'}`}
        >
          {theme === 'light' ? (
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>
      </div>
    </header>
  );
}