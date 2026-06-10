const prisma = require('../config/db');

class ReporteService {
    // Función auxiliar para calcular la fecha de inicio según el periodo
    _calcularFechaInicio(periodo) {
        const fecha = new Date();
        switch (periodo) {
            case 'dia':
                fecha.setDate(fecha.getDate() - 1);
                break;
            case 'mes':
                fecha.setMonth(fecha.getMonth() - 1);
                break;
            case 'semana':
            default:
                fecha.setDate(fecha.getDate() - 7);
                break;
        }
        return fecha;
    }

    // Reporte 1: Consumo global agrupado por producto
    // Reporte 1: Reporte global agrupado por producto y tipo de movimiento
    async obtenerReporteGeneral(periodo = 'semana', tipoFiltro = null) {
        const fechaInicio = this._calcularFechaInicio(periodo);

        // Construimos el filtro dinámico
        const whereCondicion = {
            fecha: { gte: fechaInicio }
        };

        // Si se especificó ENTRADA o SALIDA en la petición, lo agregamos al filtro
        if (tipoFiltro && ['ENTRADA', 'SALIDA'].includes(tipoFiltro.toUpperCase())) {
            whereCondicion.tipo = tipoFiltro.toUpperCase();
        }

        // Agrupamos usando dos llaves: por producto y por tipo
        const agrupacion = await prisma.movimiento.groupBy({
            by: ['producto_id', 'tipo'],
            _sum: { cantidad: true },
            where: whereCondicion
        });

        if (agrupacion.length === 0) return [];

        // Extraemos los IDs únicos de los productos para buscar sus nombres
        const productosIds = [...new Set(agrupacion.map(item => item.producto_id))];
        const productos = await prisma.producto.findMany({
            where: { id: { in: productosIds } },
            select: { id: true, nombre: true, unidad_medida: true }
        });

        // Formateamos la respuesta
        return agrupacion.map(item => {
            const detalleProducto = productos.find(p => p.id === item.producto_id);
            return {
                producto_id: item.producto_id,
                nombre: detalleProducto.nombre,
                unidad: detalleProducto.unidad_medida,
                tipo_movimiento: item.tipo, // Indicamos si este total es de ENTRADA o SALIDA
                total_acumulado: item._sum.cantidad
            };
        });
    }

    // Reporte 2: Auditoría de un usuario específico (Qué ha pedido o qué ha surtido)
    async obtenerActividadUsuario(usuarioId, periodo = 'semana') {
        const fechaInicio = this._calcularFechaInicio(periodo);

        return await prisma.movimiento.findMany({
            where: {
                fecha: { gte: fechaInicio },
                // Buscamos si el usuario fue quien solicitó el insumo o quien lo entregó en ventanilla
                OR: [
                    { solicitante_id: parseInt(usuarioId) },
                    { encargado_id: parseInt(usuarioId) }
                ]
            },
            include: {
                producto: { select: { nombre: true, unidad_medida: true } },
                solicitante: { select: { nombre: true, departamento: true } },
                encargado: { select: { nombre: true } }
            },
            orderBy: { fecha: 'desc' }
        });
    }

    

    async obtenerActividadProducto(productoId, periodo = 'semana') {
        const id = parseInt(productoId);
        if (isNaN(id)) throw new Error('El ID del producto debe ser un número válido');

        // 1. Calcular la fecha de inicio según el período solicitado
        const fechaInicio = new Date();
        if (periodo === 'semana') {
            fechaInicio.setDate(fechaInicio.getDate() - 7);
        } else if (periodo === 'quincena') {
            fechaInicio.setDate(fechaInicio.getDate() - 15);
        } else if (periodo === 'mes') {
            fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        } else {
            // Por defecto una semana si mandan basura
            fechaInicio.setDate(fechaInicio.getDate() - 7);
        }

        // 2. Consultar los movimientos en ese rango de fechas
        const movimientos = await prisma.movimiento.findMany({
            where: {
                producto_id: id,
                fecha: {
                    gte: fechaInicio // gte = Greater Than or Equal (Mayor o igual a)
                }
            },
            include: {
                // Traemos los datos de las relaciones para mostrar los nombres en el frontend
                solicitante: {
                    select: { nombre: true, departamento: true }
                },
                encargado: {
                    select: { nombre: true }
                }
            },
            orderBy: {
                fecha: 'desc' // Los más recientes primero
            }
        });

        // 3. Procesar los KPIs (Totales de entradas y salidas para las tarjetas del Drawer)
        let totalEntradas = 0;
        let totalSalidas = 0;

        const detalleFormateado = movimientos.map(mov => {
            const cantidadNum = Number(mov.cantidad);
            
            if (mov.tipo === 'ENTRADA') {
                totalEntradas += cantidadNum;
            } else if (mov.tipo === 'SALIDA') {
                totalSalidas += cantidadNum;
            }

            return {
                id: mov.id,
                tipo: mov.tipo,
                cantidad: cantidadNum,
                fecha: mov.fecha,
                observaciones: mov.observaciones,
                involucrado: mov.tipo === 'ENTRADA' ? mov.encargado?.nombre : (mov.solicitante?.nombre || 'Desconocido'),
                departamento: mov.solicitante?.departamento || 'Almacén'
            };
        });

        // 4. Retornar los datos estructurados
        return {
            kpis: {
                entradas: totalEntradas,
                salidas: totalSalidas
            },
            historial: detalleFormateado
        };
    }
}

module.exports = new ReporteService();