const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
//Importando los guardias 
const { verificarToken } = require ('../middlewares/authMiddleware');
const { checkRole } = require ('../middlewares/roleMiddleware');

// Rutas base: /api/usuarios
router.get('/', verificarToken, usuarioController.obtenerTodos);
router.get('/:id', verificarToken, usuarioController.obtenerPorId);
router.post('/', verificarToken, checkRole(['ADMIN']), usuarioController.crearUsuario);
router.put('/:id', verificarToken, checkRole(['ADMIN']), usuarioController.actualizarUsuario);
router.delete('/:id', verificarToken, checkRole(['ADMIN']), usuarioController.eliminarUsuario);

module.exports = router;