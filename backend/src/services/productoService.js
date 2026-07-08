const prisma = require('../config/db');
const auditoriaService = require('./auditoriaService');

class ProductoService {
    // Obtener todos los productos con sus opciones de embalaje y existencias por edificio
    async obtenerTodos() {
        return await prisma.producto.findMany({
            include: {
                embalajes: true,
                existencias: true //  Traemos el desglose geográfico
            },
            orderBy: { nombre: 'asc' }
        });
    }

    // Buscar productos de forma predictiva
    async buscarPorTermino(termino) {
        return await prisma.producto.findMany({
            where: {
                OR: [
                    { nombre: { contains: termino, mode: 'insensitive' } },
                    { categoria: { contains: termino, mode: 'insensitive' } }
                ]
            },
            include: {
                embalajes: true,
                existencias: true //  Traemos el desglose
            }
        });
    }

    async obtenerPorId(id) {
        return await prisma.producto.findUnique({
            where: { id: parseInt(id) },
            include: {
                embalajes: true,
                existencias: true //  Traemos el desglose
            }
        });
    }

    // Crear un nuevo insumo y su stock inicial en un edificio
    async crear(datos, usuarioOperadorId) {
        const dataProducto = {
            nombre: datos.nombre,
            categoria: datos.categoria,
            unidad_medida: datos.unidad_medida
        };

        // 🚀 Si el front envía el edificio inicial, lo creamos en cascada
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

        await auditoriaService.registrar(
            usuarioOperadorId,
            'CREAR',
            'PRODUCTO',
            nuevoProducto.id,
            `Se dio de alta al producto: ${nuevoProducto.nombre} (Categoria: ${nuevoProducto.categoria})`
        );
        return nuevoProducto;
    }

    // Actualizar datos de un insumo existente (Stock y mínimo ya no van aquí)
    async actualizar(id, datos, usuarioOperadorId) {
        const productoAEditar = await prisma.producto.findUnique({
            where: { id: parseInt(id)}
        });
        
        if(!productoAEditar){
            throw new Error ('NOT_FOUND');
        }

        const productoEditado = await prisma.producto.update({
            where: { id: parseInt(id) },
            data: {
                nombre: datos.nombre,
                categoria: datos.categoria,
                unidad_medida: datos.unidad_medida
                //  Eliminamos stock_minimo de esta actualización
            }
        });

        await auditoriaService.registrar(
            usuarioOperadorId,
            'EDITAR',
            'PRODUCTO',
            parseInt(id),
            `Se editó al producto: ${productoAEditar.nombre} (id: ${productoAEditar.id}, Categoria: ${productoAEditar.categoria})`
        );
        return productoEditado;
    }

    async eliminar(id, usuarioOperadorId) {
        try {
            const productoABorrar = await prisma.producto.findUnique({
                where: {id: parseInt(id)}
            });
            if(!productoABorrar) throw new Error('NOT_FOUND');
            
            const productoEliminado = await prisma.producto.delete({
                where: { id: parseInt(id) }
            });
            
            await auditoriaService.registrar(
                usuarioOperadorId,
                'ELIMINAR',
                'PRODUCTO',
                parseInt(id),
                `Se eliminó permanentemente al producto: ${productoABorrar.nombre} (ID: ${productoABorrar.id}, Categoria: ${productoABorrar.categoria})`
            );
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
        return await prisma.embalaje.delete({
            where: { id: parseInt(idEmbalaje) }
        });
    }
}

module.exports = new ProductoService();