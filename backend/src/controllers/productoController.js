const productoService = require('../services/productoService');
const usuarioService = require('../services/usuarioService');

class ProductoController {
    // GET /api/productos
    async obtenerProductos(req, res) {
        try {
            const productos = await productoService.obtenerTodos();
            return res.status(200).json(productos);
        } catch (error) {
            console.error(' Error al obtener productos:', error);
            return res.status(500).json({ message: 'Error interno del servidor al recuperar el catálogo.' });
        }
    }

    // GET /api/productos/buscar?q=termino
    async buscarProductos(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({ message: 'El parámetro de búsqueda "q" es requerido.' });
            }

            const productos = await productoService.buscarPorTermino(q);
            return res.status(200).json(productos);
        } catch (error) {
            console.error(' Error en la búsqueda de productos:', error);
            return res.status(500).json({ message: 'Error interno del servidor durante la búsqueda.' });
        }
    }

    // GET /api/productos/:id
    async obtenerProductoPorId(req, res) {
        try {
            const { id } = req.params;
            const producto = await productoService.obtenerPorId(id);

            if (!producto) {
                return res.status(404).json({ message: 'Insumo no encontrado en el inventario.' });
            }

            return res.status(200).json(producto);
        } catch (error) {
            console.error(` Error al obtener el producto ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error interno del servidor al recuperar el detalle del insumo.' });
        }
    }

    // POST /api/productos
    async crearProducto(req, res) {
        try {
            const usuarioOperadorId = req.user.id;
            const nuevoProducto = await productoService.crear(req.body,usuarioOperadorId);
            return res.status(201).json(nuevoProducto);
        } catch (error) {
            console.error('Error al crear producto:', error);
            return res.status(500).json({ message: 'Error interno al crear el insumo.' });
        }
    }

    // PUT /api/productos/:id
    async actualizarProducto(req, res) {
        try {
            const { id } = req.params;
            const usuarioOperadorId = req.user.id;
            const productoActualizado = await productoService.actualizar(id, req.body,usuarioOperadorId);
            return res.status(200).json(productoActualizado);
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'El insumo no existe.' });
            }
            return res.status(500).json({ message: 'Error interno al actualizar.' });
        }
    }

    // DELETE /api/productos/:id
    async eliminarProducto(req, res) {
        try {
            const { id } = req.params;
            const usuarioOperadorId = req.user.id
            await productoService.eliminar(id,usuarioOperadorId);
            return res.status(200).json({ message: 'Insumo eliminado correctamente.' });
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            if (error.message.includes('bitácora')) {
                return res.status(409).json({ message: error.message }); // 409 Conflict
            }
            return res.status(500).json({ message: 'Error interno al eliminar el insumo.' });
        }
    }

    // POST /api/productos/:id/embalajes
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

    // DELETE /api/embalajes/:id
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