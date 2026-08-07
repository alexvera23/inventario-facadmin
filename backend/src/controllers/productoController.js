const productoService = require('../services/productoService');

class ProductoController {
    async obtenerProductos(req, res) {
        try {
            const productos = await productoService.obtenerTodos();
            return res.status(200).json(productos);
        } catch (error) {
            console.error(' Error al obtener productos:', error);
            return res.status(500).json({ message: 'Error interno del servidor al recuperar el catálogo.' });
        }
    }

    async buscarProductos(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ message: 'El parámetro de búsqueda "q" es requerido.' });

            const productos = await productoService.buscarPorTermino(q);
            return res.status(200).json(productos);
        } catch (error) {
            console.error(' Error en la búsqueda de productos:', error);
            return res.status(500).json({ message: 'Error interno del servidor durante la búsqueda.' });
        }
    }

    async obtenerProductoPorId(req, res) {
        try {
            const { id } = req.params;
            const producto = await productoService.obtenerPorId(id);

            if (!producto) return res.status(404).json({ message: 'Insumo no encontrado en el inventario.' });
            return res.status(200).json(producto);
        } catch (error) {
            console.error(` Error al obtener el producto ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error al recuperar el detalle del insumo.' });
        }
    }

    async crearProducto(req, res) {
        try {
            const usuarioOperadorId = req.user.id;
            const nuevoProducto = await productoService.crear(req.body, usuarioOperadorId);
            return res.status(201).json(nuevoProducto);
        } catch (error) {
            console.error('Error al crear producto:', error);
            return res.status(500).json({ message: 'Error interno al crear el insumo.' });
        }
    }

    async actualizarProducto(req, res) {
        try {
            const { id } = req.params;
            const usuarioOperadorId = req.user.id;
            const productoActualizado = await productoService.actualizar(id, req.body, usuarioOperadorId);
            return res.status(200).json(productoActualizado);
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            if (error.message === 'NOT_FOUND' || error.code === 'P2025') {
                return res.status(404).json({ message: 'El insumo no existe.' });
            }
            return res.status(500).json({ message: 'Error interno al actualizar.' });
        }
    }

    async eliminarProducto(req, res) {
        try {
            const { id } = req.params;
            const usuarioOperadorId = req.user.id;
            await productoService.eliminar(id, usuarioOperadorId);
            return res.status(200).json({ message: 'Insumo eliminado correctamente.' });
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            if (error.message.includes('bitácora')) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Error interno al eliminar el insumo.' });
        }
    }

    async agregarEmbalaje(req, res) {
        try {
            const { id } = req.params;
            const nuevoEmbalaje = await productoService.agregarEmbalaje(id, req.body);
            return res.status(201).json(nuevoEmbalaje);
        } catch (error) {
            console.error('Error al agregar embalaje:', error);
            return res.status(500).json({ message: 'Error al registrar el embalaje.' });
        }
    }

    async eliminarEmbalaje(req, res) {
        try {
            const { id } = req.params;
            await productoService.eliminarEmbalaje(id);
            return res.status(200).json({ message: 'Embalaje eliminado correctamente.' });
        } catch (error) {
            console.error('Error al eliminar embalaje:', error);
            return res.status(500).json({ message: 'Error interno al eliminar el embalaje.' });
        }
    }
}

module.exports = new ProductoController();