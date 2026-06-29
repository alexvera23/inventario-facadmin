const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    // Verificamos que el middleware anterior (verificarToken) haya inyectado a req.user
    if (!req.user) {
      return res.status(401).json({ message: 'No hay sesión activa para verificar roles.' });
    }

    // Comprobamos si el rol del usuario está en la lista de permitidos
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        message: `Acceso denegado. Se requiere el rol: ${rolesPermitidos.join(' o ')} para esta acción.` 
      });
    }

    // Si tiene el rol correcto, lo dejamos pasar
    next();
  };
};

module.exports = {
  checkRole
};