import React from 'react';

export default function Sidebar({ activeView, setActiveView, isMobileOpen, setMobileOpen }) {
  const navItems = [
    { id: 'catalogo', label: 'Catálogo', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7' },
    { id: 'ventanilla', label: 'Ventanilla E/S', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'usuarios', label: 'Usuarios', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'reportes', label: 'Reportes', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <>
      {/* Overlay para móviles */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-[240px] bg-sidebar flex-shrink-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
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
          
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false); // Cierra el menú en móviles al hacer clic
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

        {/* Footer del usuario (Opcional) */}
        <div className="p-4 border-t border-border/10 flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full bg-accent flex items-center justify-center font-heading font-extrabold text-[#002D4C] text-[0.8rem]">
            AV
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-sidebar-text truncate">Admin Ventanilla</p>
            <p className="text-[0.65rem] text-sidebar-text/60 truncate">Facultad de Admin</p>
          </div>
        </div>
      </aside>
    </>
  );
}