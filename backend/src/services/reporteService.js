const prisma = require('../config/db');

class ReporteService {
    // Función auxiliar para calcular la fecha de inicio según el periodo
    _calcularFechaInicio(periodo) {
    const fechaInicio = new Date();
    const fechaFin = new Date();

    // 1. Si viene en formato mes calendario "MM-YYYY" (ej. "06-2026")
    if (periodo && periodo.includes('-')) {
        const [mes, año] = periodo.split('-');
        const mesInt = parseInt(mes, 10) - 1;
        const añoInt = parseInt(año, 10);

        fechaInicio.setFullYear(añoInt, mesInt, 1);
        fechaInicio.setHours(0, 0, 0, 0);

        fechaFin.setFullYear(añoInt, mesInt + 1, 0); // Último día del mes
        fechaFin.setHours(23, 59, 59, 999);

        return { fechaInicio, fechaFin };
    }

    // 2. Si viene como rango relativo ("dia", "semana", "quincena", "mes")
    switch (periodo) {
        case 'dia':
            fechaInicio.setDate(fechaInicio.getDate() - 1);
            break;
        case 'quincena':
            fechaInicio.setDate(fechaInicio.getDate() - 15);
            break;
        case 'mes':
            fechaInicio.setMonth(fechaInicio.getMonth() - 1);
            break;
        case 'semana':
        default:
            fechaInicio.setDate(fechaInicio.getDate() - 7);
            break;
    }

    return { fechaInicio, fechaFin: null }; // fechaFin null significa que va hasta el día de hoy
}

    //  Reporte 1: Reporte global agrupado por producto y tipo con paginación y filtro por edificio
    async obtenerReporteGeneral({ periodo = 'semana', tipoFiltro = null, edificio = 'TODOS', page = 1, limit = 10 }) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const fechaInicio = this._calcularFechaInicio(periodo);

        const whereCondicion = {
            fecha: { gte: fechaInicio }
        };

        if (tipoFiltro && ['ENTRADA', 'SALIDA'].includes(tipoFiltro.toUpperCase())) {
            whereCondicion.tipo = tipoFiltro.toUpperCase();
        }

        if (edificio && edificio !== 'TODOS') {
            whereCondicion.edificio = edificio;
        }

        // 1. Agrupamiento en Prisma por producto y tipo
        const agrupacion = await prisma.movimiento.groupBy({
            by: ['producto_id', 'tipo'],
            _sum: { cantidad: true },
            where: whereCondicion
        });

        if (agrupacion.length === 0) {
            return {
                data: [],
                pagination: { totalItems: 0, totalPages: 0, currentPage: pageNum, limit: limitNum, hasNextPage: false, hasPrevPage: false }
            };
        }

        // 2. Traer nombres de productos involucrados aprovechando índices
        const productosIds = [...new Set(agrupacion.map(item => item.producto_id))];
        const productos = await prisma.producto.findMany({
            where: { id: { in: productosIds } },
            select: { id: true, nombre: true, unidad_medida: true, categoria: true }
        });

        // 3. Mapeo y formateo completo
        const resultadoCompleto = agrupacion.map(item => {
            const detalleProducto = productos.find(p => p.id === item.producto_id);
            return {
                producto_id: item.producto_id,
                nombre: detalleProducto ? detalleProducto.nombre : 'Producto Inexistente',
                categoria: detalleProducto ? detalleProducto.categoria : 'General',
                unidad: detalleProducto ? detalleProducto.unidad_medida : 'Pzas',
                tipo_movimiento: item.tipo,
                total_acumulado: Number(item._sum.cantidad || 0)
            };
        });

        // 4. Paginación en memoria del resultado consolidado
        const totalItems = resultadoCompleto.length;
        const totalPages = Math.ceil(totalItems / limitNum);
        const dataPaginada = resultadoCompleto.slice(skip, skip + limitNum);

