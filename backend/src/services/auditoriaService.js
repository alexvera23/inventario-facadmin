const prisma = require('../config/db'); // Ajusta la ruta a tu instancia central de Prisma

class AuditoriaService {
  // 1. Obtener todo el historial (Para la vista del ADMIN)
  async obtenerHistorial() {
    return await prisma.auditoria.findMany({
      orderBy: { fecha: 'desc' }, // Los más recientes primero
      include: {
        // Traemos los datos del usuario que hizo la acción sin traer su password
        usuario: { 
          select: { nombre: true, rol: true, id_interno: true } 
        }
      }
    });
  }

  // 2. Función Helper para registrar acciones desde otros servicios
  async registrar(usuario_id, accion, entidad, entidad_id, detalles = null) {
    try {
      await prisma.auditoria.create({
        data: {
          usuario_id,
          accion,
          entidad,
          entidad_id,
          detalles
        }
      });
    } catch (error) {
      console.error('Error interno al registrar auditoría:', error);
      // No lanzamos el error (throw) porque si falla el log, 
      // no queremos que se caiga la operación principal del usuario
    }
  }
}

module.exports = new AuditoriaService();