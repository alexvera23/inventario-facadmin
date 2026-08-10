import React from 'react';

export default function TransaccionDrawer({ isOpen, onClose, transaccion, onOpenEdit }) {
  if (!isOpen || !transaccion) return null;

  const esEntrada = transaccion.tipo === 'ENTRADA';
  const fechaFormateada = new Date(transaccion.fecha).toLocaleString('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop oscuro */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col justify-between">
          
          {/* Header del Drawer */}
          <div className="p-6 border-b border-border bg-inputBg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-accent text-sm">#{transaccion.id}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold font-heading uppercase ${esEntrada ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                  {transaccion.tipo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-bold text-text-primary mt-1">Detalle de Transacción</h3>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 text-text-muted hover:text-text-primary hover:bg-card rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cuerpo del Drawer con Detalles */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            
            {/* KPI Principal: Cantidad Involucrada */}
            <div className="p-4 rounded-xl border border-border bg-app flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted font-heading uppercase font-bold tracking-wider">Monto Registrado</p>
                <p className={`text-2xl font-mono font-bold mt-0.5 ${esEntrada ? 'text-green-500' : 'text-red-500'}`}>
                  {esEntrada ? '+' : '-'}{parseFloat(transaccion.cantidad).toFixed(2)}
                  <span className="text-xs text-text-muted ml-1.5 font-normal">{transaccion.producto?.unidad_medida || 'Pzas'}</span>
                </p>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
              </div>
            </div>

            {/* Insumo Afectado */}
            <div className="space-y-1">
              <label className="text-[0.7rem] font-heading font-bold uppercase text-text-muted tracking-wider">Insumo / Producto</label>
              <div className="p-3 bg-inputBg border border-border rounded-xl">
                <p className="font-semibold text-text-primary">{transaccion.producto?.nombre || 'Insumo no especificado'}</p>
                <p className="text-xs text-text-muted mt-0.5">Categoría: {transaccion.producto?.categoria || 'General'}</p>
              </div>
            </div>

            {/* Sede y Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[0.7rem] font-heading font-bold uppercase text-text-muted tracking-wider">Sede Operativa</label>
                <div className="p-3 bg-inputBg border border-border rounded-xl font-mono font-bold text-xs text-text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                    </svg>
                    {transaccion.edificio}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[0.7rem] font-heading font-bold uppercase text-text-muted tracking-wider">ID Transacción</label>
                <div className="p-3 bg-inputBg border border-border rounded-xl font-mono font-bold text-xs text-text-secondary">
                  TRX-{transaccion.id}
                </div>
              </div>
            </div>

            {/* Personal Involucrado */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <label className="text-[0.7rem] font-heading font-bold uppercase text-text-muted tracking-wider">Personal Responsable</label>
              
              {/* Encargado */}
              <div className="flex items-center gap-3 p-3 bg-inputBg border border-border rounded-xl">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-heading font-bold text-xs flex-shrink-0">
                  {transaccion.encargado?.nombre?.substring(0, 2).toUpperCase() || 'EN'}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-xs">{transaccion.encargado?.nombre || 'Desconocido'}</p>
                  <p className="text-[0.65rem] text-text-muted">Encargado de Almacén</p>
                </div>
              </div>

              {/* Solicitante (si aplica) */}
              {transaccion.solicitante && (
                <div className="flex items-center gap-3 p-3 bg-inputBg border border-border rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-heading font-bold text-xs flex-shrink-0">
                    {transaccion.solicitante.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-xs">{transaccion.solicitante.nombre}</p>
                    <p className="text-[0.65rem] text-text-muted">Solicitante ({transaccion.solicitante.departamento || 'General'})</p>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones o Notas */}
            <div className="space-y-1 pt-2 border-t border-border/40">
              <label className="text-[0.7rem] font-heading font-bold uppercase text-text-muted tracking-wider">Observaciones Registradas</label>
              <p className="p-3 bg-inputBg border border-border rounded-xl font-mono text-xs text-text-secondary leading-relaxed italic">
                {transaccion.observaciones || 'Sin observaciones adicionales para este movimiento.'}
              </p>
            </div>

            {/* Marca de tiempo */}
            <div className="text-right text-[0.7rem] text-text-muted font-mono">
              Registrado el: {fechaFormateada}
            </div>

          </div>

          {/* Footer con Acción Principal */}
          <div className="p-4 border-t border-border bg-inputBg flex gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenEdit(transaccion);
              }}
              className="w-full py-3 bg-accent hover:opacity-90 text-white font-heading font-bold text-xs rounded-xl transition-all flex justify-center items-center gap-2 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Corregir Transacción
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}