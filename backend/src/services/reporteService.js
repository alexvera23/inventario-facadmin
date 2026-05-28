const prisma = require('../config/db');

class ReporteService {
    async obtenerConsumoSemanal() {
        // 1. Calcular la fecha de hace 7 días
        const haceUnaSemana = new Date();
        haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

        // 2. Agrupar y sumar (Solo SALIDAS)
        const agrupacion = await prisma.movimiento.groupBy({
            by: ['producto_id'],
            _sum: {
                cantidad: true
            },
            where: {
                tipo: 'SALIDA',
                fecha: {
                    gte: haceUnaSemana // gte = Greater Than or Equal (Mayor o igual a)
                }
            }
        });

        // Si no hubo consumos esta semana, devolvemos un arreglo vacío
        if (agrupacion.length === 0) return [];

        // 3. Obtener los nombres y unidades de los productos involucrados
        const productosIds = agrupacion.map(item => item.producto_id);
        const productos = await prisma.producto.findMany({
            where: { id: { in: productosIds } },
            select: { id: true, nombre: true, unidad_medida: true }
        });

        // 4. Fusionar los datos para una respuesta amigable
        return agrupacion.map(item => {
            const detalleProducto = productos.find(p => p.id === item.producto_id);
            return {
                producto_id: item.producto_id,
                nombre: detalleProducto.nombre,
                unidad: detalleProducto.unidad_medida,
                total_consumido: item._sum.cantidad
            };
        });
    }
}

module.exports = new ReporteService();