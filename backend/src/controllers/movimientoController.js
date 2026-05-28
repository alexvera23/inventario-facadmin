const movimientoService = require('../services/movimientoService');

class MovimientoController {
    // POST /api/movimientos/salida
    async registrarSalida(req, res) {
        try {
            const { productoId, cantidad, solicitanteId, encargadoId, embalajeId, observaciones } = req.body;

            // Validación básica de campos obligatorios
            if (!productoId || !cantidad || !solicitanteId || !encargadoId) {
                return res.status(400).json({ 
                    message: 'Los campos productoId, cantidad, solicitanteId y encargadoId son estrictamente obligatorios.' 
                });
            }

            if (parseFloat(cantidad) <= 0) {
                return res.status(400).json({ message: 'La cantidad debe ser un número mayor a cero.' });
            }

            const resultado = await movimientoService.registrarSalida({
                productoId,
                cantidad,
                solicitanteId,
                encargadoId,
                embalajeId,
                observaciones
            });

            return res.status(201).json({
                message: 'Salida de material registrada exitosamente en ventanilla.',
                data: resultado
            });

        } catch (error) {
            // Manejo de errores controlados de las reglas de negocio
            switch (error.message) {
                case 'PRODUCTO_NOT_FOUND':
                    return res.status(404).json({ message: 'El insumo especificado no existe en el catálogo.' });
                case 'SOLICITANTE_NOT_FOUND':
                    return res.status(404).json({ message: 'El solicitante no se encuentra registrado en el sistema.' });
                case 'EMBALAJE_INVALIDO':
                    return res.status(400).json({ message: 'La regla de empaque/granel seleccionada no corresponde a este producto.' });
                case 'STOCK_INSUFICIENTE':
                    return res.status(422).json({ message: 'Operación denegada: Inventario insuficiente para cubrir la solicitud.' });
                default:
                    console.error('❌ Error crítico al procesar salida:', error);
                    return res.status(500).json({ message: 'Error interno en el motor transaccional del servidor.' });
            }
        }
    }

    // GET /api/movimientos/historial
    async obtenerHistorial(req, res) {
        try {
            const historial = await movimientoService.obtenerHistorial();
            return res.status(200).json(historial);
        } catch (error) {
            console.error('❌ Error al recuperar bitácora:', error);
            return res.status(500).json({ message: 'Error al recuperar el historial de movimientos.' });
        }
    }
}

module.exports = new MovimientoController();