const express = require('express');
const productoController = require('../controllers/productoController');
const router = express.Router();
//Importando los guardias 
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Nota: El orden importa. Colocamos '/buscar' antes de '/:id' 
// para evitar que Express confunda la palabra 'buscar' con un ID numérico.
router.get('/', verificarToken, productoController.obtenerProductos);
router.get('/buscar', verificarToken, productoController.buscarProductos);
router.get('/:id', verificarToken, productoController.obtenerProductoPorId);
// Rutas de Escritura para Productos (POST, PUT, DELETE)
router.post('/', verificarToken,  productoController.crearProducto);
router.put('/:id', verificarToken, checkRole(['ADMIN']), productoController.actualizarProducto);
router.delete('/:id', verificarToken, checkRole(['ADMIN']), productoController.eliminarProducto);

// Rutas Anidadas para Embalajes
router.post('/:id/embalajes', verificarToken,  productoController.agregarEmbalaje);

// Nota: La ruta de eliminar embalaje puede vivir en la raíz de productos por simplicidad
// o puedes aislarla en su propio router si la aplicación crece.
router.delete('/embalajes/:id', verificarToken, checkRole(['ADMIN']), productoController.eliminarEmbalaje);

module.exports = router;