const prisma = require('../config/db');

class InventarioService {
    // Obtener los stocks totales filtrados por un edificio en específico
    async obtenerStockPorEdificio(edificio) {
        return await prisma.stockEdificio.findMany({
            where: { edificio: edificio },
            include: {
                producto: {
                    select: { nombre: true, categoria: true, unidad_medida: true }
                }
            }
        });
    }

    // Obtener la bitácora histórica de todas las veces que un producto cayó en desabasto
    async obtenerHistorialCritico() {
        return await prisma.historialStockCritico.findMany({
            orderBy: { fecha: 'desc' },
            include: {
                producto: {
                    select: { nombre: true, unidad_medida: true }
                }
            }
        });
    }
}

module.exports = new InventarioService();