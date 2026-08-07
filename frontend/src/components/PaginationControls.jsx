import React from 'react';

export default function PaginationControls({ pagination, onPageChange, onLimitChange }) {
  if (!pagination || pagination.totalItems === 0) return null;

  const { currentPage, totalPages, totalItems, limit } = pagination;

  // Cálculo de rango visible (ej. 1 - 10)
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-border bg-card rounded-b-xl text-xs text-text-secondary">
      
      {/* Selector de Filas por Página e Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Mostrar</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-inputBg border border-border text-text-primary rounded-lg px-2 py-1 outline-none focus:border-accent font-semibold cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-text-muted">por página</span>
        </div>

        <span className="hidden sm:inline-block text-border">|</span>

        <p className="font-mono">
          Mostrando <span className="font-bold text-text-primary">{startItem}</span> a{' '}
          <span className="font-bold text-text-primary">{endItem}</span> de{' '}
          <span className="font-bold text-accent">{totalItems}</span> registros
        </p>
      </div>

      {/* Controles de Navegación de Páginas */}
      <div className="flex items-center gap-1">
        {/* Ir a la primera página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-border hover:bg-inputBg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Primera página"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Página Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-border font-semibold hover:bg-inputBg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          Anterior
        </button>

        {/* Indicador de Página Actual */}
        <span className="px-3 py-1 font-mono font-bold text-text-primary bg-inputBg border border-border rounded-lg">
          {currentPage} / {totalPages}
        </span>

        {/* Página Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-border font-semibold hover:bg-inputBg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          Siguiente
        </button>

        {/* Ir a la última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-border hover:bg-inputBg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

    </div>
  );
}