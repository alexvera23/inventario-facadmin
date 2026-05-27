const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Ruta de prueba de salud del sistema
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor de la Facultad de Administración corriendo' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor dev corriendo en el puerto ${PORT}`);
});