        return {
            data: dataPaginada,
            pagination: {
                totalItems,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }

    //  Reporte 2: Auditoría de actividad de un usuario específico (Paginado)
    async obtenerActividadUsuario(usuarioId, { periodo = 'semana', page = 1, limit = 10, edificio = 'TODOS' }) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

       const { fechaInicio, fechaFin } = this._calcularFechaInicio(periodo);

        const where = {
        fecha: fechaFin ? { gte: fechaInicio, lte: fechaFin } : { gte: fechaInicio },
        OR: [
            { solicitante_id: parseInt(usuarioId) },
            { encargado_id: parseInt(usuarioId) }
        ]
    };

        if (edificio && edificio !== 'TODOS') {
            where.edificio = edificio;
        }

        const [totalItems, movimientos] = await Promise.all([
            prisma.movimiento.count({ where }),
            prisma.movimiento.findMany({
                where,
                take: limitNum,
                skip: skip,
                include: {
                    producto: { select: { nombre: true, unidad_medida: true } },
                    solicitante: { select: { nombre: true, departamento: true } },
                    encargado: { select: { nombre: true } }
                },
                orderBy: { fecha: 'desc' } // Utiliza el índice de fecha desc
            })
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        const dataFormateada = movimientos.map(mov => ({
            id: mov.id,
            tipo: mov.tipo,
            cantidad: Number(mov.cantidad),
            producto: mov.producto?.nombre || 'Insumo Eliminado',
            unidad: mov.producto?.unidad_medida || 'Pzas',
            edificio: mov.edificio,
            fecha: mov.fecha,
            observaciones: mov.observaciones || 'Sin observaciones',
            solicitante: mov.solicitante?.nombre || 'N/A',
            departamento: mov.solicitante?.departamento || 'General',
            encargado: mov.encargado?.nombre || 'Almacén'
        }));

        return {
            data: dataFormateada,
            pagination: {
                totalItems,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }

    //  Reporte 3: Actividad y Movimientos de un Producto en específico (Paginado + KPIs)
    async obtenerActividadProducto(productoId, { periodo = 'semana', page = 1, limit = 10, edificio = 'TODOS' }) {
        const id = parseInt(productoId);
        if (isNaN(id)) throw new Error('El ID del producto debe ser un número válido');

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const { fechaInicio, fechaFin } = this._calcularFechaInicio(periodo);

        const where = {
            producto_id: id,
            fecha: fechaFin ? { gte: fechaInicio, lte: fechaFin } : { gte: fechaInicio }
        };

        if (edificio && edificio !== 'TODOS') {
            where.edificio = edificio;
        }

        // 1. Calculamos Totales (KPIs) usando agregación rápida en Prisma
        const [agregadoEntradas, agregadoSalidas] = await Promise.all([
            prisma.movimiento.aggregate({
                _sum: { cantidad: true },
                where: { ...where, tipo: 'ENTRADA' }
            }),
            prisma.movimiento.aggregate({
                _sum: { cantidad: true },
                where: { ...where, tipo: 'SALIDA' }
            })
        ]);

        const totalEntradas = Number(agregadoEntradas._sum.cantidad || 0);
        const totalSalidas = Number(agregadoSalidas._sum.cantidad || 0);

        // 2. Consulta Paginada del Historial
        const [totalItems, movimientos] = await Promise.all([
            prisma.movimiento.count({ where }),
            prisma.movimiento.findMany({
                where,
                take: limitNum,
                skip: skip,
                include: {
                    solicitante: { select: { nombre: true, departamento: true } },
                    encargado: { select: { nombre: true } }
                },
                orderBy: { fecha: 'desc' }
            })
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        const detalleFormateado = movimientos.map(mov => ({
            id: mov.id,
            tipo: mov.tipo,
            cantidad: Number(mov.cantidad),
            edificio: mov.edificio,
            fecha: mov.fecha,
            observaciones: mov.observaciones,
            involucrado: mov.tipo === 'ENTRADA' ? mov.encargado?.nombre : (mov.solicitante?.nombre || 'Desconocido'),
            departamento: mov.solicitante?.departamento || 'Almacén'
        }));

        return {
            kpis: { entradas: totalEntradas, salidas: totalSalidas },
            historial: {
                data: detalleFormateado,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            }
        };
    }
    
    //  Reporte 4: Dashboard analítico general (Multi-sede y Optimización Native Prisma)
    async obtenerDashboard(mesAño = null, edificio = 'TODOS') {
        const fechaInicio = new Date();
        const fechaFin = new Date();
        
        if (mesAño) {
            const [mes, año] = mesAño.split('-');
            fechaInicio.setFullYear(parseInt(año), parseInt(mes) - 1, 1);
            fechaInicio.setHours(0, 0, 0, 0);
            
            fechaFin.setFullYear(parseInt(año), parseInt(mes), 0);
            fechaFin.setHours(23, 59, 59, 999);
        } else {
            fechaInicio.setDate(1); 
            fechaInicio.setHours(0, 0, 0, 0);
        }

        const whereMovimientos = {
            fecha: { gte: fechaInicio, lte: fechaFin }
        };

        if (edificio && edificio !== 'TODOS') {
            whereMovimientos.edificio = edificio;
        }

        const movimientos = await prisma.movimiento.findMany({
            where: whereMovimientos,
            include: { producto: true, solicitante: true }
        });

        let totalEntradas = 0;
        let totalSalidas = 0;
        const usuariosUnicos = new Set();
        const categoriasMap = {};
        const insumosMap = {};
        const deptosMap = {};
        const tendenciaMap = {}; 

        movimientos.forEach(mov => {
            const qty = Number(mov.cantidad);
            const diaStr = new Date(mov.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

            if (!tendenciaMap[diaStr]) tendenciaMap[diaStr] = { entradas: 0, salidas: 0 };

            if (mov.tipo === 'ENTRADA') {
                totalEntradas += qty;
                tendenciaMap[diaStr].entradas += qty;
            } else if (mov.tipo === 'SALIDA') {
                totalSalidas += qty;
                tendenciaMap[diaStr].salidas += qty;

                if (mov.solicitante_id) usuariosUnicos.add(mov.solicitante_id);

                const cat = mov.producto?.categoria || 'Sin Categoría';
                categoriasMap[cat] = (categoriasMap[cat] || 0) + qty;

                const prod = mov.producto?.nombre || 'Desconocido';
                insumosMap[prod] = (insumosMap[prod] || 0) + qty;

                const depto = mov.solicitante?.departamento || 'No especificado';
                deptosMap[depto] = (deptosMap[depto] || 0) + 1; 
            }
        });

        //  Conteo ultra rápido de productos críticos utilizando Prisma ORM nativo
        const whereStockCritico = {
            stock_actual: { lte: prisma.stockEdificio.fields.stock_minimo }
        };

        if (edificio && edificio !== 'TODOS') {
            whereStockCritico.edificio = edificio;
        }

        const criticosGroup = await prisma.stockEdificio.groupBy({
            by: ['producto_id'],
            where: whereStockCritico
        });

        const sortYCortar = (obj, limite = 5) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limite);
        const topInsumosArray = sortYCortar(insumosMap);
        const topDeptosArray = sortYCortar(deptosMap);

        return {
            kpis: {
                salidas: totalSalidas,
                entradas: totalEntradas,
                criticos: criticosGroup.length, // Número de insumos únicos en alerta
                usuariosActivos: usuariosUnicos.size
            },
            tendencia: {
                labels: Object.keys(tendenciaMap),
                entradas: Object.values(tendenciaMap).map(d => d.entradas),
                salidas: Object.values(tendenciaMap).map(d => d.salidas)
            },
            categorias: {
                labels: Object.keys(categoriasMap),
                data: Object.values(categoriasMap)
            },
            topInsumos: {
                labels: topInsumosArray.map(i => i[0]),
                data: topInsumosArray.map(i => i[1])
            },
            departamentos: {
                labels: topDeptosArray.map(d => d[0]),
                data: topDeptosArray.map(d => d[1])
            }
        };
    }
}

module.exports = new ReporteService();