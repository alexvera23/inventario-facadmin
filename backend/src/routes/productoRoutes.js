const express = require('express');
const productoController = require('../controllers/productoController');

const router = express.Router();

// Nota: El orden importa. Colocamos '/buscar' antes de '/:id' 
// para evitar que Express confunda la palabra 'buscar' con un ID numérico.
router.get('/', productoController.obtenerProductos);
router.get('/buscar', productoController.buscarProductos);
router.get('/:id', productoController.obtenerProductoPorId);
// Rutas de Escritura para Productos (POST, PUT, DELETE)
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

// Rutas Anidadas para Embalajes
router.post('/:id/embalajes', productoController.agregarEmbalaje);

// Nota: La ruta de eliminar embalaje puede vivir en la raíz de productos por simplicidad
// o puedes aislarla en su propio router si la aplicación crece.
router.delete('/embalajes/:id', productoController.eliminarEmbalaje);

module.exports = router;