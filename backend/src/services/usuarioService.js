const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const auditoriaService = require('./auditoriaService');

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

    // POST: Crear usuario validando matrícula/ID único y encriptando contraseña
    async crear(datos) {
        try {
            // 1. Preparamos el hash de la contraseña si es que el front la envió
            let passwordHash = null;
            if (datos.password) {
                const salt = await bcrypt.genSalt(10);
                passwordHash = await bcrypt.hash(datos.password, salt);
            }

            // 2. Guardamos en la base de datos
            return await prisma.usuario.create({
                data: {
                    id_interno: datos.id_interno,
                    nombre: datos.nombre,
                    correo: datos.correo,
                    departamento: datos.departamento,
                    rol: datos.rol || 'SOLICITANTE',
                    password: passwordHash //  Se guarda null (Solicitantes) o el string encriptado
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
    async actualizar(id, datos,usuarioOperadorId) {
        //obtenemos los datos antes de editarlos 
        const usuarioAEditar = await prisma.usuario.findUnique({
            where: { id: parseInt(id)}
        });
        if (!usuarioAEditar){
            throw new Error('NOT_FOUND');
        }
        // 1. Armamos el objeto de datos básicos a actualizar
        const dataToUpdate = {
            id_interno: datos.id_interno, // Por si corrigen la matrícula
            nombre: datos.nombre,
            correo: datos.correo,
            departamento: datos.departamento,
            rol: datos.rol,
            activo: datos.activo //  Añadimos el estado activo que configuramos en el frontend
        };

        // 2. Si el frontend nos mandó una nueva contraseña (no venía vacía)
        // la encriptamos y la agregamos al objeto de actualización
        if (datos.password) {
            const salt = await bcrypt.genSalt(10);
            dataToUpdate.password = await bcrypt.hash(datos.password, salt);
        }

        // 3. Ejecutamos el update en Prisma
        const usuarioEditado = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });
        //Registro en la bitacora de auditoria 
        await auditoriaService.registrar(
            usuarioOperadorId,
            'EDITAR',
            'USUARIO',
            parseInt(id),
            `Se editó  al usuario: ${usuarioAEditar.nombre} (Matrícula: ${usuarioAEditar.id_interno}, Rol: ${usuarioAEditar.rol})` 
        );
        return usuarioEditado;
    }

    // DELETE: Eliminar usuario
    async eliminar(id, usuarioOperadorId) {
        try {
            //obtener datos antes de borarrlo para guardar para la auditoria
            const usuarioABorrar = await prisma.usuario.findUnique({
                where: { id: parseInt(id) }
            });
            if(!usuarioABorrar){
                throw new Error('NOT_FOUND');
            }
            //eliminar en la base de datos 
            const usuarioEliminado = await prisma.usuario.delete({
                where: { id:parseInt(id) }
            });

            //Registro en la bitacora de auditoria 
            await auditoriaService.registrar(
                usuarioOperadorId,        // Quién lo hizo (ID del Admin firmado)
                'ELIMINAR',               // Acción
                'USUARIO',                // Entidad afectada
                parseInt(id),             // ID de la entidad
                `Se eliminó permanentemente al usuario: ${usuarioABorrar.nombre} (Matrícula: ${usuarioABorrar.id_interno}, Rol: ${usuarioABorrar.rol})` // Detalles libres
            );
            return usuarioEliminado;
            
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