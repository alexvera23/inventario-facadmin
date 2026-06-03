import React from 'react';

export default function DetailDrawer({ isOpen, onClose, producto, onOpenReport }) {
  if (!producto) return null;

  // Calculamos el porcentaje de la barra de progreso (simulado sobre un máximo de 100 para probar)
  const maxCapacidad = 100;
  const porcentajeStock = Math.min((producto.stock / maxCapacidad) * 100, 100);

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-app border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="py-[18px] px-5 border-b border-border bg-app flex items-center justify-between">
          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.08em] text-text-muted font-heading uppercase">
              {producto.categoria}
            </span>
            <h3 className="font-heading font-extrabold text-[1.1rem] mt-0.5 text-text-primary">
              {producto.nombre}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-inputBg text-text-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          
          {/* Tarjeta Stock Principal */}
          <div className="bg-inputBg border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.75rem] text-text-muted font-semibold">Stock Físico Actual</p>
              <span className={`text-[0.65rem] font-heading font-bold px-2 py-0.5 rounded-full ${
                producto.estado === 'ok' ? 'bg-green-500/10 text-green-600' : 
                producto.estado === 'low' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                {producto.estado === 'ok' ? 'NORMAL' : producto.estado === 'low' ? 'CRÍTICO' : 'MODERADO'}
              </span>
            </div>
            <p className="text-accent font-heading font-extrabold text-3xl">
              {producto.stock.toFixed(2)} <span className="text-base text-text-muted">{producto.unidad}</span>
            </p>
            
            {/* Barra de progreso */}
            <div className="mt-3 bg-border rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full bg-accent transition-all duration-700 ease-out" 
                style={{ width: `${porcentajeStock}%` }}
              ></div>
            </div>
            <p className="text-[0.7rem] text-text-muted mt-1.5 text-right font-mono">
              ~{Math.round(porcentajeStock)}% de capacidad
            </p>
          </div>

          {/* Mini Stats (Grid 1x2) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-inputBg border border-border rounded-xl p-3">
              <p className="text-[0.65rem] text-text-muted font-semibold font-heading uppercase tracking-wider">Salidas esta semana</p>
              <p className="text-accent font-heading font-extrabold text-xl mt-1">24.00</p>
            </div>
            <div className="bg-inputBg border border-border rounded-xl p-3">
              <p className="text-[0.65rem] text-text-muted font-semibold font-heading uppercase tracking-wider">Entradas este mes</p>
              <p className="text-[#4ADE80] font-heading font-extrabold text-xl mt-1">480.00</p>
            </div>
          </div>

          {/* Gráfica (Placeholder para Chart.js) */}
          <div>
            <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-2">Comportamiento del Stock (7 días)</p>
            <div className="h-[110px] w-full bg-card border border-border rounded-xl flex items-center justify-center text-xs text-text-muted font-mono border-dashed">
              [Gráfica Chart.js luego irá aqui jiji]
            </div>
          </div>

          {/* Últimos Movimientos */}
          <div>
            <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-2">Últimos Movimientos</p>
            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-center bg-card p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-semibold text-text-primary text-sm">Don Roque <span className="text-[0.65rem] font-normal text-text-muted ml-2">Hoy 09:30</span></p>
                  <p className="text-text-secondary text-xs">Salida a ventanilla</p>
                </div>
                <span className="font-bold font-mono text-red-500 text-sm">- 2.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-app flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <button className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">Ajuste manual</button>
            <button className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">Emergencia</button>
            <button className="bg-accent text-white hover:opacity-90 rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">Abastecer</button>
          </div>
          <button 
            onClick={() => onOpenReport(producto)}
            className="w-full mt-1 bg-card border-2 border-[var(--accent-glow-strong)] text-accent hover:bg-[var(--accent-glow)] rounded-lg font-heading font-semibold text-[0.8rem] py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Generar reporte de este insumo
          </button>
        </div>
      </aside>
    </>
  );
}