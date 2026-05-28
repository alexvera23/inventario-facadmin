const express = require('express');
const reporteController = require('../controllers/reporteController');

const router = express.Router();

router.get('/consumo-semanal', reporteController.consumoSemanal);

module.exports = router;