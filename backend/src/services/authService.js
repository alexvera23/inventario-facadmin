const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../config/db');

// Clave secreta para firmar los JWT. En producción, esto debe ir en tu .env
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_facadmin_2026';

const verificarCredenciales = async (id_interno, password) => {
  // 1. Buscar al usuario en la BD
  const usuario = await prisma.usuario.findUnique({
    where: { id_interno: id_interno }
  });

  // Si no existe o no tiene contraseña (es SOLICITANTE)
  if (!usuario || !usuario.password) {
    throw new Error('CREDENTIALS_INVALID');
  }

  // 2. Verificar que no esté dado de baja
  if (!usuario.activo) {
    throw new Error('USER_INACTIVE');
  }

  // 3. Comparar el hash de la contraseña
  const isMatch = await bcrypt.compare(password, usuario.password);
  if (!isMatch) {
    throw new Error('CREDENTIALS_INVALID');
  }

  // 4. Armar la información pública que vivirá en el Token
  const payload = {
    id: usuario.id,
    id_interno: usuario.id_interno,
    nombre: usuario.nombre,
    rol: usuario.rol,
    departamento: usuario.departamento
  };

  // 5. Firmar el Token (Expiración de 8 horas)
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  return { token, user: payload };
};

module.exports = {
  verificarCredenciales
};