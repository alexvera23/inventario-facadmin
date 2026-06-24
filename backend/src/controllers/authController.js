const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { id_interno, password } = req.body;

    // Validación básica de entrada
    if (!id_interno || !password) {
      return res.status(400).json({ 
        message: 'La matrícula (ID Interno) y la contraseña son obligatorias.' 
      });
    }

    // Invocamos a la capa de servicio
    const result = await authService.verificarCredenciales(id_interno, password);

    // Si todo sale bien, respondemos con el Token
    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    // Manejador de Errores Controlados desde el Servicio
    if (error.message === 'CREDENTIALS_INVALID') {
      return res.status(401).json({ 
        message: 'Matrícula o contraseña incorrectos. Verifica tus datos.' 
      });
    }
    
    if (error.message === 'USER_INACTIVE') {
      return res.status(403).json({ 
        message: 'Tu cuenta ha sido deshabilitada. Contacta al Administrador.' 
      });
    }

    // Error inesperado de servidor (Caída de BD, etc.)
    console.error('[AuthController Error]:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor. Intenta nuevamente más tarde.' 
    });
  }
};

module.exports = {
  login
};