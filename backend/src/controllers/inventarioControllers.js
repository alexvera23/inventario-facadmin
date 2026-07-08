const inventarioService = require('../services/inventarioService');

class InventarioController {
    async obtenerStockEdificio(req, res) {
        try {
            const { edificio } = req.params;
            if (!edificio) return res.status(400).json({ message: 'El nombre del edificio es requerido.' });
            
            const stock = await inventarioService.obtenerStockPorEdificio(edificio);
            return res.status(200).json(stock);
        } catch (error) {
            console.error('Error al obtener stock por edificio:', error);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    async obtenerAlertasCriticas(req, res) {
        try {
            const alertas = await inventarioService.obtenerHistorialCritico();
            return res.status(200).json(alertas);
        } catch (error) {
            console.error('Error al obtener bitácora de desabasto:', error);
            return res.status(500).json({ message: 'Error al recuperar alertas críticas.' });
        }
    }
}

module.exports = new InventarioController();