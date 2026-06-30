const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Endpoint: GET /api/auditorias
//BLINDAJE: Solo administradores pueden ver quién hizo qué
router.get('/', verificarToken, checkRole(['ADMIN']), auditoriaController.obtenerHistorial);

module.exports = router;