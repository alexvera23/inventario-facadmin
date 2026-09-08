const reporteService = require('../services/reporteService');

class ReporteController {
    
    // GET /api/reportes/general?periodo=mes&tipo=entrada&edificio=ADM1&page=1&limit=10
    async reporteGeneral(req, res) {
        try {
            const { periodo, tipo, edificio, page, limit } = req.query; 

            const reporte = await reporteService.obtenerReporteGeneral({
                periodo: periodo || 'semana',
                tipoFiltro: tipo,
                edificio: edificio || 'TODOS',
                page,
                limit
            });
            
            return res.status(200).json({
                filtro_periodo: periodo || 'semana',
                filtro_tipo: tipo ? tipo.toUpperCase() : 'TODOS',
                filtro_edificio: edificio || 'TODOS',
                ...reporte // Devuelve { data: [...], pagination: {...} }
            });
        } catch (error) {
            console.error('Error al generar reporte general:', error);
            return res.status(500).json({ message: 'Error al calcular las estadísticas generales.' });
        }
    }

    // GET /api/reportes/usuario/:id?periodo=dia&edificio=ADM1&page=1&limit=10
    async actividadUsuario(req, res) {
        try {
            const { id } = req.params;
            const { periodo, edificio, page, limit } = req.query;

            if (!id) return res.status(400).json({ message: 'El ID del usuario es obligatorio.' });

            const actividad = await reporteService.obtenerActividadUsuario(id, {
                periodo: periodo || 'semana',
                edificio: edificio || 'TODOS',
                page,
                limit
            });
            
            return res.status(200).json({
                usuario_id: id,
                filtro_aplicado: periodo || 'semana',
                ...actividad // Devuelve { data: [...], pagination: {...} }
            });
        } catch (error) {
            console.error(`Error al generar reporte del usuario ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error al auditar la actividad del usuario.' });
        }
    }
       
    // GET /api/reportes/insumo/:id?periodo=semana&edificio=ADM1&page=1&limit=10
    async actividadProducto(req, res) {
        try {
            const { id } = req.params;
            const { periodo, edificio, page, limit } = req.query;

            if (!id) return res.status(400).json({ message: 'El ID del producto es obligatorio.' });

            const datosActividad = await reporteService.obtenerActividadProducto(id, {
                periodo: periodo || 'semana',
                edificio: edificio || 'TODOS',
                page,
                limit
            });
            
            return res.status(200).json({
                producto_id: id,
                filtro_aplicado: periodo || 'semana',
                estadisticas: datosActividad.kpis,
                movimientos: datosActividad.historial // Contiene { data: [...], pagination: {...} }
            });
        } catch (error) {
            console.error(`Error al generar reporte del insumo ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Error al auditar la actividad del insumo.',
                error: error.message 
            });
        }
    }

    // GET /api/reportes/dashboard?mes=06-2026&edificio=ADM1
    async datosDashboard(req, res) {
        try {
            const { mes, edificio } = req.query;
            const data = await reporteService.obtenerDashboard(mes, edificio || 'TODOS');
            return res.status(200).json(data);
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            return res.status(500).json({ message: 'Error interno al generar analíticas.' });
        }
    }
}

module.exports = new ReporteController();