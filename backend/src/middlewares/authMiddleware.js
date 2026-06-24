const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_facadmin_2026';

const verificarToken = (req, res, next) => {
  try {
    // 1. Leer el encabezado de Autorización
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Acceso denegado. No se proporcionó un token de autenticación válido.' 
      });
    }

    // 2. Extraer el token (quitamos la palabra "Bearer ")
    const token = authHeader.split(' ')[1];

    // 3. Verificar el token matemáticamente
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Inyectar los datos del usuario en la petición (req)
    req.user = decoded;

    // 5. Dejar pasar a la siguiente función (el controlador o el siguiente middleware)
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Tu sesión ha expirado. Vuelve a iniciar sesión.' });
    }
    return res.status(401).json({ message: 'Token inválido o corrupto.' });
  }
};

module.exports = {
  verificarToken
};