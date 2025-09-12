const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Determinar archivo .env según NODE_ENV
let envFile;
if (process.env.NODE_ENV === 'production') {
    envFile = path.resolve(__dirname, '.env.production');
    if (fs.existsSync(envFile)) {
        require('dotenv').config({ path: process.env.BACKEND_ENV_FILE || '.env'});
        console.log('Variables de entorno cargadas desde .env.production');
    } else {
        console.warn('.env.production no encontrado, usando variables del sistema');
    }
} else {
    // Desarrollo local usa simplemente .env
    require('dotenv').config();
    console.log('Variables de entorno cargadas desde .env');
}

const database = require('./database/postgres');

// Importar rutas
const authRoutes = require('./routes/auth');
const pacientesRoutes = require('./routes/pacientes');
const turnosRoutes = require('./routes/turnos');
const horariosRoutes = require('./routes/horarios');
const fichasKinesicasRoutes = require('./routes/fichas-kinesicas');
const odontogramasRoutes = require('./routes/odontogramas');
const reportesRoutes = require('./routes/reportes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

// Middleware de logging
app.use(morgan('combined'));

// Middleware de CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para manejar errores de parsing JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
    }
    next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/fichas-kinesicas', fichasKinesicasRoutes);
app.use('/api/odontogramas', odontogramasRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API del Consultorio Médico',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            pacientes: '/api/pacientes',
            turnos: '/api/turnos',
            horarios: '/api/horarios',
            fichasKinesicas: '/api/fichas-kinesicas',
            odontogramas: '/api/odontogramas'
        }
    });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Middleware para manejar errores globales
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Función para iniciar el servidor
async function startServer() {
    try {
        // Inicializar base de datos
        await database.init();
        console.log('Base de datos inicializada correctamente');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`API disponible en: http://localhost:${PORT}`);

        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    database.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nCerrando servidor...');
    database.close();
    process.exit(0);
});

// Iniciar servidor
startServer(); 