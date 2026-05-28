const prisma = require('../config/db');
const { Prisma } = require('@prisma/client');

class MovimientoService {
    async registrarSalida({ productoId, cantidad, solicitanteId, encargadoId, embalajeId, observaciones }) {
        // Ejecutamos todo dentro de una transacción para evitar inconsistencias
        return await prisma.$transaction(async (tx) => {
            
            // 1. Validar que el producto exista
            const producto = await tx.producto.findUnique({
                where: { id: parseInt(productoId) }
            });
            if (!producto) {
                throw new Error('PRODUCTO_NOT_FOUND');
            }

            // 2. Validar que el solicitante exista
            const solicitante = await tx.usuario.findUnique({
                where: { id: parseInt(solicitanteId) }
            });
            if (!solicitante) {
                throw new Error('SOLICITANTE_NOT_FOUND');
            }

            // 3. Calcular la cantidad real a descontar basándose en si se usó un embalaje
            let cantidadADescontar = new Prisma.Decimal(cantidad);

            if (embalajeId) {
                const embalaje = await tx.embalaje.findUnique({
                    where: { id: parseInt(embalajeId) }
                });
                if (!embalaje || embalaje.producto_id !== producto.id) {
                    throw new Error('EMBALAJE_INVALIDO');
                }
                // Multiplicamos la cantidad por el factor (Ej: 2 cajas * 48 piezas = 96 piezas)
                cantidadADescontar = cantidadADescontar.mul(embalaje.factor_conversion);
            }

            // 4. Verificar si hay stock suficiente usando los métodos de Prisma.Decimal
            if (producto.stock_actual.lt(cantidadADescontar)) {
                throw new Error('STOCK_INSUFICIENTE');
            }

            // 5. Descontar del stock actual del producto
            const productoActualizado = await tx.producto.update({
                where: { id: producto.id },
                data: {
                    stock_actual: producto.stock_actual.minus(cantidadADescontar)
                }
            });

            // 6. Registrar el movimiento en la bitácora inmutable
            const nuevoMovimiento = await tx.movimiento.create({
                data: {
                    producto_id: producto.id,
                    tipo: 'SALIDA',
                    cantidad: cantidadADescontar,
                    solicitante_id: solicitante.id,
                    encargado_id: parseInt(encargadoId),
                    observaciones: observaciones || null
                },
                include: {
                    producto: true,
                    solicitante: true
                }
            });

            return {
                movimiento: nuevoMovimiento,
                stock_restante: productoActualizado.stock_actual
            };
        });
    }

    // Obtener todo el historial de la ventanilla (Útil para auditorías)
    async obtenerHistorial() {
        return await prisma.movimiento.findMany({
            include: {
                producto: true,
                solicitante: true,
                encargado: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });
    }
}

module.exports = new MovimientoService();