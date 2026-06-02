const movimientoService = require('../services/movimientoService');

class MovimientoController {
    // POST /api/movimientos
    async crearMovimiento(req, res) {
        try {
            const { productoId, cantidad, solicitanteId, encargadoId, embalajeId, tipo, observaciones } = req.body;

            // Validaciones obligatorias generales
            if (!productoId || !cantidad || !solicitanteId || !encargadoId || !tipo) {
                return res.status(400).json({ 
                    message: 'Los campos productoId, cantidad, solicitanteId, encargadoId y tipo son estrictamente obligatorios.' 
                });
            }

            if (parseFloat(cantidad) <= 0) {
                return res.status(400).json({ message: 'La cantidad debe ser un número mayor a cero.' });
            }

            const resultado = await movimientoService.registrarMovimiento({
                productoId,
                cantidad,
                solicitanteId,
                encargadoId,
                embalajeId,
                tipo: tipo.toUpperCase(), // Asegura que vaya en mayúsculas
                observaciones
            });

            return res.status(201).json({
                message: `Movimiento de tipo ${tipo.toUpperCase()} registrado exitosamente.`,
                data: resultado
            });

        } catch (error) {
            switch (error.message) {
                case 'TIPO_MOVIMIENTO_INVALIDO':
                    return res.status(400).json({ message: 'El tipo de movimiento debe ser ENTRADA o SALIDA.' });
                case 'PRODUCTO_NOT_FOUND':
                    return res.status(404).json({ message: 'El insumo especificado no existe.' });
                case 'SOLICITANTE_NOT_FOUND':
                    return res.status(404).json({ message: 'El usuario asociado no se encuentra registrado.' });
                case 'EMBALAJE_INVALIDO':
                    return res.status(400).json({ message: 'La regla de embalaje no corresponde a este producto.' });
                case 'STOCK_INSUFICIENTE':
                    return res.status(422).json({ message: 'Operación denegada: Inventario insuficiente para la salida.' });
                default:
                    console.error(' Error crítico en movimientos:', error);
                    return res.status(500).json({ message: 'Error interno en el servidor.' });
            }
        }
    }

    // GET /api/movimientos/historial
    async obtenerHistorial(req, res) {
        try {
            const historial = await movimientoService.obtenerHistorial();
            return res.status(200).json(historial);
        } catch (error) {
            console.error(' Error al recuperar bitácora:', error);
            return res.status(500).json({ message: 'Error al recuperar el historial.' });
        }
    }
}

module.exports = new MovimientoController();