const movimientoService = require('../services/movimientoService');

class MovimientoController {
    // POST /api/movimientos
    async crearMovimiento(req, res) {
        try {
            const { tipo, solicitanteId, encargadoId, observaciones, items, edificio } = req.body;

            // Validaciones estructurales
            if (!tipo || !encargadoId || !items) {
                return res.status(400).json({ 
                    message: 'Los campos tipo, encargadoId e items son estrictamente obligatorios.' 
                });
            }

            const resultado = await movimientoService.registrarMovimientoMasivo({
                tipo: tipo.toUpperCase(),
                solicitanteId,
                encargadoId,
                observaciones,
                items,
                edificio
            });

            return res.status(201).json({
                message: `Transacción de ${tipo.toUpperCase()} procesada con éxito. Se registraron ${resultado.length} movimientos.`,
                data: resultado
            });

        } catch (error) {
            // Manejo de errores dinámicos (Ej: STOCK_INSUFICIENTE:Cloro Líquido)
            if (error.message.startsWith('STOCK_INSUFICIENTE:')) {
                const productoAfectado = error.message.split(':')[1];
                return res.status(422).json({ 
                    message: `Operación cancelada: Stock insuficiente para el insumo "${productoAfectado}".` 
                });
            }
            if (error.message.startsWith('EMBALAJE_INVALIDO:')) {
                const productoAfectado = error.message.split(':')[1];
                return res.status(400).json({ 
                    message: `La regla de embalaje no corresponde al insumo "${productoAfectado}".` 
                });
            }
            if (error.message.startsWith('PRODUCTO_NOT_FOUND:')) {
                return res.status(404).json({ message: 'Uno de los insumos del carrito ya no existe en la base de datos.' });
            }

            // Errores fijos
            switch (error.message) {
                case 'CARRITO_VACIO':
                    return res.status(400).json({ message: 'El carrito de insumos no puede estar vacío.' });
                case 'TIPO_MOVIMIENTO_INVALIDO':
                    return res.status(400).json({ message: 'El tipo de movimiento debe ser ENTRADA o SALIDA.' });
                case 'ENCARGADO_NOT_FOUND':
                    return res.status(404).json({ message: 'El usuario encargado de almacén no es válido.' });
                case 'SOLICITANTE_NOT_FOUND':
                    return res.status(404).json({ message: 'El usuario solicitante no se encuentra registrado.' });
                case 'SOLICITANTE_REQUERIDO_PARA_SALIDA':
                    return res.status(400).json({ message: 'Debe especificar a qué usuario se le están entregando los insumos.' });
                default:
                    console.error('Error crítico en movimientos masivos:', error);
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

    async actualizarMovimientos(req, res){
        try {
            const { id } = req.params;
            
            // Extraemos también el 'tipo' del body
            const { cantidad, tipo, observaciones, solicitante_id } = req.body;
            
            // Extraemos el ID del Admin desde el Token que pasó por el middleware
            const adminId = req.user.id; 

            if (cantidad === undefined || cantidad === null) {
                return res.status(400).json({ message: 'La nueva cantidad es obligatoria.' });
            }

            // Validación de seguridad para el tipo
            if (tipo && !['ENTRADA', 'SALIDA'].includes(tipo.toUpperCase())) {
                return res.status(400).json({ message: 'El tipo de movimiento solo puede ser ENTRADA o SALIDA.' });
            }

            const resultado = await movimientoService.actualizarTransaccion(
                id, 
                cantidad,
                tipo, // Pasamos el nuevo parámetro al servicio
                observaciones, 
                solicitante_id, 
                adminId
            );

            return res.status(200).json({
                message: 'Transacción modificada y stock recalculado con éxito.',
                data: resultado
            });

        } catch (error) {
            if (error.message === 'NOT_FOUND') {
                return res.status(404).json({ message: 'La transacción original no existe.' });
            }
            if (error.message === 'STOCK_RECORD_NOT_FOUND') {
                return res.status(404).json({ message: 'No se encontró el registro de stock para la sede de este movimiento.' });
            }
            if (error.message === 'STOCK_INSUFICIENTE') {
                return res.status(400).json({ message: 'El ajuste dejaría el stock de la sede en números negativos. Verifica la cantidad o el tipo de movimiento.' });
            }
            console.error('[MovimientoController Error]:', error);
            return res.status(500).json({ message: 'Error interno al actualizar la transacción.' });
        }
    }
}

module.exports = new MovimientoController();