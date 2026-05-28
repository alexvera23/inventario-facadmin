const express = require('express');
const movimientoController = require('../controllers/mysql/../movimientoController');

const router = express.Router();

router.post('/salida', movimientoController.registrarSalida);
router.get('/historial', movimientoController.obtenerHistorial);

module.exports = router;