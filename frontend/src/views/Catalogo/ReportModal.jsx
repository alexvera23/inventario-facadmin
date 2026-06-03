import React, { useState } from 'react';

export default function ReportModal({ isOpen, onClose, initialScope = 'global', initialSubjectId = null }) {
  const [scope, setScope] = useState(initialScope);
  const [period, setPeriod] = useState('semanal');

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay del Modal */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-opacity"
        onClick={onClose}
      >
        {/* Contenedor del Modal */}
        <div 
          className="bg-app rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()} // Evita que el clic adentro cierre el modal
        >
          {/* Header */}
          <div className="p-5 border-b border-border flex items-start justify-between gap-3 bg-card">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent-glow-strong)]">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h3 className="font-heading font-extrabold text-base text-text-primary">Reporte Personalizado</h3>
              </div>
              <p className="text-[0.78rem] text-text-muted font-sans">Configura el alcance y período del reporte</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-border text-text-secondary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex flex-col gap-6">
            
            {/* Alcance del Reporte */}
            <div>
              <p className="text-xs font-heading font-bold uppercase text-text-muted mb-2 tracking-wide">Alcance del reporte</p>
              <div className="flex gap-2 flex-wrap">
                {['global', 'insumo', 'usuario'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setScope(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.8rem] font-semibold transition-all border ${
                      scope === s ? 'bg-accent/10 border-accent text-accent' : 'bg-inputBg border-border text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    <span className="capitalize">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector Dinámico (Aparece si es insumo o usuario) */}
            {scope !== 'global' && (
              <div className="animate-fade-in">
                <p className="text-xs font-heading font-bold uppercase text-text-muted mb-2 tracking-wide">
                  Seleccionar {scope}
                </p>
                <select className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-[0.85rem] text-text-primary outline-none focus:border-accent">
                  <option>Seleccione una opción...</option>
                  <option value="1">{scope === 'insumo' ? 'Cloro Líquido' : 'Don Roque'}</option>
                  <option value="2">{scope === 'insumo' ? 'Papel Higiénico' : 'Admin Ventanilla'}</option>
                </select>
              </div>
            )}

            {/* Período */}
            <div>
              <p className="text-xs font-heading font-bold uppercase text-text-muted mb-2 tracking-wide">Período</p>
              <div className="flex bg-inputBg p-1 rounded-lg border border-border mb-3">
                {['semanal', 'quincenal', 'mensual'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-1.5 text-[0.8rem] font-semibold rounded-md transition-all ${
                      period === p ? 'bg-card shadow-sm text-text-primary border border-border/50' : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.7rem] text-text-muted font-bold mb-1">Fecha inicio</p>
                  <input type="date" className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-1.5 px-2 text-[0.82rem] text-text-primary outline-none focus:border-accent"/>
                </div>
                <div>
                  <p className="text-[0.7rem] text-text-muted font-bold mb-1">Fecha fin</p>
                  <input type="date" className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-1.5 px-2 text-[0.82rem] text-text-primary outline-none focus:border-accent"/>
                </div>
              </div>
            </div>

            {/* Checkboxes de Contenido */}
            <div>
              <p className="text-xs font-heading font-bold uppercase text-text-muted mb-2 tracking-wide">Incluir en el reporte</p>
              <div className="grid grid-cols-2 gap-3">
                {['Movimientos detallados', 'Gráfica de tendencia', 'KPIs y totales', 'Alertas de stock bajo'].map((item, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer text-[0.8rem] font-semibold text-text-secondary">
                    <input type="checkbox" defaultChecked={i < 3} className="w-4 h-4 accent-accent rounded" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
            <button onClick={onClose} className="px-4 py-2 text-sm font-heading font-semibold text-text-secondary hover:bg-border rounded-lg transition-colors mr-auto">
              Cancelar
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              PDF
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#10B981] text-white hover:bg-[#059669] rounded-lg font-heading font-semibold text-sm transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Excel
            </button>
          </div>

        </div>
      </div>
    </>
  );
}