const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioControllers');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/edificio/:edificio', verificarToken, inventarioController.obtenerStockEdificio);
router.get('/alertas-criticas', verificarToken, inventarioController.obtenerAlertasCriticas);

module.exports = router;