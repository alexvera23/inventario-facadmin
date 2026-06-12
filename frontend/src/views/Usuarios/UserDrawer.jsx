import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registro de los componentes de la gráfica de Barras
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// Función auxiliar para calcular tiempo relativo ("Hace 2 horas")
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 60) return `Hace ${diffInMins} min`;
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  if (diffInDays === 1) return `Ayer`;
  return `Hace ${diffInDays} días`;
};

export default function UserDrawer({ isOpen, onClose, usuario, onOpenReport }) {
  // --------------------------------------------------------
  // ESTADOS DEL DRAWER
  // --------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [detalleUsuario, setDetalleUsuario] = useState(null);
  const [chartData, setChartData] = useState(null);

  // Consultar historial al abrir el Drawer
  useEffect(() => {
    if (isOpen && usuario?.id) {
      fetchDetallesUsuario();
    } else {
      setDetalleUsuario(null);
      setChartData(null);
    }
  }, [isOpen, usuario]);

  const fetchDetallesUsuario = async () => {
    setLoading(true);
    try {
      // Obtenemos el perfil con TODO su historial histórico (?periodo=siempre es el default)
      const response = await api.get(`/usuarios/${usuario.id}`);
      setDetalleUsuario(response.data);
      generarDatosGrafica(response.data.historial_solicitudes);
    } catch (error) {
      console.error('Error al obtener los detalles del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // LÓGICA DE LA GRÁFICA (Solicitudes Diarias - Últimos 7 días)
  // --------------------------------------------------------
  const generarDatosGrafica = (movimientos) => {
    const labels = [];
    const dataPoints = [];

    // Generamos las etiquetas de los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      labels.push(fecha.toLocaleDateString('es-MX', { weekday: 'short' })); // 'lun', 'mar'

      // Sumamos la cantidad absoluta de insumos que solicitó ESE DÍA
      let totalPedidosEseDia = 0;
      const movsDelDia = movimientos.filter(m => new Date(m.fecha).toDateString() === fecha.toDateString());
      
      movsDelDia.forEach(m => {
        // En usuarios, nos importan sus solicitudes (generalmente salidas de almacén)
        totalPedidosEseDia += Math.abs(Number(m.cantidad));
      });

      dataPoints.push(totalPedidosEseDia);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Insumos Solicitados',
          data: dataPoints,
          backgroundColor: '#4ADE80', // Color verde distintivo para usuarios
          borderRadius: 4,
          borderSkipped: false,
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
          label: (context) => `${context.parsed.y} insumos`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748B' } },
      y: { grid: { color: 'rgba(100, 116, 139, 0.1)', drawBorder: false }, ticks: { font: { size: 10 }, color: '#64748B', stepSize: 1 }, beginAtZero: true }
    }
  };

  // --------------------------------------------------------
  // CÁLCULOS DERIVADOS (KPIs)
  // --------------------------------------------------------
  // Calculamos cuántos productos únicos ha pedido
  const insumosDistintos = detalleUsuario 
    ? new Set(detalleUsuario.historial_solicitudes.map(m => m.producto)).size 
    : 0;

  // Filtramos cuántos movimientos se hicieron específicamente en los últimos 7 días
  const movsEstaSemana = detalleUsuario 
    ? detalleUsuario.historial_solicitudes.filter(m => {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return new Date(m.fecha) >= hace7Dias;
      }).length
    : 0;

  // --------------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------------
  if (!usuario) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-[380px] bg-app border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="py-[18px] px-5 border-b border-border bg-app flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-[1rem] text-text-primary">
            Detalle de Usuario
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-inputBg text-text-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          
          {/* Perfil Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#059669] text-white flex items-center justify-center font-heading font-extrabold text-xl flex-shrink-0 shadow-md">
              {usuario.initials}
            </div>
            <div>
              <p className="font-heading font-extrabold text-[1.1rem] text-text-primary">{usuario.nombre}</p>
              <p className="text-[0.8rem] text-text-muted">{usuario.departamento} · {usuario.edificio}</p>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold font-heading uppercase ${usuario.activo ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center py-10">
               <div className="w-8 h-8 border-4 border-[#4ADE80] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* KPIs del Usuario */}
              <div className="bg-inputBg border border-border rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div className="text-center">
                  <p className="font-heading font-extrabold text-[1.4rem] text-accent leading-none">
                    {detalleUsuario?.total_solicitudes || 0}
                  </p>
                  <p className="text-[0.65rem] text-text-muted font-bold mt-1.5 uppercase tracking-wider">Total Histórico</p>
                </div>
                <div className="text-center">
                  <p className="font-heading font-extrabold text-[1.4rem] text-[#4ADE80] leading-none">
                    {movsEstaSemana}
                  </p>
                  <p className="text-[0.65rem] text-text-muted font-bold mt-1.5 uppercase tracking-wider">Esta Semana</p>
                </div>
                <div className="text-center">
                  <p className="font-heading font-extrabold text-[1.4rem] text-text-secondary leading-none">
                    {insumosDistintos}
                  </p>
                  <p className="text-[0.65rem] text-text-muted font-bold mt-1.5 uppercase tracking-wider">Insumos Dist.</p>
                </div>
              </div>

              {/* Gráfica de Barras */}
              <div>
                <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-2">Comportamiento (7 días)</p>
                <div className="h-[120px] w-full bg-card border border-border rounded-xl p-2 relative shadow-sm">
                  {chartData ? <Bar data={chartData} options={chartOptions} /> : <span className="text-xs text-text-muted absolute inset-0 flex items-center justify-center">Generando gráfica...</span>}
                </div>
              </div>

              {/* Historial Reciente */}
              <div>
                <p className="text-[0.7rem] font-bold text-text-muted font-heading uppercase tracking-wider mb-3">Historial reciente</p>
                <div className="flex flex-col gap-0">
                  {!detalleUsuario || detalleUsuario.historial_solicitudes.length === 0 ? (
                    <div className="text-center p-4 border border-border rounded-lg bg-inputBg text-text-muted text-xs">
                      Este usuario no ha solicitado insumos.
                    </div>
                  ) : (
                    detalleUsuario.historial_solicitudes.slice(0, 5).map((mov) => (
                      <div key={mov.movimiento_id} className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-b-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${mov.tipo === 'ENTRADA' ? 'bg-[#4ADE80]' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-[0.8rem] font-semibold text-text-primary truncate w-48" title={mov.producto}>{mov.producto}</p>
                          <p className="text-[0.7rem] text-text-muted">{timeAgo(mov.fecha)} · {mov.tipo === 'ENTRADA' ? 'Devolución' : 'Ventanilla'}</p>
                        </div>
                        <span className={`text-[0.8rem] font-bold font-mono ${mov.tipo === 'ENTRADA' ? 'text-[#4ADE80]' : 'text-red-500'}`}>
                          {mov.tipo === 'ENTRADA' ? '+' : '-'}{Math.abs(mov.cantidad).toFixed(2)} <span className="text-[0.6rem]">{mov.unidad}</span>
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
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-inputBg border border-border text-text-primary hover:border-accent rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-colors">
              Editar usuario
            </button>
            <button className="bg-text-primary text-app hover:opacity-85 rounded-lg font-heading font-semibold text-[0.75rem] py-2 transition-opacity dark:bg-accent dark:text-[#002D4C]">
              Ver historial
            </button>
          </div>
          <button 
            onClick={() => onOpenReport(usuario)}
            className="w-full mt-1 bg-card border-2 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10 rounded-lg font-heading font-semibold text-[0.8rem] py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Generar reporte de este usuario
          </button>
        </div>

      </aside>
    </>
  );
}