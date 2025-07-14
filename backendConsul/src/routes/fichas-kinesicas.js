const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y verificar que sea kinesiólogo
router.use(auth.verifyToken, auth.requireEspecialista, auth.requireEspecialidad('Kinesiologia'));

// Función para parsear arrays JSON de forma segura
function safeParseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val; // Si ya es un array, devolverlo tal como está
    if (typeof val === 'string' && val.trim() === '') return [];
    try { return JSON.parse(val); } catch { return []; }
}

// Obtener todas las fichas kinesicas del especialista
router.get('/', async (req, res) => {
    try {
        const fichas = await database.query(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.especialista_uid = $1
            ORDER BY fk.fecha_creacion DESC
        `, [req.user.uid]);

        // Parsear los campos JSON
        const fichasParsed = fichas.map(ficha => ({
            ...ficha,
            estudios: safeParseArray(ficha.estudios),
            sesiones: safeParseArray(ficha.sesiones)
        }));

        res.json(fichasParsed);
    } catch (error) {
        console.error('Error al obtener fichas kinesicas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener fichas kinesicas de un paciente específico
router.get('/paciente/:paciente_uid', async (req, res) => {
    try {
        const { paciente_uid } = req.params;

        // Verificar que el paciente existe y pertenece a kinesiología
        const paciente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = 'Kinesiologia' OR seccion = 'Ambas')
        `, [paciente_uid]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const fichas = await database.query(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.especialista_uid = $1 AND fk.paciente_uid = $2
            ORDER BY fk.fecha_creacion DESC
        `, [req.user.uid, paciente_uid]);

        // Parsear los campos JSON
        const fichasParsed = fichas.map(ficha => ({
            ...ficha,
            estudios: safeParseArray(ficha.estudios),
            sesiones: safeParseArray(ficha.sesiones)
        }));

        res.json(fichasParsed);
    } catch (error) {
        console.error('Error al obtener fichas kinesicas del paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener ficha kinesica por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const ficha = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1 AND fk.especialista_uid = $2
        `, [id, req.user.uid]);

        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha kinesica no encontrada'
            });
        }

        // Parsear los campos JSON
        const fichaParsed = {
            ...ficha,
            estudios: safeParseArray(ficha.estudios),
            sesiones: safeParseArray(ficha.sesiones)
        };

        res.json(fichaParsed);
    } catch (error) {
        console.error('Error al obtener ficha kinesica:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear nueva ficha kinesica
router.post('/', [
    body('paciente_uid').notEmpty().withMessage('Paciente requerido'),
    body('diagnostico').notEmpty().withMessage('Diagnóstico requerido'),
    body('evaluacion').notEmpty().withMessage('Evaluación requerida'),
    body('sintomas').notEmpty().withMessage('Síntomas requeridos'),
    body('tratamiento').notEmpty().withMessage('Tratamiento requerido'),
    body('estudios').optional().isArray(),
    body('sesiones').optional().isArray(),
    body('observaciones').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { 
            paciente_uid, 
            diagnostico, 
            evaluacion, 
            sintomas, 
            tratamiento, 
            estudios = [], 
            sesiones = [], 
            observaciones 
        } = req.body;

        // Verificar que el paciente existe y pertenece a kinesiología
        const paciente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = 'Kinesiologia' OR seccion = 'Ambas')
        `, [paciente_uid]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Crear ficha kinesica
        const result = await database.run(`
            INSERT INTO fichas_kinesicas (
                paciente_uid, 
                especialista_uid, 
                diagnostico, 
                evaluacion, 
                sintomas, 
                estudios, 
                tratamiento, 
                sesiones, 
                observaciones
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [
            paciente_uid, 
            req.user.uid, 
            diagnostico, 
            evaluacion, 
            sintomas, 
            JSON.stringify(estudios), 
            tratamiento, 
            JSON.stringify(sesiones), 
            observaciones
        ]);

        const ficha = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [result.id]);

        // Parsear los campos JSON
        const fichaParsed = {
            ...ficha,
            estudios: safeParseArray(ficha.estudios),
            sesiones: safeParseArray(ficha.sesiones)
        };

        res.status(201).json(fichaParsed);

    } catch (error) {
        console.error('Error al crear ficha kinesica:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar ficha kinesica
router.put('/:id', [
    body('diagnostico').notEmpty().withMessage('Diagnóstico requerido'),
    body('evaluacion').notEmpty().withMessage('Evaluación requerida'),
    body('sintomas').notEmpty().withMessage('Síntomas requeridos'),
    body('tratamiento').notEmpty().withMessage('Tratamiento requerido'),
    body('estudios').optional().isArray(),
    body('sesiones').optional().isArray(),
    body('observaciones').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { 
            diagnostico, 
            evaluacion, 
            sintomas, 
            tratamiento, 
            estudios, 
            sesiones, 
            observaciones 
        } = req.body;

        // Verificar que la ficha existe y pertenece al especialista
        const ficha = await database.get(`
            SELECT * FROM fichas_kinesicas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha kinesica no encontrada'
            });
        }

        // Si no se envían estudios o sesiones, mantener los actuales
        const estudiosFinales = estudios !== undefined ? estudios : safeParseArray(ficha.estudios);
        const sesionesFinales = sesiones !== undefined ? sesiones : safeParseArray(ficha.sesiones);

        // Actualizar ficha
        await database.run(`
            UPDATE fichas_kinesicas 
            SET diagnostico = $1, 
                evaluacion = $2, 
                sintomas = $3, 
                tratamiento = $4, 
                estudios = $5, 
                sesiones = $6, 
                observaciones = $7,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $8
        `, [
            diagnostico, 
            evaluacion, 
            sintomas, 
            tratamiento, 
            JSON.stringify(estudiosFinales), 
            JSON.stringify(sesionesFinales), 
            observaciones, 
            id
        ]);

        const fichaActualizada = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [id]);

        // Parsear los campos JSON
        const fichaParsed = {
            ...fichaActualizada,
            estudios: safeParseArray(fichaActualizada.estudios),
            sesiones: safeParseArray(fichaActualizada.sesiones)
        };

        res.json(fichaParsed);

    } catch (error) {
        console.error('Error al actualizar ficha kinesica:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar ficha kinesica
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ficha existe y pertenece al especialista
        const ficha = await database.get(`
            SELECT * FROM fichas_kinesicas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha kinesica no encontrada'
            });
        }

        // Eliminar ficha
        await database.run('DELETE FROM fichas_kinesicas WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Ficha kinesica eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar ficha kinesica:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Agregar nueva sesión
router.post('/:id/sesiones', [
    body('numero').isInt({ min: 1 }).withMessage('Número de sesión requerido'),
    body('fecha').isISO8601().withMessage('Fecha válida requerida'),
    body('descripcion').optional().isString(),
    body('notas').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { numero, fecha, descripcion, notas } = req.body;

        // Verificar que la ficha existe y pertenece al especialista
        const ficha = await database.get(`
            SELECT * FROM fichas_kinesicas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha kinesica no encontrada'
            });
        }

        // Obtener sesiones actuales
        const sesionesActuales = safeParseArray(ficha.sesiones);
        
        // Verificar que no existe una sesión con ese número
        if (sesionesActuales.find(s => s.numero === numero)) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una sesión con ese número'
            });
        }

        // Agregar nueva sesión
        const nuevaSesion = { numero, fecha, descripcion, notas };
        sesionesActuales.push(nuevaSesion);

        // Actualizar ficha
        await database.run(`
            UPDATE fichas_kinesicas 
            SET sesiones = $1, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [JSON.stringify(sesionesActuales), id]);

        const fichaActualizada = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [id]);

        // Parsear los campos JSON
        const fichaParsed = {
            ...fichaActualizada,
            estudios: safeParseArray(fichaActualizada.estudios),
            sesiones: safeParseArray(fichaActualizada.sesiones)
        };

        res.json(fichaParsed);

    } catch (error) {
        console.error('Error al agregar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar sesión específica
router.put('/:id/sesiones/:numero', [
    body('fecha').isISO8601().withMessage('Fecha válida requerida'),
    body('descripcion').optional().isString(),
    body('notas').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id, numero } = req.params;
        const { fecha, descripcion, notas } = req.body;

        // Verificar que la ficha existe y pertenece al especialista
        const ficha = await database.get(`
            SELECT * FROM fichas_kinesicas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha kinesica no encontrada'
            });
        }

        // Obtener sesiones actuales
        const sesionesActuales = safeParseArray(ficha.sesiones);
        
        // Buscar la sesión a actualizar
        const sesionIndex = sesionesActuales.findIndex(s => s.numero === parseInt(numero));
        
        if (sesionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }

        // Actualizar sesión
        sesionesActuales[sesionIndex] = { 
            ...sesionesActuales[sesionIndex], 
            fecha, 
            descripcion, 
            notas 
        };

        // Actualizar ficha
        await database.run(`
            UPDATE fichas_kinesicas 
            SET sesiones = $1, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [JSON.stringify(sesionesActuales), id]);

        const fichaActualizada = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [id]);

        // Parsear los campos JSON
        const fichaParsed = {
            ...fichaActualizada,
            estudios: safeParseArray(fichaActualizada.estudios),
            sesiones: safeParseArray(fichaActualizada.sesiones)
        };

        res.json(fichaParsed);

    } catch (error) {
        console.error('Error al actualizar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar sesión
router.delete('/:id/sesiones/:numero', async (req, res) => {
    try {
        const { id, numero } = req.params;

        // Verificar que la ficha existe y pertenece al especialista
        const ficha = await database.get(`
            SELECT * FROM fichas_kinesicas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!ficha) {
            return res.status(404).json({
                success: false,
                message: 'Ficha kinesica no encontrada'
            });
        }

        // Obtener sesiones actuales
        const sesionesActuales = safeParseArray(ficha.sesiones);
        
        // Filtrar la sesión a eliminar
        const sesionesFiltradas = sesionesActuales.filter(s => s.numero !== parseInt(numero));
        
        if (sesionesFiltradas.length === sesionesActuales.length) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }

        // Actualizar ficha
        await database.run(`
            UPDATE fichas_kinesicas 
            SET sesiones = $1, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [JSON.stringify(sesionesFiltradas), id]);

        const fichaActualizada = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [id]);

        // Parsear los campos JSON
        const fichaParsed = {
            ...fichaActualizada,
            estudios: safeParseArray(fichaActualizada.estudios),
            sesiones: safeParseArray(fichaActualizada.sesiones)
        };

        res.json(fichaParsed);

    } catch (error) {
        console.error('Error al eliminar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 