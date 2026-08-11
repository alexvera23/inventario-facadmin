import React, { useState, useEffect } from 'react';
import api from '../../services/api';
// Importaciones de Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';

// Registro de los componentes de la gráfica
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function DetailDrawer({ isOpen, onClose, producto, onOpenReport, onOpenEdit }) {
  //Extraemos el usuario activo
  const { user: currentUser } = useAuth();
  
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
      setMovimientos([]);
      setChartData(null);
    }
  }, [isOpen, producto]);

  const fetchDetallesInsumo = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reportes/insumo/${producto.id}?periodo=semana`);
      const { estadisticas, movimientos: movsData } = response.data;
      
      setKpis(estadisticas);
      
      //  CORRECCIÓN: Extraemos el arreglo de movimientos desde .data si viene paginado
      const listaMovimientos = Array.isArray(movsData) 
        ? movsData 
        : (movsData?.data || []);

      setMovimientos(listaMovimientos);
      
      //  Usamos el stock calculado desde la vista multi-sede
      const stockActual = Number(producto.stockCalculado || producto.stock || 0);
      generarDatosGrafica(listaMovimientos, stockActual);
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
    // Protección por si movs no es un arreglo
    const movsSeguros = Array.isArray(movs) ? movs : [];
    
    const labels = [];
    const dataPoints = [];
    let stockSimulado = stockActual;

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      labels.push(fecha.toLocaleDateString('es-MX', { weekday: 'short' })); 

      const movsDelDia = movsSeguros.filter(
        m => new Date(m.fecha).toDateString() === fecha.toDateString()
      );
      
      let variacionNeta = 0;
      movsDelDia.forEach(m => {
        if (m.tipo === 'ENTRADA') variacionNeta -= Number(m.cantidad); 
        if (m.tipo === 'SALIDA') variacionNeta += Number(m.cantidad);  
      });

      stockSimulado = stockSimulado + variacionNeta;
      dataPoints.unshift(stockSimulado); 
    }

    dataPoints[6] = stockActual; 

    setChartData({
      labels,
      datasets: [
        {
          label: 'Nivel de Stock',
          data: dataPoints,
          borderColor: '#38BDF8', 
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#38BDF8',
          fill: true,
          tension: 0.3 
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
          label: (context) => `${context.parsed.y} ${producto?.unidad_medida || 'uds'}`
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

  //  Adaptación a las nuevas variables calculadas en el catálogo
  const stockVisual = Number(producto.stockCalculado || producto.stock || 0);
  const estadoVisual = producto.estadoCalculado || producto.estado || 'ok';
  
  const maxCapacidad = 100; // Podrías hacerlo dinámico después
  const porcentajeStock = Math.min((stockVisual / maxCapacidad) * 100, 100);
  const esCritico = estadoVisual === 'low';
  const esModerado = estadoVisual === 'mid';

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-app border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="py-[18px] px-5 border-b border-border bg-app flex items-center justify-between">
          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.08em] text-text-muted font-heading uppercase">
              {producto.categoria}
            </span>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
              <h3 className="font-heading font-extrabold text-[1.1rem] mt-0.5 text-text-primary">
                {producto.nombre}
              </h3>
            </div>
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
              <span className={`text-[0.65rem] font-heading font-bold px-2 py-0.5 rounded-full ${esCritico && stockVisual > 0 ? 'bg-orange-500/10 text-orange-500' : esCritico ? 'bg-red-500/10 text-red-500' : esModerado ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>
                {esCritico ? 'CRÍTICO' : esModerado ? 'MODERADO' : 'NORMAL'}
              </span>
            </div>
            <p className="text-accent font-heading font-extrabold text-3xl">
              {stockVisual.toFixed(2)} <span className="text-base text-text-muted">{producto.unidad_medida}</span>
            </p>
            
            <div className="mt-3 bg-border rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${esCritico ? 'bg-red-500' : esModerado ? 'bg-yellow-500' : 'bg-accent'}`} style={{ width: `${porcentajeStock}%` }}></div>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center py-10">
               <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Mini Stats */}
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

              {/* Últimos Movimientos con Geolocalización */}
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
                            {/*  Etiqueta de Sede y Fecha */}
                            <span className="text-[0.6rem] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded ml-1">
                               {mov.edificio || 'Sede Central'}
                            </span>
                          </p>
                          <p className="text-text-secondary text-[0.7rem] mt-1 truncate w-48" title={mov.observaciones || 'Operación regular'}>
                            {new Date(mov.fecha).toLocaleDateString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} • {mov.tipo === 'ENTRADA' ? 'Abastecimiento' : 'Despacho'}
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
          <div className={`grid gap-2 ${currentUser?.rol === 'ADMIN'? 'grid-cols-3': 'grid-cols-2'}`}>
            {currentUser?.rol === 'ADMIN'&&(
              <button
              onClick={() => onOpenEdit(producto)} 
              className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">
              Ajuste manual
            </button>
            )}
            <button className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">Ver historial</button>
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