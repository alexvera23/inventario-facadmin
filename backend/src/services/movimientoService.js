const prisma = require('../config/db');
const { Prisma } = require('@prisma/client');
const auditoriaService = require('./auditoriaService');

class MovimientoService {
   async registrarMovimientoMasivo({ tipo, solicitanteId, encargadoId, observaciones, items, edificio }) {
        // 1. Validaciones iniciales
        if (!['ENTRADA', 'SALIDA'].includes(tipo)) throw new Error('TIPO_MOVIMIENTO_INVALIDO');
        if (!Array.isArray(items) || items.length === 0) throw new Error('CARRITO_VACIO');
        if (!edificio) throw new Error('EDIFICIO_REQUERIDO'); //  VALIDACIÓN CRÍTICA

        return await prisma.$transaction(async (tx) => {
            
            // 2. Validar que el Encargado exista
            const encargado = await tx.usuario.findUnique({
                where: { id: parseInt(encargadoId) }
            });
            if (!encargado) throw new Error('ENCARGADO_NOT_FOUND');

            // 3. Validar Solicitante
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
            for (const item of items) {
                const producto = await tx.producto.findUnique({
                    where: { id: parseInt(item.productoId) }
                });
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

                //  OBTENER EL STOCK EN EL EDIFICIO SOLICITADO
                let registroStock = await tx.stockEdificio.findUnique({
                    where: {
                        producto_id_edificio: {
                            producto_id: producto.id,
                            edificio: edificio
                        }
                    }
                });

                if (!registroStock && tipo === 'SALIDA') {
                    throw new Error(`STOCK_NO_ENCONTRADO_EN_EDIFICIO:${producto.nombre}`);
                }

                // Si es entrada y el edificio no tenía stock, se crea el registro inicial en cero
                if (!registroStock && tipo === 'ENTRADA') {
                    registroStock = await tx.stockEdificio.create({
                        data: {
                            producto_id: producto.id,
                            edificio: edificio,
                            stock_actual: 0,
                            stock_minimo: 5 // Default configurable posteriormente
                        }
                    });
                }

                let nuevoStock;
                const stockAnterior = registroStock.stock_actual;

                // Lógica de inventario multi-ubicación
                if (tipo === 'SALIDA') {
                    if (stockAnterior.lt(cantidadNeta)) {
                        throw new Error(`STOCK_INSUFICIENTE:${producto.nombre}`);
                    }
                    nuevoStock = stockAnterior.minus(cantidadNeta);
                } else {
                    nuevoStock = stockAnterior.plus(cantidadNeta);
                }

                //  ACTUALIZAR EL STOCK DEL EDIFICIO
                await tx.stockEdificio.update({
                    where: { id: registroStock.id },
                    data: { stock_actual: nuevoStock }
                });

                //  DISPARADOR: ALERTA DE STOCK CRÍTICO
                if (tipo === 'SALIDA') {
                    const stockMinimo = registroStock.stock_minimo;
                    
                    // Condición: Antes estaba BIEN (> min), pero AHORA está CRÍTICO (<= min)
                    if (stockAnterior.gt(stockMinimo) && nuevoStock.lte(stockMinimo)) {
                        await tx.historialStockCritico.create({
                            data: {
                                producto_id: producto.id,
                                edificio: edificio,
                                stock_visto: nuevoStock,
                                stock_min: stockMinimo
                            }
                        });
                    }
                }

                // Registrar la fila en la bitácora incluyendo la sede
                const nuevoMovimiento = await tx.movimiento.create({
                    data: {
                        producto_id: producto.id,
                        tipo: tipo,
                        cantidad: cantidadNeta,
                        edificio: edificio, //  REGISTRO GEOGRÁFICO
                        solicitante_id: solicitante ? solicitante.id : null,
                        encargado_id: encargado.id,
                        observaciones: observaciones || null
                    }
                });

                movimientosRegistrados.push(nuevoMovimiento);
            }

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
    //Editar Transaccion con Compensación 
    async actualizarTransaccion(id, nuevaCantidad, observaciones, solicitanteId, adminId) {
        // Ejecutamos todo dentro de una transacción interactiva de Prisma
        return await prisma.$transaction(async (tx) => {
            
            // 1. Obtener la transacción original
            const movViejo = await tx.movimiento.findUnique({
                where: { id: parseInt(id) },
                include: { producto: true }
            });

            if (!movViejo) throw new Error('NOT_FOUND');

            // 2. Calcular la diferencia matemática
            // Parseamos a Float porque Decimal en Prisma viene como objeto
            const cantidadVieja = parseFloat(movViejo.cantidad);
            const cantidadNueva = parseFloat(nuevaCantidad);
            
            const diferencia = cantidadNueva - cantidadVieja;
            
            // Si es SALIDA, el ajuste en stock es inverso (si resto menos, el stock sube)
            let ajusteStock = movViejo.tipo === 'ENTRADA' ? diferencia : -diferencia;

            // 3. Validar que el ajuste no deje el stock en negativo
            const nuevoStock = parseFloat(movViejo.producto.stock_actual) + ajusteStock;
            if (nuevoStock < 0) {
                throw new Error('STOCK_INSUFICIENTE');
            }

            // 4. Actualizar el registro del movimiento
            const movActualizado = await tx.movimiento.update({
                where: { id: movViejo.id },
                data: {
                    cantidad: cantidadNueva,
                    observaciones: observaciones !== undefined ? observaciones : movViejo.observaciones,
                    solicitante_id: solicitanteId !== undefined ? solicitanteId : movViejo.solicitante_id
                }
            });

            // 5. Actualizar el stock del producto
            if (ajusteStock !== 0) {
                await tx.producto.update({
                    where: { id: movViejo.producto_id },
                    data: {
                        stock_actual: {
                            increment: ajusteStock // Prisma se encarga de la suma o resta segura
                        }
                    }
                });
            }

            // 6.  Registrar en la BITÁCORA DE AUDITORÍA
            // Usamos el auditoriaService inyectando nuestro objeto 'tx' si fuera posible, 
            // pero para simplificar, lo registramos directo en la misma transacción:
            await tx.auditoria.create({
                data: {
                    usuario_id: adminId,
                    accion: 'ACTUALIZAR',
                    entidad: 'MOVIMIENTO',
                    entidad_id: movViejo.id,
                    detalles: `Modificó transacción #${movViejo.id} (${movViejo.tipo} de ${movViejo.producto.nombre}). Cantidad: ${cantidadVieja} -> ${cantidadNueva}. Ajuste en stock: ${ajusteStock > 0 ? '+'+ajusteStock : ajusteStock}.`
                }
            });

            return movActualizado;
        });
    }
}

module.exports = new MovimientoService();