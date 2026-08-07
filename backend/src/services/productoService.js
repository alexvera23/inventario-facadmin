const prisma = require('../config/db');
const auditoriaService = require('./auditoriaService');

class ProductoService {
    //  MÉTODO MAESTRO: Obtener, Buscar, Filtrar y Paginar
    async obtenerTodos({ page = 1, limit = 10, busqueda = '', edificio = 'TODOS' }) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Construcción dinámica de la cláusula WHERE (Búsqueda)
        const where = {};
        if (busqueda.trim()) {
            where.OR = [
                { nombre: { contains: busqueda, mode: 'insensitive' } },
                { categoria: { contains: busqueda, mode: 'insensitive' } }
            ];
        }

        // Si se seleccionó un edificio en específico, optimizamos la consulta para que 
        // la base de datos SOLO nos devuelva el stock de ESE edificio, ahorrando memoria.
        const includeExistencias = edificio !== 'TODOS' 
            ? { where: { edificio: edificio } } 
            : true;

        // Ejecutamos el Count (para saber cuántas páginas hay en total) y el Fetch en paralelo
        const [totalItems, productos] = await Promise.all([
            prisma.producto.count({ where }),
            prisma.producto.findMany({
                where,
                take: limitNum,
                skip: skip,
                orderBy: { nombre: 'asc' },
                include: {
                    embalajes: true,
                    existencias: includeExistencias
                }
            })
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        return {
            data: productos,
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

    async obtenerPorId(id) {
        return await prisma.producto.findUnique({
            where: { id: parseInt(id) },
            include: { embalajes: true, existencias: true }
        });
    }

    async crear(datos, usuarioOperadorId) {
        const dataProducto = {
            nombre: datos.nombre,
            categoria: datos.categoria,
            unidad_medida: datos.unidad_medida
        };

        if (datos.edificio) {
            dataProducto.existencias = {
                create: {
                    edificio: datos.edificio,
                    stock_actual: datos.stock_actual || 0,
                    stock_minimo: datos.stock_minimo || 5
                }
            };
        }

        const nuevoProducto = await prisma.producto.create({
            data: dataProducto,
            include: { existencias: true }
        });

        await auditoriaService.registrar(usuarioOperadorId, 'CREAR', 'PRODUCTO', nuevoProducto.id, `Se dio de alta al producto: ${nuevoProducto.nombre}`);
        return nuevoProducto;
    }

    async actualizar(id, datos, usuarioOperadorId) {
        const productoAEditar = await prisma.producto.findUnique({ where: { id: parseInt(id)} });
        if(!productoAEditar) throw new Error ('NOT_FOUND');

        const productoEditado = await prisma.producto.update({
            where: { id: parseInt(id) },
            data: {
                nombre: datos.nombre,
                categoria: datos.categoria,
                unidad_medida: datos.unidad_medida
            }
        });

        await auditoriaService.registrar(usuarioOperadorId, 'EDITAR', 'PRODUCTO', parseInt(id), `Se editó al producto: ${productoAEditar.nombre}`);
        return productoEditado;
    }

    async eliminar(id, usuarioOperadorId) {
        try {
            const productoABorrar = await prisma.producto.findUnique({ where: {id: parseInt(id)} });
            if(!productoABorrar) throw new Error('NOT_FOUND');
            
            const productoEliminado = await prisma.producto.delete({ where: { id: parseInt(id) } });
            
            await auditoriaService.registrar(usuarioOperadorId, 'ELIMINAR', 'PRODUCTO', parseInt(id), `Se eliminó permanentemente al producto: ${productoABorrar.nombre}`);
            return productoEliminado;
        } catch (error) {
            if (error.code === 'P2003') {
                throw new Error('No se puede eliminar el insumo porque tiene movimientos registrados en la bitácora.');
            }
            throw error;
        }
    }

    async agregarEmbalaje(productoId, datos) {
        return await prisma.embalaje.create({
            data: {
                producto_id: parseInt(productoId),
                nombre_embalaje: datos.nombre_embalaje,
                factor_conversion: datos.factor_conversion
            }
        });
    }

    async eliminarEmbalaje(idEmbalaje) {
        return await prisma.embalaje.delete({ where: { id: parseInt(idEmbalaje) } });
    }
}

module.exports = new ProductoService();