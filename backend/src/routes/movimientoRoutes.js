const express = require('express');
const movimientoController = require('../controllers/movimientoController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const router = express.Router();

// Cambiamos a un POST unificado en la raíz del módulo
router.post('/', verificarToken, movimientoController.crearMovimiento);
router.get('/historial', movimientoController.obtenerHistorial);
router.put('/:id', verificarToken, checkRole(['ADMIN']), movimientoController.actualizarMovimientos);

module.exports = router;