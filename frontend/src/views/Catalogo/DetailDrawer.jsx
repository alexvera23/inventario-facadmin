import React, { useState, useEffect } from 'react';
import api from '../../services/api';
// Importaciones de Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registro de los componentes de la gráfica
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function DetailDrawer({ isOpen, onClose, producto, onOpenReport, onOpenEdit }) {
  // --------------------------------------------------------
  // ESTADOS DEL DRAWER
  // --------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({ entradas: 0, salidas: 0 });
  const [movimientos, setMovimientos] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Ejecutar la consulta cada vez que se abre el Drawer con un producto válido
  useEffect(() => {
    if (isOpen && producto) {
      fetchDetallesInsumo();
    } else {
      // Limpiar estados si se cierra
      setMovimientos([]);
      setChartData(null);
    }
  }, [isOpen, producto]);

  const fetchDetallesInsumo = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reportes/insumo/${producto.id}?periodo=semana`);
      const { estadisticas, movimientos: movs } = response.data;
      
      setKpis(estadisticas);
      setMovimientos(movs);
      generarDatosGrafica(movs, Number(producto.stock));
    } catch (error) {
      console.error('Error al obtener los detalles del insumo:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // LÓGICA DE LA GRÁFICA (Curva de Stock de 7 días)
  // --------------------------------------------------------
  const generarDatosGrafica = (movs, stockActual) => {
    // Generar etiquetas para los últimos 7 días
    const labels = [];
    const dataPoints = [];
    let stockSimulado = stockActual;

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      labels.push(fecha.toLocaleDateString('es-MX', { weekday: 'short' })); // Ej: 'lun', 'mar'

      // Buscar si hubo movimientos ese día para ajustar la curva hacia atrás
      const movsDelDia = movs.filter(m => new Date(m.fecha).toDateString() === fecha.toDateString());
      
      let variacionNeta = 0;
      movsDelDia.forEach(m => {
        if (m.tipo === 'ENTRADA') variacionNeta -= Number(m.cantidad); // Restamos porque vamos hacia atrás
        if (m.tipo === 'SALIDA') variacionNeta += Number(m.cantidad);  // Sumamos porque vamos hacia atrás
      });

      // El stock al inicio de ese día
      stockSimulado = stockSimulado + variacionNeta;
      dataPoints.unshift(stockSimulado); // Insertamos al inicio del arreglo
    }

    // Para que termine exactamente en el stock actual al final de la gráfica
    dataPoints[6] = stockActual; 

    setChartData({
      labels,
      datasets: [
        {
          label: 'Nivel de Stock',
          data: dataPoints,
          borderColor: '#38BDF8', // Tu color accent (Ajusta si usas variables CSS)
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#38BDF8',
          fill: true,
          tension: 0.3 // Curva suave
        }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} ${producto?.unidad || 'uds'}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748B' } },
      y: { grid: { color: 'rgba(100, 116, 139, 0.1)' }, ticks: { font: { size: 10 }, color: '#64748B' }, beginAtZero: true }
    }
  };

  // --------------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------------
  if (!producto) return null;

  const maxCapacidad = Number(producto.stockMaximo) || 100;
  const porcentajeStock = Math.min((Number(producto.stock) / maxCapacidad) * 100, 100);
  const esCritico = producto.estado === 'low';
  const esModerado = producto.estado === 'mid';

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-app border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="py-[18px] px-5 border-b border-border bg-app flex items-center justify-between">
          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.08em] text-text-muted font-heading uppercase">
              {producto.categoria}
            </span>
            <h3 className="font-heading font-extrabold text-[1.1rem] mt-0.5 text-text-primary">
              {producto.nombre}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-inputBg text-text-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          
          {/* Tarjeta Stock Principal */}
          <div className="bg-inputBg border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.75rem] text-text-muted font-semibold">Stock Físico Actual</p>
              <span className={`text-[0.65rem] font-heading font-bold px-2 py-0.5 rounded-full ${esCritico ? 'bg-red-500/10 text-red-500' : esModerado ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>
                {esCritico ? 'CRÍTICO' : esModerado ? 'MODERADO' : 'NORMAL'}
              </span>
            </div>
            <p className="text-accent font-heading font-extrabold text-3xl">
              {Number(producto.stock).toFixed(2)} <span className="text-base text-text-muted">{producto.unidad}</span>
            </p>
            
            <div className="mt-3 bg-border rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${esCritico ? 'bg-red-500' : esModerado ? 'bg-yellow-500' : 'bg-accent'}`} style={{ width: `${porcentajeStock}%` }}></div>
            </div>
            <p className="text-[0.7rem] text-text-muted mt-1.5 text-right font-mono">
              ~{Math.round(porcentajeStock)}% de capacidad
            </p>
          </div>

          {/* Estado de carga general para el resto del Drawer */}
          {loading ? (
            <div className="flex-1 flex justify-center items-center py-10">
               <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Mini Stats (Grid 1x2) - DATOS REALES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-inputBg border border-border rounded-xl p-3">
                  <p className="text-[0.65rem] text-text-muted font-semibold font-heading uppercase tracking-wider">Salidas esta semana</p>
                  <p className="text-accent font-heading font-extrabold text-xl mt-1">{kpis.salidas.toFixed(2)}</p>
                </div>
                <div className="bg-inputBg border border-border rounded-xl p-3">
                  <p className="text-[0.65rem] text-text-muted font-semibold font-heading uppercase tracking-wider">Entradas esta semana</p>
                  <p className="text-[#4ADE80] font-heading font-extrabold text-xl mt-1">{kpis.entradas.toFixed(2)}</p>
                </div>
              </div>

              {/* Gráfica */}
              <div>
                <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-2">Comportamiento del Stock (7 días)</p>
                <div className="h-[140px] w-full bg-card border border-border rounded-xl p-2 relative">
                  {chartData ? <Line data={chartData} options={chartOptions} /> : <span className="text-xs text-text-muted absolute inset-0 flex items-center justify-center">Generando gráfica...</span>}
                </div>
              </div>

              {/* Últimos Movimientos - DATOS REALES */}
              <div>
                <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-2">Últimos Movimientos</p>
                <div className="flex flex-col gap-3">
                  {movimientos.length === 0 ? (
                    <div className="text-center p-4 border border-border rounded-lg bg-inputBg text-text-muted text-xs">
                      No hay movimientos esta semana.
                    </div>
                  ) : (
                    movimientos.slice(0, 5).map((mov) => (
                      <div key={mov.id} className="flex justify-between items-center bg-card p-3 rounded-lg border border-border/50">
                        <div>
                          <p className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                            {mov.involucrado} 
                            <span className="text-[0.65rem] font-normal text-text-muted bg-inputBg px-1.5 py-0.5 rounded">
                              {new Date(mov.fecha).toLocaleDateString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                          <p className="text-text-secondary text-[0.7rem] mt-0.5 truncate w-40" title={mov.observaciones || 'Operación regular'}>
                            {mov.tipo === 'ENTRADA' ? 'Abastecimiento' : 'Despacho'} • {mov.observaciones || 'Regular'}
                          </p>
                        </div>
                        <span className={`font-bold font-mono text-sm ${mov.tipo === 'ENTRADA' ? 'text-[#4ADE80]' : 'text-red-500'}`}>
                          {mov.tipo === 'ENTRADA' ? '+' : '-'} {mov.cantidad.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-app flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onOpenEdit(producto)} 
              className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">
              Ajuste manual
            </button>
            <button className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">Emergencia</button>
            <button className="bg-accent text-white hover:opacity-90 rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">Abastecer</button>
          </div>
          <button 
            onClick={() => onOpenReport(producto)}
            className="w-full mt-1 bg-card border-2 border-[var(--accent-glow-strong)] text-accent hover:bg-[var(--accent-glow)] rounded-lg font-heading font-semibold text-[0.8rem] py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Generar reporte de este insumo
          </button>
        </div>
      </aside>
    </>
  );
}