import React, { useState, useEffect, useCallback } from 'react';
import ReportModal from '../Catalogo/ReportModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Skeleton genérico para las tarjetas de KPI ────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-border rounded-full" />
        <div className="w-8 h-8 rounded-full bg-border" />
      </div>
      <div className="h-9 w-20 bg-border rounded-lg mb-2" />
      <div className="h-3 w-32 bg-border rounded-full" />
    </div>
  );
}

// ─── Skeleton para bloques de gráfica ──────────────────────────────────────
function ChartSkeleton({ className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col animate-pulse ${className}`}>
      <div className="h-3 w-40 bg-border rounded-full mb-6" />
      <div className="flex-1 bg-border/40 rounded-lg min-h-[220px]" />
    </div>
  );
}

// ─── Componente de error inline ─────────────────────────────────────────────
function AlertError({ mensaje, onRetry }) {
  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span className="flex-1">{mensaje}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-bold underline hover:no-underline shrink-0">
          Reintentar
        </button>
      )}
    </div>
  );
}

// ─── Meses disponibles ──────────────────────────────────────────────────────
const MESES = [
  { value: '06-2026', label: 'Junio 2026' },
  { value: '05-2026', label: 'Mayo 2026' },
  { value: '04-2026', label: 'Abril 2026' },
  { value: '03-2026', label: 'Marzo 2026' },
];

// ─── Opciones base para Chart.js ────────────────────────────────────────────
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { color: '#94A3B8', font: { family: 'Manrope', size: 11 } } },
    tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1 }
  },
  scales: {
    y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94A3B8', font: { family: 'Manrope' } } },
    x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { family: 'Manrope' } } }
  }
};

// ─── Configuración específica para la gráfica horizontal de Deptos ──────────
const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // Voltea la gráfica
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1 }
  },
  scales: {
    // En modo horizontal, X es la barra de medición (ocupa las líneas de fondo)
    x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94A3B8', font: { family: 'Manrope' } } },
    // Y contiene los nombres de los departamentos (ocupa quitar la rejilla)
    y: { grid: { display: false }, ticks: { color: '#94A3B8', font: { family: 'Manrope', size: 11 } } }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Manrope', size: 11 } } },
    tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1 }
  },
  cutout: '75%'
};

// ─── Paleta consistente con los colores de BUAP / FacAdmin ─────────────────
const PALETTE = {
  cyan:    'rgba(0, 179, 225, 0.85)',
  cyanBg:  'rgba(0, 179, 225, 0.12)',
  emerald: 'rgba(16, 185, 129, 0.85)',
  navy:    '#002D4C',
  amber:   '#F59E0B',
  violet:  '#8B5CF6',
  rose:    '#F43F5E',
};

// ─── Transformar la respuesta del backend a datasets de Chart.js ─────────────
function transformarDatos(data) {
  // Tendencia (líneas)
  const lineChartData = {
    labels: data.tendencia?.labels || [],
    datasets: [
      {
        label: 'Salidas',
        data: data.tendencia?.salidas || [],
        borderColor: PALETTE.cyan,
        backgroundColor: PALETTE.cyanBg,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Entradas',
        data: data.tendencia?.entradas || [],
        borderColor: PALETTE.emerald,
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
        pointRadius: 3,
      }
    ],
  };

  // Donut de categorías
  const catColors = [PALETTE.navy, PALETTE.cyan, PALETTE.emerald, PALETTE.amber, PALETTE.violet, PALETTE.rose];
  const doughnutData = {
    labels: data.categorias?.labels || [],
    datasets: [{
      data: data.categorias?.data || [],
      backgroundColor: catColors.slice(0, (data.categorias?.labels || []).length),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  // Bar: Top insumos
  const topInsumosData = {
    labels: data.topInsumos?.labels || [],
    datasets: [{
      label: 'Volumen de salida',
      data: data.topInsumos?.data || [],
      backgroundColor: PALETTE.cyan,
      borderRadius: 6,
    }]
  };

  // Bar: Departamentos
  const deptosData = {
    labels: data.departamentos?.labels || [],
    datasets: [{
      label: 'Solicitudes',
      data: data.departamentos?.data || [],
      backgroundColor: PALETTE.emerald,
      borderRadius: 6,
    }]
  };

  return { lineChartData, doughnutData, topInsumosData, deptosData };
}

// ════════════════════════════════════════════════════════════════════════════
export default function ReportesView() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [mesSeleccionado, setMesSeleccionado]   = useState('06-2026');

  // Estado del dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [cargando, setCargando]           = useState(true);
  const [error, setError]                 = useState(null);

  // ── Fetch al backend ─────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (mes) => {
    setCargando(true);
    setError(null);

    try {
      const res = await api.get(`/reportes/dashboard?mes=${mes}`);
      
      // Axios ya te devuelve el JSON parseado automáticamente en res.data
      setDashboardData(res.data);
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Extraemos el mensaje de error de Axios de forma segura
      const mensajeBackend = err.response?.data?.message;
      setError(mensajeBackend || err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Re-fetch cada vez que cambia el mes
  useEffect(() => {
    fetchDashboard(mesSeleccionado);
  }, [mesSeleccionado, fetchDashboard]);

  // ── Derivar datasets solo cuando hay datos ────────────────────────────────
  const graficas = dashboardData ? transformarDatos(dashboardData) : null;
  const kpis     = dashboardData?.kpis ?? null;

  // ── Exportación (placeholder — se implementará luego) ─────────────────────
  const handleQuickExport = (formato) => {
    alert(`Exportación en ${formato.toUpperCase()} — próximamente`);
  };

  // ── Label del mes activo ──────────────────────────────────────────────────
  const labelMes = MESES.find(m => m.value === mesSeleccionado)?.label ?? mesSeleccionado;

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full animate-fade-in overflow-y-auto pr-2">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Dashboard Analítico</h2>
          <p className="text-text-muted text-sm mt-1">
            Métricas y tendencias globales · <span className="font-semibold text-text-secondary">{labelMes}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bloque Mes + Exportaciones rápidas */}
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-transparent text-sm font-semibold text-text-primary outline-none border-none cursor-pointer pl-3 pr-2 py-1.5 focus:ring-0 dark:bg-card"
            >
              {MESES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <button
              onClick={() => handleQuickExport('pdf')}
              disabled
              className="p-1.5 rounded-lg text-text-secondary opacity-40 cursor-not-allowed flex items-center justify-center"
              title="Exportar PDF (próximamente)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h4v4H9z" />
              </svg>
            </button>

            <button
              onClick={() => handleQuickExport('excel')}
              disabled
              className="p-1.5 rounded-lg text-text-secondary opacity-40 cursor-not-allowed flex items-center justify-center mr-1"
              title="Exportar Excel (próximamente)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          {/* Botón Reporte Personalizado */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-accent text-accent font-heading font-bold text-sm transition-all hover:bg-[var(--accent-glow)] shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Reporte Personalizado
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER (si falló el fetch) ─────────────────────────────── */}
      {error && !cargando && (
        <div className="mb-6">
          <AlertError
            mensaje={error}
            onRetry={() => fetchDashboard(mesSeleccionado)}
          />
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cargando ? (
          <>
            <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
          </>
        ) : (
          <>
            {/* Total Salidas */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Total Salidas</p>
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-heading font-black text-text-primary">
                {kpis?.salidas?.toLocaleString('es-MX') ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">Unidades consumidas en {labelMes}</p>
            </div>

            {/* Total Entradas */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Total Entradas</p>
                <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-heading font-black text-text-primary">
                {kpis?.entradas?.toLocaleString('es-MX') ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">Unidades abastecidas en {labelMes}</p>
            </div>

            {/* Insumos Críticos */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Insumos Críticos</p>
                <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
              </div>
              <p className={`text-3xl font-heading font-black ${kpis?.criticos > 0 ? 'text-red-500' : 'text-text-primary'}`}>
                {kpis?.criticos ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {kpis?.criticos > 0 ? 'Requieren abastecimiento urgente' : 'Sin stock crítico'}
              </p>
            </div>

            {/* Usuarios Activos */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Usuarios Activos</p>
                <span className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-heading font-black text-text-primary">
                {kpis?.usuariosActivos ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">Solicitantes con actividad en {labelMes}</p>
            </div>
          </>
        )}
      </div>

      {/* ── GRÁFICAS BLOQUE 1: Tendencia + Categorías ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 min-h-[320px]">
        {cargando ? (
          <>
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Líneas: Tendencia */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider">
                  Tendencia de Inventario — {labelMes}
                </h3>
              </div>
              <div className="flex-1 relative w-full h-full min-h-[220px]">
                {graficas?.lineChartData.labels.length > 0 ? (
                  <Line data={graficas.lineChartData} options={commonOptions} />
                ) : (
                  <p className="text-text-muted text-sm italic flex items-center justify-center h-full">No hay movimientos en este periodo</p>
                )}
              </div>
            </div>

            {/* Donut: Categorías */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
              <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">
                Consumo por Categoría
              </h3>
              <div className="flex-1 relative w-full h-full min-h-[220px] flex items-center justify-center">
                {graficas?.doughnutData.labels.length > 0 ? (
                  <Doughnut data={graficas.doughnutData} options={doughnutOptions} />
                ) : (
                  <p className="text-text-muted text-sm italic">Sin consumos este mes</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── GRÁFICAS BLOQUE 2: Top Insumos + Departamentos ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 min-h-[320px]">
        {cargando ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Bar: Top 5 Insumos */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
              <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">
                Top 5 Insumos Más Solicitados
              </h3>
              <div className="flex-1 relative w-full h-full min-h-[220px]">
                {graficas?.topInsumosData.labels.length > 0 ? (
                    <Bar
                      data={graficas.topInsumosData}
                      options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }}
                    />
                  ) : (
                    <p className="text-text-muted text-sm italic flex items-center justify-center h-full">Sin datos de salida</p>
                  )}
              </div>
            </div>

            {/* Bar: Solicitudes por Departamento (horizontal) */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
              <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">
                Solicitudes por Departamento
              </h3>
              <div className="flex-1 relative w-full h-full min-h-[220px]">
                {graficas?.deptosData.labels.length > 0 ? (
                    <Bar
                      data={graficas.deptosData}
                      options={horizontalBarOptions} // Usa las opciones corregidas para eje invertido
                    />
                  ) : (
                    <p className="text-text-muted text-sm italic flex items-center justify-center h-full">Sin solicitudes este mes</p>
                  )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL REPORTE PERSONALIZADO ──────────────────────────────────── */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialScope="global"
      />
    </div>
  );
}