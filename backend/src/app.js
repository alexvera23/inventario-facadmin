const express = require('express');
const cors = require('cors');
// Importamos la instancia de la base de datos para asegurar su inicialización
const prisma = require('./config/db');
// 1. Importar las rutas de productos
const productoRoutes = require('./routes/productoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
// Permite que el frontend de la facultad se conecte sin bloqueos de CORS
app.use(cors());
// Permite que el servidor entienda cuerpos de peticiones en formato JSON
app.use(express.json());

// ==========================================
// RUTAS DEL SISTEMA (MOCKUP / PRUEBAS)
// ==========================================
// Ruta base para verificar el estado del servicio y la conexión a la DB
app.get('/api/health', async (req, res) => {
    try {
        // Hacemos una consulta rápida de prueba a la DB usando Prisma
        // Esto verifica de forma real que la conexión esté saludable
        await prisma.$queryRaw`SELECT 1`;
        
        return res.status(200).json({
            status: 'ok',
            message: 'Servidor FacAdmin operativo',
            database: 'Conectada exitosamente en entorno Docker'
        });
    } catch (error) {
        console.error(' Error en el Health Check:', error);
        return res.status(500).json({
            status: 'error',
            message: 'El servidor está vivo pero la base de datos no responde',
            error: error.message
        });
    }
});

// ==========================================
// REGISTRO DE RUTAS
// ==========================================
app.use('/api/productos', productoRoutes);
app.use('/api/movimientos',movimientoRoutes);

// Health check de la base de datos
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.status(200).json({
            status: 'ok',
            message: 'Servidor FacAdmin operativo',
            database: 'Conectada exitosamente en entorno Docker'
        });
    } catch (error) {
        console.error(' Error en el Health Check:', error);
        return res.status(500).json({
            status: 'error',
            message: 'El servidor está vivo pero la base de datos no responde',
            error: error.message
        });
    }
});


// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(` Servidor backend corriendo en el puerto ${PORT}`);
});