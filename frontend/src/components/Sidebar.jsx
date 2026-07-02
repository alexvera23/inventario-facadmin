import React from 'react';
import { useAuth } from '../context/AuthContext'; //  IMPORTAMOS EL CONTEXTO

export default function Sidebar({ activeView, setActiveView, isMobileOpen, setMobileOpen }) {
  // Extraemos el usuario y la función para desloguear
  const { user, logout } = useAuth(); 

  const navItems = [
    { id: 'catalogo', label: 'Catálogo', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7' },
    { id: 'ventanilla', label: 'Ventanilla E/S', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'usuarios', label: 'Usuarios', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'reportes', label: 'Reportes', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'auditorias', label: 'Auditoría', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'transacciones', label: 'Transacciones', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  ];

  //  FILTRO DE SEGURIDAD: Ocultar pestaña 'usuarios' si no es ADMIN ESTA POR VERSE SI SI SE APLICA, EN CASO DE QUE SI PONER usuarios entre las comillas 
  const visibleNavItems = navItems.filter(item => {
    if (item.id === 'auditorias' && user?.rol !== 'ADMIN') return false;
    return true;
  });

  // Función para obtener iniciales (Ej: Alejandro Cholula -> AC)
  const getInitials = (name) => {
    if (!name) return 'US';
    return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-[240px] bg-sidebar flex-shrink-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="py-[22px] px-5 border-b border-border/10">
          <h1 className="font-heading text-[1.35rem] font-extrabold text-sidebar-text tracking-tight">
            Fac<span className="text-accent">Admin</span>
          </h1>
          <p className="text-[0.7rem] text-sidebar-text/50 mt-1 font-semibold tracking-wider">INVENTARIO BUAP</p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-[0.6rem] font-heading font-bold tracking-widest text-sidebar-text/40 px-2 mb-2">MÓDULOS</p>
          
          {/*  Mapeamos la lista filtrada */}
          {visibleNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3 py-2.5 px-3.5 rounded-lg text-[0.875rem] font-semibold transition-all duration-200 w-full text-left
                  ${isActive 
                    ? 'bg-accent/10 text-accent border border-accent/30' 
                    : 'text-sidebar-text/70 hover:bg-sidebar-text/5 hover:text-sidebar-text'}`}
              >
                <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer del usuario y Logout */}
        <div className="p-4 border-t border-border/10 flex flex-col gap-3">
          
          {/* Info del Usuario */}
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] flex-shrink-0 rounded-full bg-accent flex items-center justify-center font-heading font-extrabold text-[#002D4C] text-[0.8rem]">
              {getInitials(user?.nombre)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-sidebar-text truncate">{user?.nombre || 'Usuario'}</p>
              <p className="text-[0.65rem] text-sidebar-text/60 truncate">{user?.rol === 'ADMIN' ? 'Administrador' : 'Encargado de Almacén'}</p>
            </div>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 mt-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-[0.8rem] font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}