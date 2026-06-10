const express = require('express');
const reporteController = require('../controllers/reporteController');

const router = express.Router();

// Ruta para el consumo y entradas global de la facultad
router.get('/general', reporteController.reporteGeneral);

// Ruta para auditar a un usuario específico
router.get('/usuario/:id', reporteController.actividadUsuario);

router.get('/insumo/:id', reporteController.actividadProducto);

module.exports = router;