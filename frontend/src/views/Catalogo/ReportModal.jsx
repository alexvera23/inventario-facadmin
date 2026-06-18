import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Paleta BUAP / FacAdmin ────────────────────────────────────────────────
const PALETTE = {
  cyan:    'rgba(0, 179, 225, 0.85)',
  cyanBg:  'rgba(0, 179, 225, 0.12)',
  emerald: 'rgba(16, 185, 129, 0.85)',
  amber:   '#F59E0B',
  violet:  '#8B5CF6',
  rose:    '#F43F5E',
  navy:    '#002D4C',
};

const CHART_COLORS = [PALETTE.navy, PALETTE.cyan, PALETTE.emerald, PALETTE.amber, PALETTE.violet, PALETTE.rose];

// ─── Opciones Chart.js (UI preview) ───────────────────────────────────────
const commonChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { position: 'top', labels: { color: '#94A3B8', font: { family: 'Manrope', size: 11 } } },
    tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8' }
  },
  scales: {
    y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94A3B8' } },
    x: { grid: { display: false }, ticks: { color: '#94A3B8' } }
  }
};

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Manrope', size: 11 } } },
    tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8' }
  },
  cutout: '70%'
};

const horizontalBarOpts = {
  ...commonChartOpts,
  indexAxis: 'y',
  plugins: { ...commonChartOpts.plugins, legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94A3B8' } },
    y: { grid: { display: false }, ticks: { color: '#94A3B8' } }
  }
};

// ─── Meses disponibles ─────────────────────────────────────────────────────
const MESES = [
  { value: '06-2026', label: 'Junio 2026' },
  { value: '05-2026', label: 'Mayo 2026' },
  { value: '04-2026', label: 'Abril 2026' },
  { value: '03-2026', label: 'Marzo 2026' },
];

// ─── Pequeño ícono de loading ──────────────────────────────────────────────
function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Tarjeta KPI ───────────────────────────────────────────────────────────
function KpiCard({ label, value, colorClass = 'text-text-primary', sub }) {
  return (
    <div className="bg-inputBg border border-border rounded-xl p-4 flex flex-col gap-1">
      <p className="text-[0.65rem] font-heading font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`text-2xl font-heading font-black ${colorClass}`}>{value ?? '—'}</p>
      {sub && <p className="text-[0.7rem] text-text-muted">{sub}</p>}
    </div>
  );
}

// ─── Sección con título colapsable ────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.7rem] font-heading font-bold uppercase tracking-widest text-text-muted border-b border-border pb-1.5">
        {title}
      </p>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZADO OFFSCREEN EN ALTA DEFINICIÓN
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Opciones base para charts offscreen (fondo blanco, colores legibles en PDF).
 * Se generan con dimensiones fijas 1600×700 → ~216 dpi en A4 sin escalado.
 */
const OFFSCREEN_BASE_OPTS = {
  animation: false,
  responsive: false,       // ← CLAVE: tamaño absoluto, Chart.js no redimensiona
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#1E293B', font: { family: 'Helvetica', size: 22 }, padding: 24 },
    },
    tooltip: { enabled: false },
  },
  scales: {
    y: {
      grid: { color: 'rgba(0,0,0,0.08)' },
      ticks: { color: '#334155', font: { size: 18 } },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#334155', font: { size: 18 }, maxRotation: 45 },
    },
  },
};

const OFFSCREEN_DOUGHNUT_OPTS = {
  animation: false,
  responsive: false,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: { color: '#1E293B', font: { family: 'Helvetica', size: 22 }, padding: 20 },
    },
    tooltip: { enabled: false },
  },
  cutout: '60%',
};

const OFFSCREEN_HBAR_OPTS = {
  ...OFFSCREEN_BASE_OPTS,
  indexAxis: 'y',
  plugins: {
    ...OFFSCREEN_BASE_OPTS.plugins,
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.08)' },
      ticks: { color: '#334155', font: { size: 18 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#334155', font: { size: 18 } },
    },
  },
};

/**
 * Renderiza una gráfica Chart.js en un canvas en memoria (fuera del DOM),
 * la exporta como PNG base64 en alta resolución y destruye la instancia.
 *
 * @param {'line'|'bar'|'doughnut'} type  - Tipo de gráfica
 * @param {object}  chartData             - { labels, datasets }
 * @param {object}  extraOpts             - Opciones adicionales a mezclar
 * @param {number}  [width=1600]          - Ancho del canvas en px
 * @param {number}  [height=700]          - Alto del canvas en px
 * @returns {Promise<string|null>}        - dataURL PNG o null si falla
 */
async function renderChartOffscreen(type, chartData, extraOpts = {}, width = 1600, height = 700) {
  if (!chartData?.labels?.length && !chartData?.datasets?.some(d => d.data?.length)) {
    return null;
  }

  // Seleccionar opciones base según tipo
  let baseOpts;
  if (type === 'doughnut') {
    baseOpts = OFFSCREEN_DOUGHNUT_OPTS;
  } else if (extraOpts._isHorizontal) {
    baseOpts = OFFSCREEN_HBAR_OPTS;
  } else {
    baseOpts = OFFSCREEN_BASE_OPTS;
  }

  // Mezcla profunda segura de opciones (sin la flag interna)
  const { _isHorizontal, ...cleanExtra } = extraOpts;
  const finalOpts = deepMerge(baseOpts, cleanExtra);

  // Crear canvas fuera del DOM
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;

  // Fondo blanco explícito
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Instanciar Chart.js
  let chartInstance = null;
  try {
    chartInstance = new ChartJS(canvas, {
      type,
      data: chartData,
      options: finalOpts,
    });

    // Forzar render síncrono
    chartInstance.update('none');

    const dataURL = canvas.toDataURL('image/png', 1.0);
    return dataURL;
  } catch (err) {
    console.error('[renderChartOffscreen] Error:', err);
    return null;
  } finally {
    // Destruir siempre para liberar RAM
    if (chartInstance) {
      chartInstance.destroy();
    }
  }
}

