import React, { useState } from 'react';

// Datos Mock para probar la interfaz
const USUARIOS_MOCK = [
  { id: 1, nombre: 'Don Roque', departamento: 'Intendencia', rol: 'Solicitante' },
  { id: 2, nombre: 'Dra. María Sánchez', departamento: 'Dirección', rol: 'Administrativo' }
];

const INSUMOS_MOCK = [
  { id: 1, nombre: 'Cloro Líquido Concentrado', stock: 12.00, unidad: 'L' },
  { id: 2, nombre: 'Papel Higiénico Institucional', stock: 480.00, unidad: 'Pzas' },
  { id: 3, nombre: 'Jabón para Manos', stock: 2.50, unidad: 'L' }
];

export default function VentanillaView() {
  const [tipoMovimiento, setTipoMovimiento] = useState('SALIDA');
  const [solicitante, setSolicitante] = useState(null);
  const [bandeja, setBandeja] = useState([]);
  const [observaciones, setObservaciones] = useState('');

  // Funciones para manejar la bandeja
  const agregarInsumo = (insumo) => {
    if (!bandeja.find(item => item.id === insumo.id)) {
      setBandeja([...bandeja, { ...insumo, cantidadOperacion: 1 }]);
    }
  };

  const actualizarCantidad = (id, delta) => {
    setBandeja(bandeja.map(item => {
      if (item.id === id) {
        const nuevaCantidad = Math.max(0.1, item.cantidadOperacion + delta);
        return { ...item, cantidadOperacion: nuevaCantidad };
      }
      return item;
    }));
  };

  const quitarInsumo = (id) => {
    setBandeja(bandeja.filter(item => item.id !== id));
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      
      {/* Header y Selector de Tipo de Movimiento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Ventanilla Express</h2>
          <p className="text-text-muted text-sm mt-1">Registro rápido de entradas y salidas</p>
        </div>
        
        <div className="flex bg-inputBg p-1 rounded-lg border border-border">
          <button 
            onClick={() => setTipoMovimiento('ENTRADA')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tipoMovimiento === 'ENTRADA' ? 'bg-[#10B981] text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
          >
            Entrada (Surtir)
          </button>
          <button 
            onClick={() => setTipoMovimiento('SALIDA')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tipoMovimiento === 'SALIDA' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
          >
            Salida (Despachar)
          </button>
        </div>
      </div>

      {/* Diseño Split-Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* PANEL IZQUIERDO: Búsqueda y Selección (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* Paso 1: Solicitante */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">1. Identificar Solicitante</h3>
            
            {!solicitante ? (
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Buscar por ID, matrícula o nombre..." 
                  className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2.5 px-4 text-sm text-text-primary outline-none focus:border-accent"
                />
                {/* Resultados rápidos de prueba */}
                <div className="flex gap-2">
                  {USUARIOS_MOCK.map(u => (
                    <button 
                      key={u.id} onClick={() => setSolicitante(u)}
                      className="text-xs font-semibold bg-inputBg border border-border px-3 py-1.5 rounded-lg hover:border-accent hover:text-accent transition-colors"
                    >
                      {u.nombre}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-inputBg border border-border p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center font-heading font-bold">
                    {solicitante.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-sm">{solicitante.nombre}</p>
                    <p className="text-xs text-text-secondary">{solicitante.departamento} | {solicitante.rol}</p>
                  </div>
                </div>
                <button onClick={() => setSolicitante(null)} className="text-xs font-bold text-red-500 hover:text-red-600 px-2">Cambiar</button>
              </div>
            )}
          </div>

          {/* Paso 2: Insumos */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex-1 flex flex-col">
            <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">2. Agregar Insumos</h3>
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o ID..." 
              className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2.5 px-4 text-sm text-text-primary outline-none focus:border-accent mb-4"
            />
            
            <div className="space-y-2 overflow-y-auto pr-1">
              {INSUMOS_MOCK.map(insumo => (
                <div key={insumo.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 bg-app transition-colors group">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{insumo.nombre}</p>
                    <p className="text-xs font-mono text-text-muted">Stock actual: {insumo.stock} {insumo.unidad}</p>
                  </div>
                  <button 
                    onClick={() => agregarInsumo(insumo)}
                    className="p-1.5 bg-inputBg border border-border rounded-md text-text-secondary hover:text-accent hover:border-accent transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Bandeja de Salida (5 columnas) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
          
          <div className="p-5 border-b border-border bg-inputBg flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm uppercase text-text-primary tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Resumen de Operación
            </h3>
            <span className="bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full font-mono">{bandeja.length} items</span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {bandeja.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-70">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <p className="text-sm font-medium">La bandeja está vacía</p>
              </div>
            ) : (
              bandeja.map(item => (
                <div key={item.id} className="bg-app border border-border p-3 rounded-lg flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-text-primary leading-tight pr-4">{item.nombre}</p>
                    <button onClick={() => quitarInsumo(item.id)} className="text-text-muted hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-secondary">Unidad base: {item.unidad}</span>
                    
                    {/* Controles de Cantidad */}
                    <div className="flex items-center bg-inputBg border border-border rounded-md">
                      <button onClick={() => actualizarCantidad(item.id, -1)} className="px-2 py-1 text-text-secondary hover:text-accent font-bold">-</button>
                      <input 
                        type="number" 
                        value={item.cantidadOperacion} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setBandeja(bandeja.map(b => b.id === item.id ? { ...b, cantidadOperacion: val } : b));
                        }}
                        className="w-12 text-center bg-transparent border-none outline-none font-mono text-sm font-bold text-text-primary appearance-none"
                      />
                      <button onClick={() => actualizarCantidad(item.id, 1)} className="px-2 py-1 text-text-secondary hover:text-accent font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Observaciones */}
            <div className="mt-auto pt-4 border-t border-border">
              <label className="text-xs font-heading font-bold uppercase text-text-muted tracking-wider block mb-2">Observaciones</label>
              <textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Motivo, proyecto o detalles extra..."
                className="w-full bg-inputBg border border-border rounded-lg p-3 text-sm text-text-primary outline-none focus:border-accent resize-none h-20"
              />
            </div>
          </div>

          {/* Botón de Confirmación Transaccional */}
          <div className="p-5 bg-card border-t border-border">
            <button 
              disabled={bandeja.length === 0 || (!solicitante && tipoMovimiento === 'SALIDA')}
              className={`w-full py-3.5 rounded-xl font-heading font-bold text-sm tracking-wide transition-all shadow-md flex justify-center items-center gap-2
                ${bandeja.length === 0 || (!solicitante && tipoMovimiento === 'SALIDA')
                  ? 'bg-border text-text-muted cursor-not-allowed opacity-50'
                  : tipoMovimiento === 'ENTRADA' 
                    ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20'
                    : 'bg-accent hover:opacity-90 text-white shadow-accent/20'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              Confirmar {tipoMovimiento === 'ENTRADA' ? 'Ingreso al Almacén' : 'Entrega de Insumos'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}