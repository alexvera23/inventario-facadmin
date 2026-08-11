import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PaginationControls from '../PaginationControls';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EDIFICIOS_DISPONIBLES = ['ADM1', 'ADM2', 'ADM3', 'ADM4', 'LAB_SISTEMAS', 'BODEGA_CENTRAL'];

export default function InsumoHistorialModal({ isOpen, onClose, producto }) {
  // ─── ESTADOS DE FILTROS ───
  const [periodo, setPeriodo] = useState('semana');
  const [edificioFiltro, setEdificioFiltro] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // ─── ESTADOS DE PAGINACIÓN Y DATOS ───
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [kpis, setKpis] = useState({ entradas: 0, salidas: 0 });
  const [loading, setLoading] = useState(false);

  // ─── CONSULTA AL BACKEND ───
  const fetchHistorialCompleto = useCallback(async () => {
    if (!producto?.id) return;
    setLoading(true);

    try {
      const response = await api.get(`/reportes/insumo/${producto.id}`, {
        params: {
          periodo,
          page,
          limit,
          edificio: edificioFiltro
        }
      });

      const { estadisticas, movimientos: movsData } = response.data;

      setKpis(estadisticas || { entradas: 0, salidas: 0 });

      // Extraer datos paginados de forma segura
      const listaMovs = movsData?.data || (Array.isArray(movsData) ? movsData : []);
      const pagInfo = movsData?.pagination || null;

      setMovimientos(listaMovs);
      setPagination(pagInfo);
    } catch (error) {
      console.error('Error al cargar historial detallado del insumo:', error);
    } finally {
      setLoading(false);
    }
  }, [producto?.id, periodo, page, limit, edificioFiltro]);

  useEffect(() => {
    if (isOpen && producto) {
      fetchHistorialCompleto();
    }
  }, [isOpen, producto, fetchHistorialCompleto]);

  if (!isOpen || !producto) return null;

  // ─── BÚSQUEDA LOCAL EN LA LISTA DE MOVIMIENTOS ───
  const movimientosFiltrados = movimientos.filter(m => 
    m.involucrado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.departamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── CONFIGURACIÓN DE LA GRÁFICA DE BARRAS ───
  const chartData = {
    labels: ['Entradas (Surtido)', 'Salidas (Despacho)'],
    datasets: [
      {
        label: 'Volumen de Unidades',
        data: [kpis.entradas, kpis.salidas],
        backgroundColor: ['rgba(74, 222, 128, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['#4ADE80', '#EF4444'],
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} ${producto.unidad_medida || 'unidades'}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11 } } },
      y: { grid: { color: 'rgba(100, 116, 139, 0.1)' }, ticks: { color: '#64748B', font: { size: 11 } }, beginAtZero: true }
    }
  };

  const balanceNeto = kpis.entradas - kpis.salidas;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Contenedor Modal */}
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-border bg-inputBg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-bold font-heading uppercase text-accent bg-accent/10 px-2 py-0.5 rounded">
                {producto.categoria || 'Insumo'}
              </span>
              <span className="text-xs text-text-muted font-mono font-bold">ID #{producto.id}</span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-text-primary mt-1">
              Historial Detallado: {producto.nombre}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-card rounded-lg transition-colors self-end sm:self-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Filtros Superiores */}
        <div className="p-4 bg-app border-b border-border flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            
            {/* Selector de Período */}
            <div className="flex bg-inputBg p-1 rounded-lg border border-border">
              {['dia', 'semana', 'quincena', 'mes'].map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriodo(p); setPage(1); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                    periodo === p ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Selector de Sede */}
            <select
              value={edificioFiltro}
              onChange={(e) => { setEdificioFiltro(e.target.value); setPage(1); }}
              className="bg-inputBg border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary outline-none focus:border-accent"
            >
              <option value="TODOS">Todas las Sedes</option>
              {EDIFICIOS_DISPONIBLES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Buscador Rápido en Tabla */}
          <input
            type="text"
            placeholder="Buscar por involucrado o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent w-full sm:w-64"
          />
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Ficha de Métricas KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-inputBg border border-border rounded-xl p-4">
              <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Entradas Registradas</p>
              <p className="text-2xl font-mono font-bold text-green-500 mt-1">+{kpis.entradas.toFixed(2)}</p>
              <p className="text-[0.65rem] text-text-muted mt-0.5">{producto.unidad_medida} ingresadas</p>
            </div>

            <div className="bg-inputBg border border-border rounded-xl p-4">
              <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Salidas Registradas</p>
              <p className="text-2xl font-mono font-bold text-red-500 mt-1">-{kpis.salidas.toFixed(2)}</p>
              <p className="text-[0.65rem] text-text-muted mt-0.5">{producto.unidad_medida} despachadas</p>
            </div>

            <div className="bg-inputBg border border-border rounded-xl p-4">
              <p className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Balance del Período</p>
              <p className={`text-2xl font-mono font-bold mt-1 ${balanceNeto >= 0 ? 'text-accent' : 'text-orange-500'}`}>
                {balanceNeto >= 0 ? '+' : ''}{balanceNeto.toFixed(2)}
              </p>
              <p className="text-[0.65rem] text-text-muted mt-0.5">Variación neta en almacén</p>
            </div>
          </div>

          {/* Gráfica Comparativa de Barras */}
          <div className="bg-inputBg border border-border rounded-xl p-4">
            <h3 className="text-xs font-heading font-bold uppercase text-text-muted tracking-wider mb-3">
              Comparativa de Volumen en {periodo}
            </h3>
            <div className="h-44 w-full relative">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Tabla Auditada de Movimientos */}
          <div className="bg-inputBg border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-border bg-card flex justify-between items-center">
              <h3 className="text-xs font-heading font-bold uppercase text-text-primary tracking-wider">
                Bitácora de Transacciones
              </h3>
              <span className="text-[0.65rem] font-mono text-text-muted">{movimientosFiltrados.length} registros en vista</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-inputBg text-text-muted uppercase text-[0.65rem] font-heading font-bold">
                    <th className="p-3">ID / Fecha</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Sede</th>
                    <th className="p-3">Involucrado / Depto</th>
                    <th className="p-3">Observaciones</th>
                    <th className="p-3 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-text-muted animate-pulse">Cargando bitácora...</td>
                    </tr>
                  ) : movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-text-muted italic">No se registraron movimientos en este rango.</td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((m) => (
                      <tr key={m.id} className="hover:bg-card/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-text-primary">
                          #{m.id}
                          <span className="block text-[0.65rem] font-normal text-text-muted">
                            {new Date(m.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase ${
                            m.tipo === 'ENTRADA' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-text-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                            </svg> {m.edificio || 'Sede Central'}</td>
                        <td className="p-3">
                          <p className="font-semibold text-text-primary">{m.involucrado}</p>
                          <p className="text-[0.65rem] text-text-muted">{m.departamento}</p>
                        </td>
                        <td className="p-3 text-text-secondary max-w-xs truncate" title={m.observaciones}>
                          {m.observaciones || 'Sin observaciones'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-sm">
                          <span className={m.tipo === 'ENTRADA' ? 'text-green-500' : 'text-red-500'}>
                            {m.tipo === 'ENTRADA' ? '+' : '-'}{Number(m.cantidad).toFixed(2)}
                          </span>
                          <span className="text-[0.65rem] text-text-muted ml-1 font-normal">{producto.unidad_medida}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer y Paginación */}
        <div className="p-4 border-t border-border bg-inputBg flex justify-between items-center">
          <PaginationControls
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>

      </div>
    </div>
  );
}