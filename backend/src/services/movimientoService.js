const prisma = require('../config/db');
const { Prisma } = require('@prisma/client');

class MovimientoService {
   async registrarMovimientoMasivo({ tipo, solicitanteId, encargadoId, observaciones, items }) {
        // 1. Validaciones iniciales
        if (!['ENTRADA', 'SALIDA'].includes(tipo)) throw new Error('TIPO_MOVIMIENTO_INVALIDO');
        if (!Array.isArray(items) || items.length === 0) throw new Error('CARRITO_VACIO');

        return await prisma.$transaction(async (tx) => {
            
            // 2. Validar que el Encargado (El que despacha/recibe) exista
            const encargado = await tx.usuario.findUnique({
                where: { id: parseInt(encargadoId) }
            });
            if (!encargado) throw new Error('ENCARGADO_NOT_FOUND');

            // 3. Validar Solicitante (Es obligatorio si es SALIDA, pero opcional en ENTRADA)
            let solicitante = null;
            if (solicitanteId) {
                solicitante = await tx.usuario.findUnique({
                    where: { id: parseInt(solicitanteId) }
                });
                if (!solicitante) throw new Error('SOLICITANTE_NOT_FOUND');
            } else if (tipo === 'SALIDA') {
                throw new Error('SOLICITANTE_REQUERIDO_PARA_SALIDA');
            }

            const movimientosRegistrados = [];

            // 4. Bucle para procesar cada artículo del carrito
            // Usamos for...of porque await funciona perfectamente dentro de él para mantener la secuencia
            for (const item of items) {
                const producto = await tx.producto.findUnique({
                    where: { id: parseInt(item.productoId) }
                });
                
                // Le pegamos el ID al error para que el Front sepa cuál falló
                if (!producto) throw new Error(`PRODUCTO_NOT_FOUND:${item.productoId}`);

                // Calcular la cantidad neta
                let cantidadNeta = new Prisma.Decimal(item.cantidad);

                if (item.embalajeId) {
                    const embalaje = await tx.embalaje.findUnique({
                        where: { id: parseInt(item.embalajeId) }
                    });
                    if (!embalaje || embalaje.producto_id !== producto.id) {
                        throw new Error(`EMBALAJE_INVALIDO:${producto.nombre}`);
                    }
                    cantidadNeta = cantidadNeta.mul(embalaje.factor_conversion);
                }

                let nuevoStock;

                // Lógica de inventario por artículo
                if (tipo === 'SALIDA') {
                    if (producto.stock_actual.lt(cantidadNeta)) {
                        // Enviamos el nombre del producto para una alerta amigable
                        throw new Error(`STOCK_INSUFICIENTE:${producto.nombre}`);
                    }
                    nuevoStock = producto.stock_actual.minus(cantidadNeta);
                } else {
                    nuevoStock = producto.stock_actual.plus(cantidadNeta);
                }

                // Actualizar el stock de este producto
                await tx.producto.update({
                    where: { id: producto.id },
                    data: { stock_actual: nuevoStock }
                });

                // Registrar la fila en la bitácora
                const nuevoMovimiento = await tx.movimiento.create({
                    data: {
                        producto_id: producto.id,
                        tipo: tipo,
                        cantidad: cantidadNeta,
                        solicitante_id: solicitante ? solicitante.id : null,
                        encargado_id: encargado.id,
                        observaciones: observaciones || null
                    }
                });

                movimientosRegistrados.push(nuevoMovimiento);
            }

            // Si el bucle termina sin errores, Prisma hace el COMMIT automáticamente
            return movimientosRegistrados;
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