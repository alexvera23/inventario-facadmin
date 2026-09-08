const prisma = require('../config/db'); // Ajusta la ruta a tu instancia central de Prisma

class AuditoriaService {
  // 1.  Obtener historial paginado y filtrado
  async obtenerHistorial({ page = 1, limit = 10, busqueda = '', accion = 'TODAS' }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Búsqueda por texto (en el nombre del usuario o en los detalles del log)
    if (busqueda.trim()) {
      where.OR = [
        { detalles: { contains: busqueda, mode: 'insensitive' } },
        { usuario: { nombre: { contains: busqueda, mode: 'insensitive' } } }
      ];
    }

    // Filtrar por el tipo de acción
    if (accion && accion !== 'TODAS') {
      where.accion = accion.toUpperCase();
    }

    const [totalItems, auditorias] = await Promise.all([
      prisma.auditoria.count({ where }),
      prisma.auditoria.findMany({
        where,
        take: limitNum,
        skip: skip,
        orderBy: { fecha: 'desc' }, // Apoyado por el índice @@index([fecha(sort: Desc)])
        include: {
          usuario: { 
            select: { nombre: true, rol: true, id_interno: true } 
          }
        }
      })
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      data: auditorias,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
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