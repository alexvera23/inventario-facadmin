const express = require('express');
const movimientoController = require('../controllers/movimientoController');

const router = express.Router();

// Cambiamos a un POST unificado en la raíz del módulo
router.post('/', movimientoController.crearMovimiento);
router.get('/historial', movimientoController.obtenerHistorial);

module.exports = router;