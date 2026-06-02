const prisma = require('../config/db');
const { Prisma } = require('@prisma/client');

class MovimientoService {
    async registrarMovimiento({ productoId, cantidad, solicitanteId, encargadoId, embalajeId, tipo, observaciones }) {
        // Validar que el tipo de movimiento sea correcto
        if (!['ENTRADA', 'SALIDA'].includes(tipo)) {
            throw new Error('TIPO_MOVIMIENTO_INVALIDO');
        }

        return await prisma.$transaction(async (tx) => {
            
            // 1. Validar que el producto exista
            const producto = await tx.producto.findUnique({
                where: { id: parseInt(productoId) }
            });
            if (!producto) {
                throw new Error('PRODUCTO_NOT_FOUND');
            }

            // 2. Validar que el usuario (solicitante/proveedor/personal) exista
            const solicitante = await tx.usuario.findUnique({
                where: { id: parseInt(solicitanteId) }
            });
            if (!solicitante) {
                throw new Error('SOLICITANTE_NOT_FOUND');
            }

            // 3. Calcular la cantidad neta usando el factor de conversión del embalaje si existe
            let cantidadNeta = new Prisma.Decimal(cantidad);

            if (embalajeId) {
                const embalaje = await tx.embalaje.findUnique({
                    where: { id: parseInt(embalajeId) }
                });
                if (!embalaje || embalaje.producto_id !== producto.id) {
                    throw new Error('EMBALAJE_INVALIDO');
                }
                // Multiplicamos la cantidad por su factor (Ej: 10 cajas * 48 piezas = 480 piezas netas)
                cantidadNeta = cantidadNeta.mul(embalaje.factor_conversion);
            }

            let nuevoStock;

            // 4. Aplicar lógica dependiendo de si es ENTRADA o SALIDA
            if (tipo === 'SALIDA') {
                // Verificar si hay suficiente stock para la salida
                if (producto.stock_actual.lt(cantidadNeta)) {
                    throw new Error('STOCK_INSUFICIENTE');
                }
                nuevoStock = producto.stock_actual.minus(cantidadNeta);
            } else {
                // Si es ENTRADA, simplemente sumamos al stock actual
                nuevoStock = producto.stock_actual.plus(cantidadNeta);
            }

            // 5. Actualizar el stock del producto
            const productoActualizado = await tx.producto.update({
                where: { id: producto.id },
                data: { stock_actual: nuevoStock }
            });

            // 6. Registrar en la bitácora
            const nuevoMovimiento = await tx.movimiento.create({
                data: {
                    producto_id: producto.id,
                    tipo: tipo, // Guardará 'ENTRADA' o 'SALIDA'
                    cantidad: cantidadNeta,
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
                stock_resultante: productoActualizado.stock_actual,
                cantidad_neta_afectada: cantidadNeta
            };
        });
    }

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