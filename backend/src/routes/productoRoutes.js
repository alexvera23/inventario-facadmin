const express = require('express');
const productoController = require('../controllers/productoController');

const router = express.Router();

// Nota: El orden importa. Colocamos '/buscar' antes de '/:id' 
// para evitar que Express confunda la palabra 'buscar' con un ID numérico.
router.get('/', productoController.obtenerProductos);
router.get('/buscar', productoController.buscarProductos);
router.get('/:id', productoController.obtenerProductoPorId);

module.exports = router;