const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Rutas base: /api/usuarios
router.get('/', usuarioController.obtenerTodos);
router.get('/:id', usuarioController.obtenerPorId);
router.post('/', usuarioController.crearUsuario);
router.put('/:id', usuarioController.actualizarUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;