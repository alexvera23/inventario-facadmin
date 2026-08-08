import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toastService } from '../../services/toastService';
import { useAuth } from '../../context/AuthContext';

// Lista de edificios disponibles
const EDIFICIOS_DISPONIBLES = ['ADM1', 'ADM2', 'ADM3', 'ADM4', 'LAB_SISTEMAS', 'BODEGA_CENTRAL'];

export default function VentanillaView() {
  // --------------------------------------------------------
  // ESTADOS PRINCIPALES
  // --------------------------------------------------------
  const [tipoMovimiento, setTipoMovimiento] = useState('SALIDA');
  const [edificio, setEdificio] = useState('ADM1');
  const [solicitante, setSolicitante] = useState(null);
  const [bandeja, setBandeja] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const { user } = useAuth();
  
  // --------------------------------------------------------
  // ESTADOS DE DATOS (API) Y BÚSQUEDA
  // --------------------------------------------------------
  const [usuarios, setUsuarios] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Estados para el panel de selección de cantidad/embalaje
  const [activeInsumo, setActiveInsumo] = useState(null);
  const [cantidadInput, setCantidadInput] = useState(1);
  const [embalajeSeleccionado, setEmbalajeSeleccionado] = useState('null');

  // --------------------------------------------------------
  // FETCH DE DATOS INICIALES (Adaptado a Paginación)
  // --------------------------------------------------------
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      // Traemos más registros para tener un catálogo y directorio amplio en ventanilla
      const [resUsuarios, resProductos] = await Promise.all([
        api.get('/usuarios', { params: { limit: 100 } }),
        api.get('/productos', { params: { limit: 100 } })
      ]);

      // 🚀 CORRECCIÓN: Extraemos el arreglo .data del objeto paginado
      setUsuarios(resUsuarios.data?.data || resUsuarios.data || []);
      setInsumos(resProductos.data?.data || resProductos.data || []);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toastService.error('Error al conectar con la base de datos.');
    } finally {
      setLoadingData(false);
    }
  };

  // --------------------------------------------------------
  // LÓGICA DE FILTRADO SEGURO
  // --------------------------------------------------------
  const listaUsuariosSegura = Array.isArray(usuarios) ? usuarios : [];
  const listaInsumosSegura = Array.isArray(insumos) ? insumos : [];

  const filteredUsuarios = listaUsuariosSegura.filter(u => 
    u.nombre?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.id_interno?.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 5);

  const filteredInsumos = listaInsumosSegura.filter(i => 
    i.nombre?.toLowerCase().includes(productSearch.toLowerCase()) ||
    i.categoria?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // --------------------------------------------------------
  // LÓGICA DE LA BANDEJA (CARRITO)
  // --------------------------------------------------------
  const addToBandeja = () => {
    if (!activeInsumo) return;

    let nombreEmbalaje = 'Piezas sueltas (x1)';
    if (embalajeSeleccionado !== 'null') {
      const emp = activeInsumo.embalajes?.find(e => e.id.toString() === embalajeSeleccionado);
      if (emp) nombreEmbalaje = `${emp.nombre_embalaje} (x${emp.factor_conversion})`;
    }

    const bandejaItemId = `${activeInsumo.id}-${embalajeSeleccionado}`;
    const existe = bandeja.find(item => item.bandejaId === bandejaItemId);
    
    if (existe) {
      setBandeja(bandeja.map(item => 
        item.bandejaId === bandejaItemId 
          ? { ...item, cantidadOperacion: item.cantidadOperacion + cantidadInput } 
          : item
      ));
    } else {
      setBandeja([...bandeja, { 
        bandejaId: bandejaItemId,
        productoId: activeInsumo.id,
        nombre: activeInsumo.nombre,
        unidad: activeInsumo.unidad_medida,
        cantidadOperacion: cantidadInput,
        embalajeId: embalajeSeleccionado === 'null' ? null : parseInt(embalajeSeleccionado),
        embalajeNombre: nombreEmbalaje
      }]);
    }

    setActiveInsumo(null);
    setCantidadInput(1);
    setEmbalajeSeleccionado('null');
    setProductSearch('');
  };

  const quitarInsumo = (bandejaId) => {
    setBandeja(bandeja.filter(item => item.bandejaId !== bandejaId));
  };

  const changeQty = (delta) => {
    setCantidadInput(prev => Math.max(1, prev + delta));
  };

  // --------------------------------------------------------
  // PROCESAR TRANSACCIÓN (SUBMIT AL BACKEND)
  // --------------------------------------------------------
  const handleConfirmar = async () => {
    if (bandeja.length === 0) return;
    if (!edificio) return toastService.error('Debe seleccionar el edificio donde se realiza la operación.');
    if (tipoMovimiento === 'SALIDA' && !solicitante) {
      return toastService.error('Debe seleccionar un solicitante para registrar una salida.');
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = bandeja.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidadOperacion,
        embalajeId: item.embalajeId
      }));

      const payload = {
        tipo: tipoMovimiento,
        edificio: edificio, 
        solicitanteId: solicitante ? solicitante.id : null,
        encargadoId: user.id, 
        observaciones: observaciones || null,
        items: itemsPayload
      };

      const response = await api.post('/movimientos', payload);
      
      toastService.success(response.data.message || 'Operación registrada con éxito.');
      setBandeja([]);
      setSolicitante(null);
      setObservaciones('');
      setUserSearch('');
      
      fetchInitialData();

    } catch (error) {
      console.error('Error en la transacción:', error);
      const mensaje = error.response?.data?.message || 'Error interno al procesar la operación.';
      toastService.error(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------------
  return (
    <div className="h-full flex flex-col animate-fade-in pb-2">
      
      {/* Header y Selectores Principales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Ventanilla Express</h2>
          <p className="text-text-muted text-sm mt-0.5">Registro rápido de entradas y salidas</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={edificio}
            onChange={(e) => setEdificio(e.target.value)}
            className="bg-inputBg border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-text-primary outline-none focus:border-accent"
          >
            {EDIFICIOS_DISPONIBLES.map(edif => (
              <option key={edif} value={edif}> Sede: {edif}</option>
            ))}
          </select>

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
      </div>

      {/* Grid Principal sin Scroll Global en el Panel Izquierdo */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* 🚀 PANEL IZQUIERDO: Estructura fija (sin scroll externo) */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0 overflow-hidden">
          
          {/* Paso 1: Solicitante Dinámico (Tamaño Fijo) */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-shrink-0">
            <h3 className="font-heading font-bold text-xs uppercase text-text-muted tracking-wider mb-3">
              1. {tipoMovimiento === 'ENTRADA' ? 'Identificar personal que recibe (Opcional)' : 'Identificar Solicitante'}
            </h3>
            
            {!solicitante ? (
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por matrícula o nombre..." 
                  className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
                />
                
                {userSearch && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {filteredUsuarios.length > 0 ? (
                      filteredUsuarios.map(u => (
                        <button 
                          key={u.id} 
                          onClick={() => { setSolicitante(u); setUserSearch(''); }}
                          className="text-xs font-semibold bg-inputBg border border-border px-3 py-1.5 rounded-lg hover:border-accent hover:text-accent transition-colors flex items-center gap-2"
                        >
                          <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[0.6rem]">
                            {u.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          {u.nombre}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted italic">No se encontraron usuarios.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-inputBg border border-border p-2.5 rounded-lg animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs ${tipoMovimiento === 'ENTRADA' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-accent/20 text-accent'}`}>
                    {solicitante.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-xs">{solicitante.nombre}</p>
                    <p className="text-[0.7rem] text-text-secondary">{solicitante.departamento || 'Sin depto'} | {solicitante.rol || 'Solicitante'}</p>
                  </div>
                </div>
                <button onClick={() => setSolicitante(null)} className="text-xs font-bold text-red-500 hover:text-red-600 px-2">Cambiar</button>
              </div>
            )}
          </div>

          {/* 🚀 Paso 2: Insumos con Scroll EXCLUSIVO en la lista */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
            <h3 className="font-heading font-bold text-xs uppercase text-text-muted tracking-wider mb-3 flex-shrink-0">
              2. Catálogo de Insumos
            </h3>
            
            <input 
              type="text" 
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto por nombre o categoría..." 
              className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-sm text-text-primary outline-none focus:border-accent mb-3 flex-shrink-0"
            />
            
            {/* Panel flotante/fijo de cantidad y embalaje */}
            {activeInsumo && (
              <div className="mb-3 p-3 border border-accent/40 bg-[var(--accent-glow)] rounded-xl animate-fade-in flex-shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[0.6rem] font-heading font-bold uppercase tracking-widest text-accent mb-0.5">Configurar Adición</p>
                    <p className="font-semibold text-xs text-text-primary">{activeInsumo.nombre}</p>
                  </div>
                  <button onClick={() => setActiveInsumo(null)} className="text-text-secondary hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-card border border-border rounded-lg h-8">
                    <button onClick={() => changeQty(-1)} className="px-2.5 text-text-secondary hover:text-accent font-bold h-full">−</button>
                    <input 
                      type="number" 
                      value={cantidadInput} 
                      onChange={(e) => setCantidadInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 text-center bg-transparent border-none outline-none font-mono text-xs font-bold text-text-primary appearance-none h-full"
                    />
                    <button onClick={() => changeQty(1)} className="px-2.5 text-text-secondary hover:text-accent font-bold h-full">+</button>
                  </div>

                  <select 
                    value={embalajeSeleccionado}
                    onChange={(e) => setEmbalajeSeleccionado(e.target.value)}
                    className="flex-1 min-w-[130px] bg-card border border-border rounded-lg h-8 px-2 text-xs text-text-primary outline-none focus:border-accent font-mono"
                  >
                    <option value="null">Unidad base (×1 {activeInsumo.unidad_medida})</option>
                    {activeInsumo.embalajes?.map(emb => (
                      <option key={emb.id} value={emb.id}>
                        {emb.nombre_embalaje} (×{emb.factor_conversion} {activeInsumo.unidad_medida})
                      </option>
                    ))}
                  </select>

                  <button 
                    onClick={addToBandeja}
                    className="h-8 px-3 rounded-lg bg-text-primary hover:opacity-85 text-app font-heading font-bold text-xs transition-opacity shadow-sm whitespace-nowrap dark:bg-accent dark:text-[#002D4C]"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            )}

            {/* 🚀 LISTA DE INSUMOS CON SCROLL ÚNICO */}
            <div className="space-y-2 overflow-y-auto min-h-0 flex-1 pr-1 border-t border-border/40 pt-2">
              {loadingData ? (
                <div className="p-4 text-center text-text-muted text-xs animate-pulse">Cargando catálogo...</div>
              ) : filteredInsumos.length > 0 ? (
                filteredInsumos.map(insumo => {
                  const existenciaEdificio = insumo.existencias?.find(e => e.edificio === edificio);
                  const stockActualNum = existenciaEdificio ? Number(existenciaEdificio.stock_actual) : 0;
                  const stockMinimoNum = existenciaEdificio ? Number(existenciaEdificio.stock_minimo) : 5;
                  const isCritico = stockActualNum <= stockMinimoNum;

                  return (
                    <div 
                      key={insumo.id} 
                      onClick={() => {
                        setActiveInsumo(insumo);
                        setCantidadInput(1);
                        setEmbalajeSeleccionado('null');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all group ${
                        activeInsumo?.id === insumo.id 
                          ? 'border-accent bg-accent/5' 
                          : 'border-border bg-app hover:border-accent/50'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-text-primary text-xs">{insumo.nombre}</p>
                        <p className={`text-[0.7rem] font-mono mt-0.5 ${isCritico && stockActualNum > 0 ? 'text-orange-500 font-bold' : isCritico ? 'text-red-500 font-bold' : 'text-text-muted'}`}>
                          Stock en {edificio}: {stockActualNum.toFixed(2)} {insumo.unidad_medida}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${activeInsumo?.id === insumo.id ? 'border-accent bg-accent text-white' : 'border-border text-transparent group-hover:border-accent/50'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-text-muted text-xs">No se encontraron productos.</div>
              )}
            </div>

          </div>
        </div>

        {/* PANEL DERECHO: Resumen de Operación */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative min-h-0">
          
          <div className="p-4 border-b border-border bg-inputBg flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
            <h3 className="font-heading font-bold text-xs uppercase text-text-primary tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Resumen de la Transacción
            </h3>
            <span className="bg-accent/10 text-accent text-[0.7rem] font-bold px-2 py-0.5 rounded-full font-mono">{bandeja.length} items</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto min-h-0 flex flex-col gap-3">
            {bandeja.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-70">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <p className="text-xs font-medium">La bandeja está vacía</p>
              </div>
            ) : (
              bandeja.map(item => (
                <div key={item.bandejaId} className="bg-app border border-border p-2.5 rounded-lg flex items-center justify-between gap-3 animate-fade-in flex-shrink-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate mb-0.5">{item.nombre}</p>
                    <span className="inline-block bg-inputBg border border-border px-1.5 py-0.5 rounded text-[0.65rem] font-mono text-text-secondary">
                      {item.cantidadOperacion}x {item.embalajeNombre}
                    </span>
                  </div>
                  <button onClick={() => quitarInsumo(item.bandejaId)} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ))
            )}

            <div className="mt-auto pt-3 border-t border-border flex-shrink-0">
              <label className="text-[0.65rem] font-heading font-bold uppercase text-text-muted tracking-wider block mb-1">Observaciones</label>
              <textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Motivo, proyecto o detalles extra (Opcional)..."
                className="w-full bg-inputBg border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent resize-none h-16"
              />
            </div>
          </div>

          <div className="p-4 bg-card border-t border-border flex-shrink-0">
            <button 
              onClick={handleConfirmar}
              disabled={bandeja.length === 0 || (!solicitante && tipoMovimiento === 'SALIDA') || isSubmitting}
              className={`w-full py-3 rounded-xl font-heading font-bold text-xs tracking-wide transition-all shadow-md flex justify-center items-center gap-2
                ${bandeja.length === 0 || (!solicitante && tipoMovimiento === 'SALIDA') || isSubmitting
                  ? 'bg-border text-text-muted cursor-not-allowed opacity-50'
                  : tipoMovimiento === 'ENTRADA' 
                    ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20'
                    : 'bg-accent hover:opacity-90 text-white shadow-accent/20'
                }`}
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Confirmar {tipoMovimiento === 'ENTRADA' ? 'Ingreso al Almacén' : 'Entrega de Insumos'}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}