const prisma = require('../config/db');

class ProductoService {
    // Obtener todos los productos con sus opciones de embalaje a granel
    async obtenerTodos() {
        return await prisma.producto.findMany({
            include: {
                embalajes: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });
    }

    // Buscar productos de forma predictiva por nombre o categoría (insensible a mayúsculas/minúsculas)
    async buscarPorTermino(termino) {
        return await prisma.producto.findMany({
            where: {
                OR: [
                    { nombre: { contains: termino, mode: 'insensitive' } },
                    { categoria: { contains: termino, mode: 'insensitive' } }
                ]
            },
            include: {
                embalajes: true
            }
        });
    }

    // Obtener el detalle de un solo producto por su ID
    async obtenerPorId(id) {
        return await prisma.producto.findUnique({
            where: { id: parseInt(id) },
            include: {
                embalajes: true
            }
        });
    }
}

module.exports = new ProductoService();