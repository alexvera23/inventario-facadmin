const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const auditoriaService = require('./auditoriaService');

class UsuarioService {
    
    //  MÉTODO MAESTRO: Obtener, Buscar, Filtrar por Rol y Paginar
    async obtenerTodos({ page = 1, limit = 10, busqueda = '', rol = 'TODOS' }) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const fechaInicioMes = new Date();
        fechaInicioMes.setDate(1);
        fechaInicioMes.setHours(0, 0, 0, 0);

        // Construcción dinámica de la cláusula WHERE (Búsqueda)
        const where = {};
        
        if (busqueda.trim()) {
            where.OR = [
                { nombre: { contains: busqueda, mode: 'insensitive' } },
                { id_interno: { contains: busqueda, mode: 'insensitive' } },
                { correo: { contains: busqueda, mode: 'insensitive' } }
            ];
        }

        if (rol && rol !== 'TODOS') {
            where.rol = rol.toUpperCase(); // Ej: 'ADMIN', 'SOLICITANTE'
        }

        // Ejecutamos el Count y el Fetch en paralelo
        const [totalItems, usuarios] = await Promise.all([
            prisma.usuario.count({ where }),
            prisma.usuario.findMany({
                where,
                take: limitNum,
                skip: skip,
                orderBy: { nombre: 'asc' }, // Usa el índice de PostgreSQL
                include: {
                    _count: {
                        select: {
                            solicitudes: {
                                where: { fecha: { gte: fechaInicioMes } }
                            }
                        }
                    }
                }
            })
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        // Formateamos la respuesta del array
        const usuariosFormateados = usuarios.map(u => ({
            id: u.id,
            id_interno: u.id_interno,
            nombre: u.nombre,
            correo: u.correo,
            departamento: u.departamento,
            rol: u.rol,
            activo: u.activo,
            total_solicitudes: u._count.solicitudes
        }));

        return {
            data: usuariosFormateados,
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

    // 2. GET DETALLADO (Permanece igual, pero optimizado)
    async obtenerPorId(id, periodo = 'siempre') {
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
                    where: whereClause,
                    orderBy: { fecha: 'desc' },
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
            activo: usuario.activo,
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

    async crear(datos, usuarioOperadorId) {
        try {
            let passwordHash = null;
            if (datos.password || datos.contrasenia) {
                const rawPass = datos.password || datos.contrasenia;
                const salt = await bcrypt.genSalt(10);
                passwordHash = await bcrypt.hash(rawPass, salt);
            }

            const nuevoUsuario = await prisma.usuario.create({
                data:{
                    id_interno: datos.id_interno,
                    nombre: datos.nombre,
                    correo: datos.correo,
                    departamento: datos.departamento,
                    rol: datos.rol || 'SOLICITANTE',
                    password: passwordHash
                }
            });
            await auditoriaService.registrar(
                usuarioOperadorId,
                'CREAR',
                'USUARIO',
                nuevoUsuario.id,
                `Se dio de alta al usuario: ${nuevoUsuario.nombre} (Matrícula/ID: ${nuevoUsuario.id_interno}, Rol: ${nuevoUsuario.rol})`
            );
            return nuevoUsuario;
            
        } catch (error) {
            if (error.code === 'P2002') {
                throw new Error('UNIQUE_CONSTRAINT');
            }
            throw error;
        }
    }

    async actualizar(id, datos, usuarioOperadorId) {
        const usuarioAEditar = await prisma.usuario.findUnique({
            where: { id: parseInt(id)}
        });
        if (!usuarioAEditar) throw new Error('NOT_FOUND');
        
        const dataToUpdate = {
            id_interno: datos.id_interno,
            nombre: datos.nombre,
            correo: datos.correo,
            departamento: datos.departamento,
            rol: datos.rol,
            activo: datos.activo
        };

        if (datos.password || datos.contrasenia) {
            const rawPass = datos.password || datos.contrasenia;
            const salt = await bcrypt.genSalt(10);
            dataToUpdate.password = await bcrypt.hash(rawPass, salt);
        }

        const usuarioEditado = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });
        
        await auditoriaService.registrar(
            usuarioOperadorId,
            'EDITAR',
            'USUARIO',
            parseInt(id),
            `Se editó al usuario: ${usuarioAEditar.nombre} (Matrícula: ${usuarioAEditar.id_interno}, Rol: ${usuarioAEditar.rol})` 
        );
        return usuarioEditado;
    }

    async eliminar(id, usuarioOperadorId) {
        try {
            const usuarioABorrar = await prisma.usuario.findUnique({
                where: { id: parseInt(id) }
            });
            if(!usuarioABorrar) throw new Error('NOT_FOUND');
            
            const usuarioEliminado = await prisma.usuario.delete({
                where: { id:parseInt(id) }
            });

            await auditoriaService.registrar(
                usuarioOperadorId,
                'ELIMINAR',
                'USUARIO',
                parseInt(id),
                `Se eliminó permanentemente al usuario: ${usuarioABorrar.nombre} (Matrícula: ${usuarioABorrar.id_interno}, Rol: ${usuarioABorrar.rol})`
            );
            return usuarioEliminado;
            
        } catch (error) {
            if (error.code === 'P2003') {
                throw new Error('FOREIGN_KEY_CONSTRAINT');
            }
            throw error;
        }
    }
}

module.exports = new UsuarioService();