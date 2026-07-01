const usuarioService = require('../services/usuarioService');

class UsuarioController {
    
    // GET /api/usuarios
    async obtenerTodos(req, res) {
        try {
            // Ya no le pasamos parámetros, esta ruta siempre trae el reporte ligero del mes
            const usuarios = await usuarioService.obtenerTodos();
            return res.status(200).json(usuarios);
        } catch (error) {
            console.error('Error al obtener la lista de usuarios:', error);
            return res.status(500).json({ message: 'Error interno al consultar el directorio.' });
        }
    }

    // GET /api/usuarios/:id
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const { periodo } = req.query; // Opcional: ?periodo=mes

            const usuario = await usuarioService.obtenerPorId(id, periodo || 'siempre');
            
            if (!usuario) {
                return res.status(404).json({ message: 'El usuario especificado no existe.' });
            }

            return res.status(200).json(usuario);
        } catch (error) {
            console.error(`Error al obtener detalles del usuario ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error interno al obtener el detalle del usuario.' });
        }
    }

    // POST /api/usuarios
    async crearUsuario(req, res) {
        try {
            const { id_interno, nombre, departamento, rol } = req.body;
            const usuarioOperadorId = req.user.id;

            // Validaciones básicas
            if (!id_interno || !nombre || !departamento) {
                return res.status(400).json({ message: 'Los campos id_interno, nombre y departamento son obligatorios.' });
            }

            const nuevoUsuario = await usuarioService.crear(req.body,usuarioOperadorId);
            return res.status(201).json(nuevoUsuario);
            
        } catch (error) {
            console.error('Error al crear usuario:', error);
            if (error.message === 'UNIQUE_CONSTRAINT') {
                return res.status(409).json({ message: `Ya existe un usuario registrado con el ID interno o matrícula proporcionada.` });
            }
            return res.status(500).json({ message: 'Error interno al registrar al usuario.' });
        }
    }

    // PUT /api/usuarios/:id
    async actualizarUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioOperadorId = req.user.id;
            const usuarioActualizado = await usuarioService.actualizar(id, req.body,usuarioOperadorId);
            return res.status(200).json(usuarioActualizado);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'El usuario especificado no existe.' });
            }
            return res.status(500).json({ message: 'Error interno al actualizar la información del usuario.' });
        }
    }

    // DELETE /api/usuarios/:id
    async eliminarUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioOperadorId = req.user.id;
            await usuarioService.eliminar(id,usuarioOperadorId);
            return res.status(200).json({ message: 'Usuario eliminado correctamente del sistema.' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            
            if (error.message === 'FOREIGN_KEY_CONSTRAINT') {
                return res.status(409).json({ 
                    message: 'No se puede eliminar a este usuario porque ha actuado como Encargado de almacén en transacciones pasadas. Se requiere preservar la auditoría.' 
                });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'El usuario no existe.' });
            }
            
            return res.status(500).json({ message: 'Error interno al eliminar al usuario.' });
        }
    }
}

module.exports = new UsuarioController();