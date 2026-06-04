import React from 'react';

// Movimientos simulados para el historial
const HISTORIAL_MOCK = [
  { id: 1, insumo: 'Papel Higiénico Institucional', cantidad: -24, unidad: 'Pzas', tiempo: 'Hace 2 horas', tipo: 'Ventanilla' },
  { id: 2, insumo: 'Cloro Líquido Concentrado', cantidad: -2, unidad: 'L', tiempo: 'Hace 1 día', tipo: 'Ventanilla' },
  { id: 3, insumo: 'Jabón para Manos', cantidad: -5, unidad: 'L', tiempo: 'Hace 3 días', tipo: 'Ventanilla' },
];

export default function UserDrawer({ isOpen, onClose, usuario, onOpenReport }) {
  if (!usuario) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />

      {/* Drawer */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-[380px] bg-app border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="py-[18px] px-5 border-b border-border bg-app flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-[1rem] text-text-primary">
            Detalle de Usuario
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-inputBg text-text-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          
          {/* Perfil Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-[#0078A0] text-white flex items-center justify-center font-heading font-extrabold text-xl flex-shrink-0 shadow-md">
              {usuario.initials}
            </div>
            <div>
              <p className="font-heading font-extrabold text-[1.1rem] text-text-primary">{usuario.nombre}</p>
              <p className="text-[0.8rem] text-text-muted">{usuario.departamento} · {usuario.edificio}</p>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold font-heading uppercase ${usuario.activo ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* KPIs del Usuario */}
          <div className="bg-inputBg border border-border rounded-xl p-4 flex justify-between items-center">
            <div className="text-center">
              <p className="font-heading font-extrabold text-[1.4rem] text-accent leading-none">{usuario.solicitudes}</p>
              <p className="text-[0.65rem] text-text-muted font-bold mt-1.5 uppercase tracking-wider">Total Mes</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-extrabold text-[1.4rem] text-[#4ADE80] leading-none">3</p>
              <p className="text-[0.65rem] text-text-muted font-bold mt-1.5 uppercase tracking-wider">Esta Semana</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-extrabold text-[1.4rem] text-text-secondary leading-none">12</p>
              <p className="text-[0.65rem] text-text-muted font-bold mt-1.5 uppercase tracking-wider">Insumos Dist.</p>
            </div>
          </div>

          {/* Historial Reciente */}
          <div>
            <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-3">Historial reciente</p>
            <div className="flex flex-col gap-0">
              {HISTORIAL_MOCK.map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-[0.8rem] font-semibold text-text-primary">{mov.insumo}</p>
                    <p className="text-[0.7rem] text-text-muted">{mov.tiempo} · {mov.tipo}</p>
                  </div>
                  <span className="text-[0.8rem] font-bold text-red-500 font-mono">
                    {mov.cantidad} {mov.unidad}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-app flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">
              Editar usuario
            </button>
            <button className="bg-text-primary text-app hover:opacity-85 rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-opacity dark:bg-accent dark:text-[#002D4C]">
              Ver historial
            </button>
          </div>
          <button 
            onClick={() => onOpenReport(usuario)}
            className="w-full mt-1 bg-card border-2 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10 rounded-lg font-heading font-semibold text-[0.8rem] py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Generar reporte de este usuario
          </button>
        </div>

      </aside>
    </>
  );
}