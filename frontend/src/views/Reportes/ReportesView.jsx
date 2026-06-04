import React, { useState } from 'react';
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

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function ReportesView() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState('06-2026'); // Por defecto Junio 2026

  // Función simulada para los botones de exportación rápida
  const handleQuickExport = (formato) => {
    alert(`Generando reporte rápido en ${formato.toUpperCase()} para el período: ${mesSeleccionado}`);
    // Aquí luego conectaremos con la API real y la librería de PDF/Excel
  };

  // --------------------------------------------------------
  // DATOS SIMULADOS PARA LAS GRÁFICAS
  // --------------------------------------------------------
  const lineChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Salidas (Consumo)',
        data: [12, 19, 15, 25, 22, 5, 2],
        borderColor: '#00B3E1', // accent cyan
        backgroundColor: 'rgba(0, 179, 225, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Entradas (Abastecimiento)',
        data: [0, 0, 50, 0, 120, 0, 0],
        borderColor: '#10B981', // emerald
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
      }
    ],
  };

  const doughnutData = {
    labels: ['Papelería', 'Limpieza', 'Higiene', 'Electrónica'],
    datasets: [{
      data: [35, 45, 15, 5],
      backgroundColor: ['#002D4C', '#00B3E1', '#10B981', '#F59E0B'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const topInsumosData = {
    labels: ['Papel Higiénico', 'Cloro Líquido', 'Jabón Manos', 'Hojas Blancas', 'Marcadores'],
    datasets: [{
      label: 'Volumen de Salida',
      data: [420, 150, 85, 45, 20],
      backgroundColor: 'rgba(0, 179, 225, 0.8)',
      borderRadius: 6,
    }]
  };

  const deptosData = {
    labels: ['Intendencia', 'Laboratorios', 'Dirección', 'Secretaría', 'Docencia'],
    datasets: [{
      label: 'Solicitudes en el mes',
      data: [124, 85, 42, 38, 15],
      backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald
      borderRadius: 6,
    }]
  };

  // --------------------------------------------------------
  // OPCIONES COMUNES PARA CHART.JS
  // --------------------------------------------------------
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94A3B8', font: { family: 'Manrope' } } }
    },
    scales: {
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94A3B8' } },
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Manrope', size: 11 } } }
    },
    cutout: '75%'
  };

  return (
    <div className="flex flex-col h-full animate-fade-in overflow-y-auto pr-2">
      
      {/* HEADER Y CONTROLES DE EXPORTACIÓN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Dashboard Analítico</h2>
          <p className="text-text-muted text-sm mt-1">Métricas y tendencias globales de la facultad</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Bloque de Controles Rápidos (Mes + Botones PDF/Excel) */}
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
            
            {/* Selector de Mes */}
            <select 
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-transparent text-sm font-semibold text-text-primary outline-none border-none cursor-pointer pl-3 pr-2 py-1.5 focus:ring-0"
            >
              <option value="06-2026">Junio 2026</option>
              <option value="05-2026">Mayo 2026</option>
              <option value="04-2026">Abril 2026</option>
              <option value="03-2026">Marzo 2026</option>
            </select>
            
            <div className="w-[1px] h-6 bg-border mx-1"></div>

            {/* Exportar PDF Rápido */}
            <button 
              onClick={() => handleQuickExport('pdf')}
              className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center"
              title="Exportar PDF del mes actual"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h4v4H9z" /></svg>
            </button>

            {/* Exportar Excel Rápido */}
            <button 
              onClick={() => handleQuickExport('excel')}
              className="p-1.5 rounded-lg text-text-secondary hover:text-[#10B981] hover:bg-[#10B981]/10 transition-colors flex items-center justify-center mr-1"
              title="Exportar Excel del mes actual"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </button>
          </div>

          {/* Botón Reporte Personalizado (Modal) */}
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-accent text-accent font-heading font-bold text-sm transition-all hover:bg-[var(--accent-glow)] shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            Reporte Personalizado
          </button>
        </div>
      </div>

      {/* KPIs (Grid de 4 columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Total Salidas</p>
            <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </span>
          </div>
          <p className="text-3xl font-heading font-black text-text-primary">1,248</p>
          <p className="text-xs text-text-muted mt-2">Mes: <span className="font-bold text-text-primary">{mesSeleccionado}</span></p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Total Entradas</p>
            <span className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/></svg>
            </span>
          </div>
          <p className="text-3xl font-heading font-black text-text-primary">450</p>
          <p className="text-xs text-text-muted mt-2">Mes: <span className="font-bold text-text-primary">{mesSeleccionado}</span></p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Insumos Críticos</p>
            <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </span>
          </div>
          <p className="text-3xl font-heading font-black text-red-500">8</p>
          <p className="text-xs text-text-muted mt-2">Requieren abastecimiento</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Usuarios Activos</p>
            <span className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </span>
          </div>
          <p className="text-3xl font-heading font-black text-text-primary">42</p>
          <p className="text-xs text-text-muted mt-2">Solicitudes en este mes</p>
        </div>
      </div>

      {/* BLOQUE DE GRÁFICAS 1 (Tendencia y Categorías) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 min-h-[320px]">
        {/* Gráfica de Líneas */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">Tendencia Semanal de Inventario</h3>
          <div className="flex-1 relative w-full h-full min-h-[220px]">
            <Line data={lineChartData} options={commonOptions} />
          </div>
        </div>

        {/* Gráfica de Dona */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">Consumo por Categoría</h3>
          <div className="flex-1 relative w-full h-full min-h-[220px] flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* BLOQUE DE GRÁFICAS 2 (Top Insumos y Departamentos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 min-h-[320px]">
        {/* Bar Chart 1: Top 5 Insumos */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider">Top 5 Insumos Más Solicitados</h3>
          </div>
          <div className="flex-1 relative w-full h-full min-h-[220px]">
            <Bar 
              data={topInsumosData} 
              options={{...commonOptions, plugins: { legend: { display: false } }}} 
            />
          </div>
        </div>

        {/* Bar Chart 2: Solicitudes por Departamento */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="font-heading font-bold text-sm uppercase text-text-muted tracking-wider mb-4">Solicitudes por Departamento</h3>
          <div className="flex-1 relative w-full h-full min-h-[220px]">
            <Bar 
              data={deptosData} 
              options={{
                ...commonOptions, 
                indexAxis: 'y', // La vuelve una gráfica de barras horizontales para mejor lectura de nombres largos
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Instancia del Modal de Reportes Personales */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialScope="global"
      />
      
    </div>
  );
}