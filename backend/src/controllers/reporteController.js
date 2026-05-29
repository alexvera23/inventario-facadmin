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
}

module.exports = new ReporteController();