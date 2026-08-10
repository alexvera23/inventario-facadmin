import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PaginationControls from '../../components/PaginationControls';

export default function AuditoriasView() {
  // ─── ESTADOS DE BÚSQUEDA Y FILTROS ───
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('TODAS'); // TODOS, CREAR, ACTUALIZAR, EDITAR, ELIMINAR

  // ─── ESTADOS DE PAGINACIÓN ───
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState(null);

  // ─── ESTADOS DE DATOS Y UI ───
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  DEBOUNCE (Retraso de 500ms para la búsqueda)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1); // Reset a la primera página tras teclear
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  //  FETCH PRINCIPAL CON PAGINACIÓN Y FILTROS
  const fetchAuditorias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/auditorias', {
        params: {
          page,
          limit,
          busqueda: debouncedTerm,
          accion: filtroAccion
        }
      });

      setAuditorias(response.data.data || []);
      setPaginationInfo(response.data.pagination || null);
    } catch (err) {
      console.error('Error al obtener la bitácora:', err);
      setError('No se pudo recuperar la bitácora de seguridad.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedTerm, filtroAccion]);

  useEffect(() => {
    fetchAuditorias();
  }, [fetchAuditorias]);

  // Badge visual por tipo de acción
  const getBadgeStyle = (accion) => {
    switch (accion) {
      case 'CREAR': 
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ACTUALIZAR': 
      case 'EDITAR': 
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ELIMINAR': 
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: 
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-heading font-black text-text-primary tracking-tight">Bitácora de Seguridad</h2>
          <p className="text-sm text-text-muted mt-1">Registro inmutable de actividades administrativas del sistema</p>
        </div>
        
        {/* Controles: Búsqueda y Filtros de Acción */}
        <div className="flex flex-wrap items-center gap-3">
          
          <input 
            type="text" 
            placeholder="Buscar por operador o detalle..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-xs text-text-primary outline-none focus:border-accent min-w-[220px] transition-all"
          />

          {/* <div className="flex bg-inputBg p-1 border border-border rounded-lg">
            {['TODAS', 'CREAR', 'EDITAR', 'ELIMINAR'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => {
                  setFiltroAccion(tipo);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-[0.7rem] font-heading font-bold rounded-md transition-colors ${
                  filtroAccion === tipo 
                    ? 'bg-card shadow-sm text-text-primary' 
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div> */}
          {/* FIltro por accion */}
          <select
            value={filtroAccion}
            onChange={(e)=>{
              setFiltroAccion(e.target.value);
              setPage(1);
            }}  
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-sm font-semibold text-text-primary outline-none focus:border-accent"
          >
            <option value="TODAS">Todos los tipos</option>
            <option value="CREAR">Crear</option>
            <option value="ACTUALIZAR">Actualizar</option>
            <option value="EDITAR">Editar</option>
            <option value="ELIMINAR">Eliminar</option>
          </select>

         

          <button 
            onClick={fetchAuditorias}
            disabled={loading}
            className="p-2.5 bg-card border border-border rounded-lg text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            title="Sincronizar auditoría"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenedor Principal de la Bitácora */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl mb-3">⚠️</span>
          <p className="text-red-500 font-bold mb-2">{error}</p>
          <button onClick={fetchAuditorias} className="px-4 py-2 mt-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col justify-between">
          
          {/* Lista scrolleable de Logs */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] z-10 flex justify-center items-center">
                 <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {auditorias.length === 0 && !loading ? (
              <div className="h-full flex justify-center items-center text-text-muted font-semibold italic text-sm">
                No hay registros en la bitácora que coincidan con la búsqueda.
              </div>
            ) : (
              auditorias.map((log) => {
                const nombreOperador = log.usuario?.nombre || 'Usuario Desconocido';
                const idInterno = log.usuario?.id_interno || 'S/N';
                const iniciales = nombreOperador.substring(0, 2).toUpperCase();

                return (
                  <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-inputBg/50 hover:bg-inputBg transition-colors">
                    
                    {/* Inicial del Administrador */}
                    <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex-shrink-0 flex items-center justify-center font-heading font-bold text-xs shadow-sm">
                      {iniciales}
                    </div>

                    {/* Detalles de la acción */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                        <p className="font-bold text-[0.85rem] text-text-primary truncate">
                          {nombreOperador} <span className="text-text-muted font-normal font-mono">({idInterno})</span>
                        </p>
                        <div className="flex items-center gap-2 text-[0.7rem]">
                          <span className={`px-2 py-0.5 rounded border font-bold ${getBadgeStyle(log.accion)}`}>
                            {log.accion} {log.entidad}
                          </span>
                          <span className="text-text-muted">
                            • {new Date(log.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Texto libre de auditoría */}
                      <p className="text-[0.8rem] text-text-secondary mt-2 p-3 bg-card border border-border rounded-lg leading-relaxed font-mono">
                        {log.detalles}
                      </p>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/*  COMPONENTE DE PAGINACIÓN */}
          <PaginationControls 
            pagination={paginationInfo}
            onPageChange={(nuevaPag) => setPage(nuevaPag)}
            onLimitChange={handleLimitChange}
          />

        </div>
      )}
    </div>
  );
}