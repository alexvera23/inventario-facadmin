const reporteService = require('../services/reporteService');

class ReporteController {
    // GET /api/reportes/consumo-semanal
    async consumoSemanal(req, res) {
        try {
            const reporte = await reporteService.obtenerConsumoSemanal();
            return res.status(200).json({
                periodo: 'Últimos 7 días',
                datos: reporte
            });
        } catch (error) {
            console.error(' Error al generar reporte semanal:', error);
            return res.status(500).json({ message: 'Error interno al calcular las estadísticas.' });
        }
    }
}

module.exports = new ReporteController();