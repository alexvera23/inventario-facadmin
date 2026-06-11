const prisma = require('../config/db');

class UsuarioService {
    // 1. GET LIGERO: Lista de usuarios + Conteo del mes actual (Para la tabla)
    async obtenerTodos() {
        const fechaInicioMes = new Date();
        fechaInicioMes.setDate(1);
        fechaInicioMes.setHours(0, 0, 0, 0);

        const usuarios = await prisma.usuario.findMany({
            include: {
                _count: {
                    select: {
                        solicitudes: {
                            where: { fecha: { gte: fechaInicioMes } }
                        }
                    }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        return usuarios.map(u => ({
            id: u.id,
            id_interno: u.id_interno,
            nombre: u.nombre,
            correo: u.correo,
            departamento: u.departamento,
            rol: u.rol,
            activo: true,
            total_solicitudes: u._count.solicitudes // Solo mandamos el número entero
        }));
    }

    // 2. GET DETALLADO: Toda la información de un usuario + Historial completo
    async obtenerPorId(id, periodo = 'siempre') {
        // Lógica de fechas (Por si decides filtrar el historial en el frontend después)
        let whereClause = {}; 
        
        if (periodo !== 'siempre') {
            const fechaInicio = new Date();
            fechaInicio.setHours(0, 0, 0, 0);
            if (periodo === 'semana') fechaInicio.setDate(fechaInicio.getDate() - 7);
            else if (periodo === 'quincena') fechaInicio.setDate(fechaInicio.getDate() - 15);
            else if (periodo === 'mes') fechaInicio.setDate(1);
            
            whereClause = { fecha: { gte: fechaInicio } };
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(id) },
            include: {
                solicitudes: {
                    where: whereClause, // Filtro de fechas (vacío si es 'siempre')
                    orderBy: { fecha: 'desc' }, // Más recientes primero
                    include: {
                        producto: {
                            select: { nombre: true, unidad_medida: true }
                        }
                    }
                }
            }
        });

        if (!usuario) return null;

        return {
            id: usuario.id,
            id_interno: usuario.id_interno,
            nombre: usuario.nombre,
            correo: usuario.correo,
            departamento: usuario.departamento,
            rol: usuario.rol,
            activo: true,
            total_solicitudes: usuario.solicitudes.length,
            historial_solicitudes: usuario.solicitudes.map(sol => ({
                movimiento_id: sol.id,
                producto: sol.producto?.nombre || 'Insumo eliminado',
                cantidad: Number(sol.cantidad),
                unidad: sol.producto?.unidad_medida || 'Pzas',
                fecha: sol.fecha,
                tipo: sol.tipo,
                observaciones: sol.observaciones || 'Sin observaciones'
            }))
        };
    }

    // POST: Crear usuario validando matrícula/ID único
    async crear(datos) {
        try {
            return await prisma.usuario.create({
                data: {
                    id_interno: datos.id_interno,
                    nombre: datos.nombre,
                    correo: datos.correo,
                    departamento: datos.departamento,
                    rol: datos.rol || 'SOLICITANTE' // Rol por defecto si no se envía
                }
            });
        } catch (error) {
            // Prisma error P2002: Falla de restricción de campo único (Unique constraint)
            if (error.code === 'P2002') {
                throw new Error('UNIQUE_CONSTRAINT');
            }
            throw error;
        }
    }

    // PUT: Actualizar información del usuario
    async actualizar(id, datos) {
        return await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: {
                nombre: datos.nombre,
                correo: datos.correo,
                departamento: datos.departamento,
                rol: datos.rol
            }
        });
    }

    // DELETE: Eliminar usuario
    async eliminar(id) {
        try {
            return await prisma.usuario.delete({
                where: { id: parseInt(id) }
            });
        } catch (error) {
            // Prisma error P2003: Llave foránea restrictiva (Aplica para encargados)
            if (error.code === 'P2003') {
                throw new Error('FOREIGN_KEY_CONSTRAINT');
            }
            throw error;
        }
    }
}

module.exports = new UsuarioService();