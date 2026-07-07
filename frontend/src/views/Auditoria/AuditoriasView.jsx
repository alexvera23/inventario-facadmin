import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AuditoriasView() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('TODOS'); // TODOS, CREAR, ACTUALIZAR, ELIMINAR

  useEffect(() => {
    fetchAuditorias();
  }, []);

  const fetchAuditorias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auditorias');
      setAuditorias(response.data);
    } catch (error) {
      console.error('Error al obtener la bitácora:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para dar color a la etiqueta según la acción
  const getBadgeStyle = (accion) => {
    switch (accion) {
      case 'CREAR': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ACTUALIZAR': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ELIMINAR': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Filtrado en el cliente para búsqueda rápida
  const auditoriasFiltradas = auditorias.filter(a => filtro === 'TODOS' || a.accion === filtro);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-heading font-black text-text-primary tracking-tight">Bitácora de Seguridad</h2>
          <p className="text-sm text-text-muted mt-1">Registro inmutable de actividades administrativas del sistema</p>
        </div>
        
        {/* Filtros */}
        <div className="flex bg-inputBg p-1 border border-border rounded-lg">
          {['TODOS', 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'EDITAR'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltro(tipo)}
              className={`px-3 py-1.5 text-[0.7rem] font-heading font-bold rounded-md transition-colors ${
                filtro === tipo 
                  ? 'bg-card shadow-sm text-text-primary' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Contenedor de la Bitácora */}
      <div className="flex-1 overflow-hidden bg-card border border-border rounded-2xl shadow-sm flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
             <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : auditoriasFiltradas.length === 0 ? (
          <div className="flex-1 flex justify-center items-center text-text-muted font-semibold">
            No hay registros en la bitácora con este filtro.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {auditoriasFiltradas.map((log) => (
              <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-inputBg/50 hover:bg-inputBg transition-colors">
                
                {/* Icono / Inicial del Administrador */}
                <div className="w-10 h-10 rounded-full bg-accent text-white flex-shrink-0 flex items-center justify-center font-heading font-bold text-sm shadow-sm">
                  {log.usuario.nombre.substring(0, 2).toUpperCase()}
                </div>

                {/* Detalles de la acción */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                    <p className="font-bold text-[0.85rem] text-text-primary truncate">
                      {log.usuario.nombre} <span className="text-text-muted font-normal">({log.usuario.id_interno})</span>
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
                  
                  {/* El texto descriptivo libre */}
                  <p className="text-[0.8rem] text-text-secondary mt-2 p-3 bg-card border border-border rounded-lg leading-relaxed font-mono">
                    {log.detalles}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}