/** Merge profundo simple (solo objetos planos, no arrays) */
function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      typeof base[key] === 'object' &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILIDADES DE EXPORTACIÓN
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Genera el Excel (.xlsx) a partir de los datos del reporte.
 * Usa la librería xlsx (SheetJS).
 */
async function generarExcel({ scope, labelMes, kpis, data, labelScope }) {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // ── Hoja 1: KPIs ──────────────────────────────────────────────────────────
  const kpiRows = [];
  kpiRows.push(['REPORTE FACDAMIN — BUAP', '', '']);
  kpiRows.push([`Alcance: ${labelScope}`, `Período: ${labelMes}`, '']);
  kpiRows.push([]);
  kpiRows.push(['KPI', 'Valor', 'Descripción']);

  if (scope === 'global' || scope === 'insumo') {
    kpiRows.push(['Total Salidas', kpis?.salidas ?? kpis?.salidas ?? 0, 'Unidades consumidas']);
    kpiRows.push(['Total Entradas', kpis?.entradas ?? 0, 'Unidades abastecidas']);
  }
  if (scope === 'global') {
    kpiRows.push(['Insumos Críticos', kpis?.criticos ?? 0, 'Productos bajo stock mínimo']);
    kpiRows.push(['Usuarios Activos', kpis?.usuariosActivos ?? 0, 'Solicitantes con actividad']);
  }
  if (scope === 'insumo') {
    kpiRows.push(['Entradas del Producto', kpis?.entradas ?? 0, 'Total de entradas en el período']);
    kpiRows.push(['Salidas del Producto', kpis?.salidas ?? 0, 'Total de salidas en el período']);
  }
  if (scope === 'usuario') {
    kpiRows.push(['Total Movimientos', data?.length ?? 0, 'Registros del período']);
    const entradas = (data || []).filter(m => m.tipo === 'ENTRADA').length;
    const salidas  = (data || []).filter(m => m.tipo === 'SALIDA').length;
    kpiRows.push(['Entradas procesadas', entradas, '']);
    kpiRows.push(['Salidas procesadas', salidas, '']);
  }

  const wsKpis = XLSX.utils.aoa_to_sheet(kpiRows);
  wsKpis['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsKpis, 'KPIs');

  // ── Hoja 2: Detalle de movimientos ────────────────────────────────────────
  if (scope === 'global' && data?.tendencia) {
    const rows = [['Fecha', 'Entradas', 'Salidas']];
    (data.tendencia.labels || []).forEach((lbl, i) => {
      rows.push([lbl, data.tendencia.entradas[i] ?? 0, data.tendencia.salidas[i] ?? 0]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Tendencia');

    if (data.topInsumos?.labels?.length) {
      const rowsIns = [['Producto', 'Volumen Salida']];
      data.topInsumos.labels.forEach((l, i) => rowsIns.push([l, data.topInsumos.data[i]]));
      const wsIns = XLSX.utils.aoa_to_sheet(rowsIns);
      wsIns['!cols'] = [{ wch: 30 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsIns, 'Top Insumos');
    }

    if (data.departamentos?.labels?.length) {
      const rowsDept = [['Departamento', 'Solicitudes']];
      data.departamentos.labels.forEach((l, i) => rowsDept.push([l, data.departamentos.data[i]]));
      const wsDept = XLSX.utils.aoa_to_sheet(rowsDept);
      wsDept['!cols'] = [{ wch: 30 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsDept, 'Departamentos');
    }
  }

  if (scope === 'insumo' && (data?.movimientos !== undefined || data?.historial !== undefined)) {
    const historial = data.movimientos ?? data.historial ?? [];
    const rows = [['Fecha', 'Tipo', 'Cantidad', 'Involucrado', 'Departamento', 'Observaciones']];
    historial.forEach(m => {
      rows.push([
        new Date(m.fecha).toLocaleDateString('es-MX'),
        m.tipo,
        m.cantidad,
        m.involucrado || '',
        m.departamento || '',
        m.observaciones || ''
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
  }

  if (scope === 'usuario' && Array.isArray(data)) {
    const rows = [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Unidad', 'Departamento', 'Encargado']];
    data.forEach(m => {
      rows.push([
        new Date(m.fecha).toLocaleDateString('es-MX'),
        m.tipo,
        m.producto?.nombre || '',
        Number(m.cantidad),
        m.producto?.unidad_medida || '',
        m.solicitante?.departamento || '',
        m.encargado?.nombre || ''
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Actividad');
  }

  const filename = `reporte_facdamin_${scope}_${labelMes.replace(' ', '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Genera el PDF usando jsPDF + gráficas renderizadas en canvas offscreen.
 * Cada gráfica se fabrica en memoria a 1600×700px, se exporta y se destruye.
 */
async function generarPDF({ scope, labelMes, kpis, data, labelScope, incluir,
                             /* chartRefs ya no se usa, se mantiene por compatibilidad */
                             lineChartData, doughnutData, topInsumosData, deptosData,
                             insumoChartData, usuarioChartData }) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const MARGIN = 14;
  const CONTENT_W = W - MARGIN * 2;

  // ── Colores tema ────────────────────────────────────────────────────────
  const NAVY  = [0, 45, 76];
  const CYAN  = [0, 179, 225];
  const GRAY  = [148, 163, 184];
  const LIGHT = [241, 245, 249];
  const WHITE = [255, 255, 255];
  const RED   = [239, 68, 68];
  const GREEN = [16, 185, 129];

  let y = 0;

  const addPage = () => {
    doc.addPage();
    drawHeader();
    y = 38;
  };

  const ensureSpace = (needed) => {
    if (y + needed > 280) addPage();
  };

  const drawHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 20, 'F');
    doc.setFillColor(...CYAN);
    doc.rect(0, 20, W, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BUAP · FacAdmin', MARGIN, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Sistema de Administración de Inventario', W - MARGIN, 13, { align: 'right' });
    doc.setFillColor(...LIGHT);
    doc.rect(0, 22, W, 12, 'F');
    doc.setTextColor(60, 80, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporte: ${labelScope}`, MARGIN, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${labelMes}`, MARGIN + 70, 30);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, W - MARGIN, 30, { align: 'right' });
  };

  const drawSectionTitle = (title) => {
    ensureSpace(12);
    doc.setFillColor(...NAVY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5);
    y += 12;
  };

  const drawKpiRow = (kpiList) => {
    ensureSpace(22);
    const cardW = (CONTENT_W - (kpiList.length - 1) * 3) / kpiList.length;
    kpiList.forEach((kpi, i) => {
      const x = MARGIN + i * (cardW + 3);
      doc.setFillColor(...LIGHT);
      doc.roundedRect(x, y, cardW, 20, 2, 2, 'F');
      doc.setDrawColor(210, 220, 230);
      doc.roundedRect(x, y, cardW, 20, 2, 2, 'S');
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(kpi.label.toUpperCase(), x + cardW / 2, y + 5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const valColor = kpi.danger ? RED : kpi.success ? GREEN : NAVY;
      doc.setTextColor(...valColor);
      doc.text(String(kpi.value ?? '0'), x + cardW / 2, y + 14, { align: 'center' });
      if (kpi.sub) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...GRAY);
        doc.text(kpi.sub, x + cardW / 2, y + 19, { align: 'center' });
      }
    });
    y += 25;
  };

  /**
   * Inserta en el PDF una imagen PNG generada offscreen.
   * @param {string|null} imgData - dataURL PNG
   * @param {number} chartH       - alto en mm dentro del PDF
   */
  const addChartPNG = (imgData, chartH = 58) => {
    if (!imgData) return;
    ensureSpace(chartH + 4);
    doc.addImage(imgData, 'PNG', MARGIN, y, CONTENT_W, chartH);
    y += chartH + 4;
  };

  const drawTable = (headers, rows, colWidths) => {
    const rowH = 7;
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    ensureSpace(rowH + 2);
    doc.setFillColor(...NAVY);
    doc.rect(MARGIN, y, totalW, rowH, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    let cx = MARGIN + 2;
    headers.forEach((h, i) => {
      doc.text(h, cx, y + 5);
      cx += colWidths[i];
    });
    y += rowH;
    rows.forEach((row, ri) => {
      ensureSpace(rowH);
      doc.setFillColor(ri % 2 === 0 ? 248 : 255, ri % 2 === 0 ? 250 : 255, ri % 2 === 0 ? 252 : 255);
      doc.rect(MARGIN, y, totalW, rowH, 'F');
      doc.setDrawColor(220, 228, 236);
      doc.rect(MARGIN, y, totalW, rowH, 'S');
      doc.setTextColor(50, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      let cx2 = MARGIN + 2;
      row.forEach((cell, j) => {
        const cellStr = String(cell ?? '');
        const maxW = colWidths[j] - 3;
        const truncated = doc.getStringUnitWidth(cellStr) * 7 / doc.internal.scaleFactor > maxW
          ? doc.splitTextToSize(cellStr, maxW)[0] + '…'
          : cellStr;
        doc.text(truncated, cx2, y + 5);
        cx2 += colWidths[j];
      });
      y += rowH;
    });
    y += 4;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CONSTRUCCIÓN DEL PDF
  // ══════════════════════════════════════════════════════════════════════════

  drawHeader();
  y = 38;

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Reporte Personalizado', MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Alcance: ${labelScope} · Período: ${labelMes}`, MARGIN, y);
  y += 10;

  // ══════════════════════════════════════════════════════════════════════════
  // SCOPE: GLOBAL
  // ══════════════════════════════════════════════════════════════════════════
  if (scope === 'global' && data) {
    if (incluir.kpis) {
      drawSectionTitle('Indicadores Clave (KPIs)');
      drawKpiRow([
        { label: 'Total Salidas',     value: data.kpis?.salidas?.toLocaleString('es-MX'),     sub: 'unidades consumidas' },
        { label: 'Total Entradas',    value: data.kpis?.entradas?.toLocaleString('es-MX'),    sub: 'unidades abastecidas', success: true },
        { label: 'Insumos Críticos',  value: data.kpis?.criticos,   sub: 'bajo stock mínimo', danger: data.kpis?.criticos > 0 },
        { label: 'Usuarios Activos',  value: data.kpis?.usuariosActivos, sub: 'en el período' },
      ]);
    }

    if (incluir.graficaTendencia) {
      // ── Tendencia (línea) ────────────────────────────────────────────────
      if (lineChartData?.labels?.length) {
        drawSectionTitle('Tendencia de Inventario');
        const img = await renderChartOffscreen('line', lineChartData);
        addChartPNG(img, 62);
      }

      // ── Categorías (doughnut) ────────────────────────────────────────────
      if (doughnutData?.labels?.length) {
        ensureSpace(70);
        drawSectionTitle('Consumo por Categoría');
        const img = await renderChartOffscreen('doughnut', doughnutData, {}, 1400, 700);
        addChartPNG(img, 62);
      }

      // ── Top Insumos (barra vertical) ─────────────────────────────────────
      if (topInsumosData?.labels?.length) {
        drawSectionTitle('Top 5 Insumos Más Solicitados');
        const img = await renderChartOffscreen('bar', topInsumosData);
        addChartPNG(img, 58);
      }

      // ── Departamentos (barra horizontal) ─────────────────────────────────
      if (deptosData?.labels?.length) {
        drawSectionTitle('Solicitudes por Departamento');
        const img = await renderChartOffscreen('bar', deptosData, { _isHorizontal: true });
        addChartPNG(img, 58);
      }
    }

    if (incluir.movimientos && data.tendencia?.labels?.length) {
      drawSectionTitle('Detalle de Movimientos por Día');
      const rows = (data.tendencia.labels || []).map((lbl, i) => [
        lbl,
        data.tendencia.entradas[i] ?? 0,
        data.tendencia.salidas[i] ?? 0
      ]);
      drawTable(['Fecha', 'Entradas', 'Salidas'], rows, [80, 50, 52]);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCOPE: INSUMO
  // ══════════════════════════════════════════════════════════════════════════
  if (scope === 'insumo' && data) {
    const stats = data.estadisticas ?? data.kpis ?? {};
    if (incluir.kpis) {
      drawSectionTitle('Indicadores del Producto');
      drawKpiRow([
        { label: 'Total Entradas', value: stats.entradas?.toLocaleString('es-MX'), sub: 'abastecidas', success: true },
        { label: 'Total Salidas',  value: stats.salidas?.toLocaleString('es-MX'),  sub: 'consumidas' },
      ]);
    }

    if (incluir.graficaTendencia && insumoChartData?.labels?.length) {
      drawSectionTitle('Histograma de Movimientos');
      const img = await renderChartOffscreen('bar', insumoChartData);
      addChartPNG(img, 62);
    }

    const historial = data.movimientos ?? data.historial ?? [];
    if (incluir.movimientos && historial.length) {
      drawSectionTitle('Historial de Movimientos');
      const rows = historial.map(m => [
        new Date(m.fecha).toLocaleDateString('es-MX'),
        m.tipo,
        m.cantidad,
        m.involucrado || '—',
        m.departamento || '—',
        m.observaciones || '—'
      ]);
      drawTable(
        ['Fecha', 'Tipo', 'Cant.', 'Involucrado', 'Depto.', 'Observaciones'],
        rows,
        [24, 16, 14, 36, 34, 58]
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCOPE: USUARIO
  // ══════════════════════════════════════════════════════════════════════════
  const usuarioRows = Array.isArray(data) ? data : (data?.datos ?? []);

  if (scope === 'usuario' && usuarioRows.length >= 0) {
    const entradas = usuarioRows.filter(m => m.tipo === 'ENTRADA').length;
    const salidas  = usuarioRows.filter(m => m.tipo === 'SALIDA').length;

    if (incluir.kpis) {
      drawSectionTitle('Indicadores del Usuario');
      drawKpiRow([
        { label: 'Total Movimientos', value: usuarioRows.length,   sub: 'en el período' },
        { label: 'Entradas',          value: entradas,      sub: 'procesadas', success: true },
        { label: 'Salidas / Pedidos', value: salidas,       sub: 'solicitadas' },
      ]);
    }

    if (incluir.graficaTendencia && usuarioChartData?.labels?.length) {
      drawSectionTitle('Actividad del Usuario');
      const img = await renderChartOffscreen('bar', usuarioChartData);
      addChartPNG(img, 62);
    }

    if (incluir.movimientos && usuarioRows.length) {
      drawSectionTitle('Detalle de Actividad');
      const rows = usuarioRows.map(m => [
        new Date(m.fecha).toLocaleDateString('es-MX'),
        m.tipo,
        m.producto?.nombre || '—',
        Number(m.cantidad),
        m.solicitante?.departamento || '—',
        m.encargado?.nombre || '—'
      ]);
      drawTable(
        ['Fecha', 'Tipo', 'Producto', 'Cant.', 'Depto.', 'Encargado'],
        rows,
        [24, 16, 52, 12, 38, 40]
      );
    }
  }

  // ── PIE DE PÁGINA ──────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('FacAdmin — Benemérita Universidad Autónoma de Puebla', MARGIN, 293.5);
    doc.text(`Página ${p} de ${totalPages}`, W - MARGIN, 293.5, { align: 'right' });
  }

  const filename = `reporte_facdamin_${scope}_${labelMes.replace(' ', '_')}.pdf`;
  doc.save(filename);
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function ReportModal({ isOpen, onClose, initialScope = 'global', initialSubjectId = null }) {
  // ── Configuración del reporte ──────────────────────────────────────────
  const [scope,    setScope]    = useState(initialScope);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [mesSeleccionado, setMesSeleccionado] = useState('06-2026');
  const [periodo, setPeriodo]   = useState('semana');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin,    setFechaFin]    = useState('');
  const [modoPeriodo, setModoPeriodo] = useState('mes');

  const [incluir, setIncluir] = useState({
    movimientos:      true,
    graficaTendencia: true,
    kpis:             true,
    alertas:          false,
  });

  // ── Catálogos para el selector dinámico ───────────────────────────────
  const [catalogoProductos, setCatalogoProductos] = useState([]);
  const [catalogoUsuarios,  setCatalogoUsuarios]  = useState([]);

  // ── Estado del fetch de datos ──────────────────────────────────────────
  const [previewData, setPreviewData] = useState(null);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState(null);
  const [generando,   setGenerando]   = useState(null);

  // ── Refs de los charts para la previsualización UI (sin cambios) ───────
  const lineChartRef     = useRef(null);
  const doughnutChartRef = useRef(null);
  const topInsumosRef    = useRef(null);
  const deptosRef        = useRef(null);
  const insumoChartRef   = useRef(null);
  const usuarioChartRef  = useRef(null);

  // ── Reset al abrir ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setScope(initialScope);
      setSubjectId(initialSubjectId);
      setPreviewData(null);
      setError(null);
    }
  }, [isOpen, initialScope, initialSubjectId]);

  // ── Cargar catálogos al montar ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    api.get('/productos?limite=200').then(r => setCatalogoProductos(r.data?.datos || r.data || [])).catch(() => {});
    api.get('/usuarios?limite=200').then(r => setCatalogoUsuarios(r.data?.datos || r.data || [])).catch(() => {});
  }, [isOpen]);

  // ── Fetch de datos de preview ──────────────────────────────────────────
  const fetchPreview = useCallback(async () => {
    if (scope !== 'global' && !subjectId) return;
    setCargando(true);
    setError(null);
    setPreviewData(null);

    try {
      let res;
      if (scope === 'global') {
        const mes = modoPeriodo === 'mes' ? mesSeleccionado : null;
        const query = mes ? `?mes=${mes}` : '';
        res = await api.get(`/reportes/dashboard${query}`);
        setPreviewData({ tipo: 'global', data: res.data });
      } else if (scope === 'insumo') {
        const p = modoPeriodo === 'mes' ? 'mes' : (periodo || 'semana');
        res = await api.get(`/reportes/insumo/${subjectId}?periodo=${p}`);
        setPreviewData({ tipo: 'insumo', data: res.data });
      } else if (scope === 'usuario') {
        const p = modoPeriodo === 'mes' ? 'mes' : (periodo || 'semana');
        res = await api.get(`/reportes/usuario/${subjectId}?periodo=${p}`);
        setPreviewData({ tipo: 'usuario', data: res.data });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  }, [scope, subjectId, mesSeleccionado, periodo, modoPeriodo]);

  useEffect(() => {
    if (isOpen) fetchPreview();
  }, [scope, subjectId, mesSeleccionado, periodo, modoPeriodo, isOpen, fetchPreview]);

  // ── Helpers de label ───────────────────────────────────────────────────
  const labelMes = MESES.find(m => m.value === mesSeleccionado)?.label ?? mesSeleccionado;
  const labelScope = (() => {
    if (scope === 'global') return 'Global — Toda la Facultad';
    if (scope === 'insumo') {
      const p = catalogoProductos.find(p => String(p.id) === String(subjectId));
      return p ? `Insumo: ${p.nombre}` : 'Insumo seleccionado';
    }
    if (scope === 'usuario') {
      const u = catalogoUsuarios.find(u => String(u.id) === String(subjectId));
      return u ? `Usuario: ${u.nombre}` : 'Usuario seleccionado';
    }
    return scope;
  })();

  // ── Datos derivados para charts ────────────────────────────────────────
  const globalData    = previewData?.tipo === 'global'   ? previewData.data : null;
  const insumoData    = previewData?.tipo === 'insumo'   ? previewData.data : null;
  const usuarioData   = previewData?.tipo === 'usuario'
    ? (Array.isArray(previewData.data) ? previewData.data : (previewData.data?.datos ?? []))
    : null;

  // ── Datasets (compartidos entre preview UI y generación offscreen) ─────
  const lineChartData = globalData ? {
    labels: globalData.tendencia?.labels || [],
    datasets: [
      { label: 'Salidas',  data: globalData.tendencia?.salidas  || [], borderColor: PALETTE.cyan,    backgroundColor: PALETTE.cyanBg, tension: 0.4, fill: true, pointRadius: 3 },
      { label: 'Entradas', data: globalData.tendencia?.entradas || [], borderColor: PALETTE.emerald, backgroundColor: 'transparent',  tension: 0.4, borderDash: [5, 5], pointRadius: 3 }
    ]
  } : null;

  const doughnutData = globalData ? {
    labels: globalData.categorias?.labels || [],
    datasets: [{ data: globalData.categorias?.data || [], backgroundColor: CHART_COLORS.slice(0, (globalData.categorias?.labels || []).length), borderWidth: 0, hoverOffset: 6 }]
  } : null;

  const topInsumosData = globalData ? {
    labels: globalData.topInsumos?.labels || [],
    datasets: [{ label: 'Volumen salida', data: globalData.topInsumos?.data || [], backgroundColor: PALETTE.cyan, borderRadius: 6 }]
  } : null;

  const deptosData = globalData ? {
    labels: globalData.departamentos?.labels || [],
    datasets: [{ label: 'Solicitudes', data: globalData.departamentos?.data || [], backgroundColor: PALETTE.emerald, borderRadius: 6 }]
  } : null;

  const insumoMovimientos = insumoData?.movimientos ?? insumoData?.historial ?? [];
  const insumoChartData = insumoMovimientos.length > 0 ? (() => {
    const map = {};
    insumoMovimientos.forEach(m => {
      const lbl = new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      if (!map[lbl]) map[lbl] = { entradas: 0, salidas: 0 };
      if (m.tipo === 'ENTRADA') map[lbl].entradas += Number(m.cantidad);
      else                      map[lbl].salidas  += Number(m.cantidad);
    });
    const labels = Object.keys(map).reverse();
    return {
      labels,
      datasets: [
        { label: 'Entradas', data: labels.map(l => map[l].entradas), backgroundColor: PALETTE.emerald, borderRadius: 4 },
        { label: 'Salidas',  data: labels.map(l => map[l].salidas),  backgroundColor: PALETTE.cyan,    borderRadius: 4 },
      ]
    };
  })() : null;

  const usuarioChartData = usuarioData ? (() => {
    const map = {};
    usuarioData.forEach(m => {
      const lbl = new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      if (!map[lbl]) map[lbl] = { ENTRADA: 0, SALIDA: 0 };
      map[lbl][m.tipo] += Number(m.cantidad);
    });
    const labels = Object.keys(map).reverse();
    return {
      labels,
      datasets: [
        { label: 'Entradas procesadas', data: labels.map(l => map[l].ENTRADA), backgroundColor: PALETTE.emerald, borderRadius: 4 },
        { label: 'Salidas / Pedidos',   data: labels.map(l => map[l].SALIDA),  backgroundColor: PALETTE.cyan,    borderRadius: 4 },
      ]
    };
  })() : null;

  // ── Exportar ───────────────────────────────────────────────────────────
  const handleExportar = async (formato) => {
    if (!previewData) return;
    setGenerando(formato);

    try {
      let kpis, data;

      if (previewData.tipo === 'global') {
        data = previewData.data;
        kpis = previewData.data?.kpis;
      } else if (previewData.tipo === 'insumo') {
        data = previewData.data;
        kpis = previewData.data?.estadisticas;
      } else {
        data = Array.isArray(previewData.data)
          ? previewData.data
          : (previewData.data?.datos ?? []);
        kpis = null;
      }

      if (formato === 'excel') {
        await generarExcel({ scope, labelMes, kpis, data, labelScope });
      } else {
        // Pasar los datasets calculados para que generarPDF los use en offscreen
        await generarPDF({
          scope, labelMes, kpis, data, labelScope, incluir,
          lineChartData,
          doughnutData,
          topInsumosData,
          deptosData,
          insumoChartData,
          usuarioChartData,
        });
      }
    } catch (e) {
      console.error('Error al exportar:', e);
      setError('Error al generar el archivo. Inténtalo de nuevo.');
    } finally {
      setGenerando(null);
    }
  };

  // ── Toggle incluir ─────────────────────────────────────────────────────
  const toggleIncluir = (key) => setIncluir(prev => ({ ...prev, [key]: !prev[key] }));

  if (!isOpen) return null;

  const hayDatos = !!previewData && !cargando && !error;
  const necesitaSujeto = scope !== 'global';
  const puedeExportar  = hayDatos && (!necesitaSujeto || subjectId);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-3"
        onClick={onClose}
      >
        <div
          className="bg-app rounded-2xl w-full max-w-[860px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{ minHeight: '560px' }}
        >
          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <div className="p-4 border-b border-border flex items-start justify-between gap-3 bg-card shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent-glow-strong)] shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-text-primary leading-tight">Reporte Personalizado</h3>
                <p className="text-[0.72rem] text-text-muted font-sans">Configura, previsualiza y exporta tus reportes</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-border text-text-secondary transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* ── BODY: panel izquierdo + preview derecho ────────────────── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Panel de configuración */}
            <div className="w-[260px] shrink-0 flex flex-col gap-5 p-4 border-r border-border overflow-y-auto bg-card/50">

              {/* Alcance */}
              <Section title="Alcance">
                <div className="flex flex-col gap-1.5">
                  {[
                    { key: 'global',  label: 'Global',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { key: 'insumo',  label: 'Por Insumo', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7' },
                    { key: 'usuario', label: 'Por Usuario', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => { setScope(key); setSubjectId(null); }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] font-semibold transition-all border text-left ${
                        scope === key
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-inputBg border-border text-text-secondary hover:border-accent/40'
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
                      </svg>
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Selector dinámico */}
              {scope !== 'global' && (
                <Section title={scope === 'insumo' ? 'Seleccionar Insumo' : 'Seleccionar Usuario'}>
                  <select
                    value={subjectId || ''}
                    onChange={e => setSubjectId(e.target.value || null)}
                    className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-[0.82rem] text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">Seleccione...</option>
                    {scope === 'insumo'
                      ? catalogoProductos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)
                      : catalogoUsuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)
                    }
                  </select>
                </Section>
              )}

              {/* Período */}
              <Section title="Período">
                <div className="flex bg-inputBg p-0.5 rounded-lg border border-border mb-2">
                  {['mes', 'personalizado'].map(m => (
                    <button
                      key={m}
                      onClick={() => setModoPeriodo(m)}
                      className={`flex-1 py-1.5 text-[0.75rem] font-semibold rounded-md transition-all capitalize ${
                        modoPeriodo === m ? 'bg-card shadow-sm text-text-primary border border-border/50' : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {m === 'mes' ? 'Por mes' : 'Rango'}
                    </button>
                  ))}
                </div>

                {modoPeriodo === 'mes' ? (
                  <select
                    value={mesSeleccionado}
                    onChange={e => setMesSeleccionado(e.target.value)}
                    className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-[0.82rem] text-text-primary outline-none focus:border-accent"
                  >
                    {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-[0.68rem] text-text-muted font-bold mb-1">Inicio</p>
                      <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                        className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-1.5 px-2 text-[0.8rem] text-text-primary outline-none focus:border-accent"/>
                    </div>
                    <div>
                      <p className="text-[0.68rem] text-text-muted font-bold mb-1">Fin</p>
                      <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                        className="w-full bg-inputBg border-[1.5px] border-border rounded-lg py-1.5 px-2 text-[0.8rem] text-text-primary outline-none focus:border-accent"/>
                    </div>
                    {scope !== 'global' && (
                      <div>
                        <p className="text-[0.68rem] text-text-muted font-bold mb-1">Granularidad</p>
                        <div className="flex gap-1 flex-wrap">
                          {['semana', 'quincena', 'mes'].map(p => (
                            <button key={p} onClick={() => setPeriodo(p)}
                              className={`flex-1 py-1 text-[0.72rem] font-semibold rounded-md transition-all capitalize border ${
                                periodo === p ? 'bg-accent/10 border-accent text-accent' : 'bg-inputBg border-border text-text-muted hover:border-accent/40'
                              }`}
                            >{p}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Section>

              {/* Incluir en el reporte */}
              <Section title="Incluir en el Reporte">
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'kpis',             label: 'KPIs y totales' },
                    { key: 'graficaTendencia', label: 'Gráficas' },
                    { key: 'movimientos',      label: 'Movimientos detallados' },
                    { key: 'alertas',          label: 'Alertas de stock' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-[0.78rem] font-semibold text-text-secondary select-none">
                      <input type="checkbox" checked={incluir[key]} onChange={() => toggleIncluir(key)}
                        className="w-3.5 h-3.5 accent-accent rounded"/>
                      {label}
                    </label>
                  ))}
                </div>
              </Section>
            </div>

            {/* Panel de Preview */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

              {cargando && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
                  <Spinner className="w-8 h-8 text-accent" />
                  <p className="text-sm">Cargando datos del reporte…</p>
                </div>
              )}

              {error && !cargando && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">Error al cargar datos</p>
                    <p className="text-xs opacity-80">{error}</p>
                    <button onClick={fetchPreview} className="mt-2 text-xs font-bold underline hover:no-underline">
                      Reintentar
                    </button>
                  </div>
                </div>
              )}

              {!cargando && !error && necesitaSujeto && !subjectId && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-muted">
                  <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                  </svg>
                  <p className="text-sm">Selecciona un {scope} para previsualizar el reporte</p>
                </div>
              )}

              {/* ── PREVIEW DE DATOS ──────────────────────────────────── */}
              {hayDatos && (!necesitaSujeto || subjectId) && (
                <>
                  {/* ── GLOBAL ───────────────────────────────────────── */}
                  {previewData.tipo === 'global' && globalData && (
                    <>
                      {incluir.kpis && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <KpiCard label="Total Salidas"    value={globalData.kpis?.salidas?.toLocaleString('es-MX')}    sub={`unidades · ${labelMes}`} />
                          <KpiCard label="Total Entradas"   value={globalData.kpis?.entradas?.toLocaleString('es-MX')}   colorClass="text-emerald-400" sub="abastecidas" />
                          <KpiCard label="Insumos Críticos" value={globalData.kpis?.criticos}  colorClass={globalData.kpis?.criticos > 0 ? 'text-red-400' : 'text-text-primary'} sub="bajo stock mín." />
                          <KpiCard label="Usuarios Activos" value={globalData.kpis?.usuariosActivos} sub="solicitantes" />
                        </div>
                      )}

                      {incluir.graficaTendencia && (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
                              <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted mb-3">Tendencia — {labelMes}</p>
                              <div className="h-[180px]">
                                {lineChartData?.labels.length > 0
                                  ? <Line ref={lineChartRef} data={lineChartData} options={commonChartOpts} />
                                  : <p className="text-text-muted text-xs italic flex items-center justify-center h-full">Sin datos</p>
                                }
                              </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                              <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted mb-3">Por Categoría</p>
                              <div className="h-[180px] flex items-center justify-center">
                                {doughnutData?.labels.length > 0
                                  ? <Doughnut ref={doughnutChartRef} data={doughnutData} options={doughnutOpts} />
                                  : <p className="text-text-muted text-xs italic">Sin consumos</p>
                                }
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-card border border-border rounded-xl p-4">
                              <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted mb-3">Top 5 Insumos</p>
                              <div className="h-[160px]">
                                {topInsumosData?.labels.length > 0
                                  ? <Bar ref={topInsumosRef} data={topInsumosData} options={{ ...commonChartOpts, plugins: { ...commonChartOpts.plugins, legend: { display: false } } }} />
                                  : <p className="text-text-muted text-xs italic flex items-center justify-center h-full">Sin datos</p>
                                }
                              </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                              <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted mb-3">Por Departamento</p>
                              <div className="h-[160px]">
                                {deptosData?.labels.length > 0
                                  ? <Bar ref={deptosRef} data={deptosData} options={horizontalBarOpts} />
                                  : <p className="text-text-muted text-xs italic flex items-center justify-center h-full">Sin datos</p>
                                }
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {incluir.movimientos && globalData.tendencia?.labels?.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-border">
                            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Movimientos por Día</p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[0.78rem]">
                              <thead className="bg-inputBg">
                                <tr>
                                  {['Fecha', 'Entradas', 'Salidas'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left text-[0.68rem] font-heading font-bold uppercase tracking-wide text-text-muted">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {globalData.tendencia.labels.map((lbl, i) => (
                                  <tr key={lbl} className="border-t border-border/50 hover:bg-inputBg/50">
                                    <td className="px-4 py-2 font-semibold text-text-secondary">{lbl}</td>
                                    <td className="px-4 py-2 text-emerald-400 font-semibold">{globalData.tendencia.entradas[i] ?? 0}</td>
                                    <td className="px-4 py-2 text-accent font-semibold">{globalData.tendencia.salidas[i] ?? 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── INSUMO ───────────────────────────────────────── */}
                  {previewData.tipo === 'insumo' && insumoData && (
                    <>
                      {incluir.kpis && (
                        <div className="grid grid-cols-2 gap-3">
                          <KpiCard label="Total Entradas" value={insumoData.estadisticas?.entradas?.toLocaleString('es-MX')} colorClass="text-emerald-400" sub="abastecidas" />
                          <KpiCard label="Total Salidas"  value={insumoData.estadisticas?.salidas?.toLocaleString('es-MX')}  sub="consumidas" />
                        </div>
                      )}

                      {incluir.graficaTendencia && insumoChartData && (
                        <div className="bg-card border border-border rounded-xl p-4">
                          <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted mb-3">Movimientos del Producto</p>
                          <div className="h-[180px]">
                            {insumoChartData.labels.length > 0
                              ? <Bar ref={insumoChartRef} data={insumoChartData} options={commonChartOpts} />
                              : <p className="text-text-muted text-xs italic flex items-center justify-center h-full">Sin movimientos</p>
                            }
                          </div>
                        </div>
                      )}

                      {incluir.movimientos && insumoData.movimientos?.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-border">
                            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                              Historial · {insumoData.movimientos.length} registros
                            </p>
                          </div>
                          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                            <table className="w-full text-[0.78rem]">
                              <thead className="bg-inputBg sticky top-0">
                                <tr>
                                  {['Fecha', 'Tipo', 'Cant.', 'Involucrado', 'Depto.'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-[0.65rem] font-heading font-bold uppercase tracking-wide text-text-muted">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {insumoData.movimientos.map((m, i) => (
                                  <tr key={m.id ?? i} className="border-t border-border/50 hover:bg-inputBg/50">
                                    <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{new Date(m.fecha).toLocaleDateString('es-MX')}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[0.65rem] font-bold ${m.tipo === 'ENTRADA' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-accent/15 text-accent'}`}>
                                        {m.tipo}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 font-semibold text-text-primary">{m.cantidad}</td>
                                    <td className="px-3 py-2 text-text-secondary">{m.involucrado || '—'}</td>
                                    <td className="px-3 py-2 text-text-muted">{m.departamento || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── USUARIO ──────────────────────────────────────── */}
                  {previewData.tipo === 'usuario' && Array.isArray(usuarioData) && (
                    <>
                      {incluir.kpis && (
                        <div className="grid grid-cols-3 gap-3">
                          <KpiCard label="Total Movimientos" value={usuarioData.length} sub="en el período" />
                          <KpiCard label="Entradas"          value={usuarioData.filter(m => m.tipo === 'ENTRADA').length} colorClass="text-emerald-400" sub="procesadas" />
                          <KpiCard label="Salidas / Pedidos" value={usuarioData.filter(m => m.tipo === 'SALIDA').length}  sub="solicitadas" />
                        </div>
                      )}

                      {incluir.graficaTendencia && usuarioChartData && (
                        <div className="bg-card border border-border rounded-xl p-4">
                          <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted mb-3">Actividad del Usuario</p>
                          <div className="h-[180px]">
                            {usuarioChartData.labels.length > 0
                              ? <Bar ref={usuarioChartRef} data={usuarioChartData} options={commonChartOpts} />
                              : <p className="text-text-muted text-xs italic flex items-center justify-center h-full">Sin actividad</p>
                            }
                          </div>
                        </div>
                      )}

                      {incluir.movimientos && usuarioData.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-border">
                            <p className="text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                              Actividad · {usuarioData.length} registros
                            </p>
                          </div>
                          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                            <table className="w-full text-[0.78rem]">
                              <thead className="bg-inputBg sticky top-0">
                                <tr>
                                  {['Fecha', 'Tipo', 'Producto', 'Cant.', 'Depto.', 'Encargado'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-[0.65rem] font-heading font-bold uppercase tracking-wide text-text-muted">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {usuarioData.map((m, i) => (
                                  <tr key={m.id ?? i} className="border-t border-border/50 hover:bg-inputBg/50">
                                    <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{new Date(m.fecha).toLocaleDateString('es-MX')}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[0.65rem] font-bold ${m.tipo === 'ENTRADA' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-accent/15 text-accent'}`}>
                                        {m.tipo}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-text-primary font-medium">{m.producto?.nombre || '—'}</td>
                                    <td className="px-3 py-2 font-semibold text-text-primary">{Number(m.cantidad)}</td>
                                    <td className="px-3 py-2 text-text-muted">{m.solicitante?.departamento || '—'}</td>
                                    <td className="px-3 py-2 text-text-secondary">{m.encargado?.nombre || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <div className="p-3.5 border-t border-border bg-card flex items-center justify-between gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button onClick={onClose} className="px-4 py-2 text-sm font-heading font-semibold text-text-secondary hover:bg-border rounded-lg transition-colors">
              Cancelar
            </button>

            <div className="flex items-center gap-2 ml-auto">
              {!puedeExportar && !cargando && (
                <p className="text-[0.72rem] text-text-muted italic mr-2">
                  {necesitaSujeto && !subjectId ? `Selecciona un ${scope}` : 'Sin datos disponibles'}
                </p>
              )}

              <button
                onClick={() => handleExportar('excel')}
                disabled={!puedeExportar || generando !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generando === 'excel'
                  ? <Spinner className="w-4 h-4" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                }
                Excel
              </button>

              <button
                onClick={() => handleExportar('pdf')}
                disabled={!puedeExportar || generando !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white hover:bg-accent/90 rounded-lg font-heading font-semibold text-sm transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generando === 'pdf'
                  ? <Spinner className="w-4 h-4" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                }
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}