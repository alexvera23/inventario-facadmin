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
            case 'quincena':
                fecha.setDate(fecha.getDate() - 15);
                break;
            case 'semana':
            default:
                fecha.setDate(fecha.getDate() - 7);
                break;
        }
        return fecha;
    }

    // Reporte 1: Reporte global agrupado por producto y tipo de movimiento
    async obtenerReporteGeneral(periodo = 'semana', tipoFiltro = null) {
        const fechaInicio = this._calcularFechaInicio(periodo);

        const whereCondicion = {
            fecha: { gte: fechaInicio }
        };

        if (tipoFiltro && ['ENTRADA', 'SALIDA'].includes(tipoFiltro.toUpperCase())) {
            whereCondicion.tipo = tipoFiltro.toUpperCase();
        }

        const agrupacion = await prisma.movimiento.groupBy({
            by: ['producto_id', 'tipo'],
            _sum: { cantidad: true },
            where: whereCondicion
        });

        if (agrupacion.length === 0) return [];

        const productosIds = [...new Set(agrupacion.map(item => item.producto_id))];
        const productos = await prisma.producto.findMany({
            where: { id: { in: productosIds } },
            select: { id: true, nombre: true, unidad_medida: true }
        });

        return agrupacion.map(item => {
            const detalleProducto = productos.find(p => p.id === item.producto_id);
            return {
                producto_id: item.producto_id,
                nombre: detalleProducto.nombre,
                unidad: detalleProducto.unidad_medida,
                tipo_movimiento: item.tipo,
                total_acumulado: item._sum.cantidad
            };
        });
    }

    // Reporte 2: Auditoría de un usuario específico
    async obtenerActividadUsuario(usuarioId, periodo = 'semana') {
        const fechaInicio = this._calcularFechaInicio(periodo);

        return await prisma.movimiento.findMany({
            where: {
                fecha: { gte: fechaInicio },
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

    // Reporte 3: Actividad y Movimientos de un Producto en específico
    async obtenerActividadProducto(productoId, periodo = 'semana') {
        const id = parseInt(productoId);
        if (isNaN(id)) throw new Error('El ID del producto debe ser un número válido');

        const fechaInicio = this._calcularFechaInicio(periodo);

        const movimientos = await prisma.movimiento.findMany({
            where: {
                producto_id: id,
                fecha: { gte: fechaInicio }
            },
            include: {
                solicitante: { select: { nombre: true, departamento: true } },
                encargado: { select: { nombre: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        let totalEntradas = 0;
        let totalSalidas = 0;

        const detalleFormateado = movimientos.map(mov => {
            const cantidadNum = Number(mov.cantidad);
            
            if (mov.tipo === 'ENTRADA') totalEntradas += cantidadNum;
            else if (mov.tipo === 'SALIDA') totalSalidas += cantidadNum;

            return {
                id: mov.id,
                tipo: mov.tipo,
                cantidad: cantidadNum,
                edificio: mov.edificio, // 🚀 Añadimos geolocalización al historial
                fecha: mov.fecha,
                observaciones: mov.observaciones,
                involucrado: mov.tipo === 'ENTRADA' ? mov.encargado?.nombre : (mov.solicitante?.nombre || 'Desconocido'),
                departamento: mov.solicitante?.departamento || 'Almacén'
            };
        });

        return {
            kpis: { entradas: totalEntradas, salidas: totalSalidas },
            historial: detalleFormateado
        };
    }
    
    // Reporte 4: Dashboard analítico general
    async obtenerDashboard(mesAño = null) {
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
        }

        const movimientos = await prisma.movimiento.findMany({
            where: { fecha: { gte: fechaInicio, lte: fechaFin } },
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

        //  SOLUCIÓN AL CRASHEO: Consulta cruda ajustada al nuevo modelo multi-sede
        // Cuenta cuántos productos únicos están en nivel crítico (en al menos 1 sede)
        const criticos = await prisma.$queryRaw`
            SELECT DISTINCT producto_id FROM stock_edificio
            WHERE stock_actual <= stock_minimo
        `;
            
        const sortYCortar = (obj, limite = 5) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limite);
        const topInsumosArray = sortYCortar(insumosMap);
        const topDeptosArray = sortYCortar(deptosMap);

        return {
            kpis: {
                salidas: totalSalidas,
                entradas: totalEntradas,
                criticos: criticos.length, // 🚀 Número de insumos en alerta
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