const prisma = require('../config/db');
const auditoriaService = require('./auditoriaService');

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

    //CRUD de Productos 
    // Crear un nuevo insumo básico
    async crear(datos) {
        return await prisma.producto.create({
            data: {
                nombre: datos.nombre,
                categoria: datos.categoria,
                unidad_medida: datos.unidad_medida,
                stock_actual: datos.stock_actual || 0,
                stock_minimo: datos.stock_minimo || 5
            }
        });
    }

    // Actualizar datos de un insumo existente
    async actualizar(id, datos) {
        return await prisma.producto.update({
            where: { id: parseInt(id) },
            data: {
                nombre: datos.nombre,
                categoria: datos.categoria,
                unidad_medida: datos.unidad_medida,
                stock_minimo: datos.stock_minimo
                // OJO: Normalmente el stock_actual no se actualiza por aquí, 
                // sino a través de transacciones de inventario o ajustes manuales auditados.
            }
        });
    }

    // Eliminar un insumo (Solo si no tiene movimientos asociados)
    async eliminar(id, usuarioOperadorId) {
        try {
            //obtener los datos del producto antes de borrarlo 
            const productoABorrar = await prisma.producto.findUnique({
                where: {id: parseInt(id)}
            });
            if(!productoABorrar){
                throw new Error('NOT_FOUND');
            }
            const productoEliminado = await prisma.producto.delete({
                where: { id: parseInt(id) }
            });
            await auditoriaService.registrar(
                usuarioOperadorId,
                'ELIMINAR',               // Acción
                'PRODUCTO',                // Entidad afectada
                parseInt(id),             // ID de la entidad
                `Se eliminó permanentemente al producto: ${productoABorrar.nombre} (ID: ${productoABorrar.id}, Categoria: ${productoABorrar.categoria})` // Detalles libres
            );
            return productoEliminado
        } catch (error) {
            // P2003 es el código de Prisma para "Fallo de restricción de llave foránea"
            if (error.code === 'P2003') {
                throw new Error('No se puede eliminar el insumo porque tiene movimientos registrados en la bitácora.');
            }
            throw error;
        }
    }

    //Gestion de Embalajes, rutas anidadas 
    // Añadir un nuevo tipo de empaque a un producto
    async agregarEmbalaje(productoId, datos) {
        return await prisma.embalaje.create({
            data: {
                producto_id: parseInt(productoId),
                nombre_embalaje: datos.nombre_embalaje,
                factor_conversion: datos.factor_conversion
            }
        });
    }

    // Eliminar un tipo de empaque (No rompe nada por el onDelete: Cascade)
    async eliminarEmbalaje(idEmbalaje) {
        return await prisma.embalaje.delete({
            where: { id: parseInt(idEmbalaje) }
        });
    }



}

module.exports = new ProductoService();