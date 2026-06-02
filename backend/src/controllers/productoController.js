const productoService = require('../services/productoService');

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
}

module.exports = new ProductoController();