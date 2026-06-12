const reporteService = require('../services/reporteService');

class ReporteController {
    
   // GET /api/reportes/general?periodo=mes&tipo=entrada
    async reporteGeneral(req, res) {
        try {
            const { periodo, tipo } = req.query; 
            
            const reporte = await reporteService.obtenerReporteGeneral(periodo, tipo);
            
            return res.status(200).json({
                filtro_periodo: periodo || 'semana',
                filtro_tipo: tipo ? tipo.toUpperCase() : 'TODOS',
                datos: reporte
            });
        } catch (error) {
            console.error(' Error al generar reporte general:', error);
            return res.status(500).json({ message: 'Error al calcular las estadísticas generales.' });
        }
    }

    // GET /api/reportes/usuario/:id?periodo=dia
    async actividadUsuario(req, res) {
        try {
            const { id } = req.params;
            const { periodo } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'El ID del usuario es obligatorio.' });
            }

            const actividad = await reporteService.obtenerActividadUsuario(id, periodo);
            
            return res.status(200).json({
                usuario_id: id,
                filtro_aplicado: periodo || 'semana',
                total_movimientos: actividad.length,
                datos: actividad
            });
        } catch (error) {
            console.error(` Error al generar reporte del usuario ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error al auditar la actividad del usuario.' });
        }
    }
       
    // GET /api/reportes/insumo/:id?periodo=semana
    async actividadProducto(req, res) {
        try {
            const { id } = req.params;
            const { periodo } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'El ID del producto es obligatorio.' });
            }

            // Llamamos al servicio
            const datosActividad = await reporteService.obtenerActividadProducto(id, periodo);
            
            return res.status(200).json({
                producto_id: id,
                filtro_aplicado: periodo || 'semana',
                estadisticas: datosActividad.kpis,
                movimientos: datosActividad.historial
            });
        } catch (error) {
            console.error(` Error al generar reporte del insumo ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Error al auditar la actividad del insumo.',
                error: error.message 
            });
        }
    }

    // GET /api/reportes/dashboard?mes=06-2026
    async datosDashboard(req, res) {
        try {
            const { mes } = req.query;
            const data = await reporteService.obtenerDashboard(mes);
            return res.status(200).json(data);
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            return res.status(500).json({ message: 'Error interno al generar analíticas.' });
        }
    }

    
}

module.exports = new ReporteController();