const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y verificar que sea odontólogo
router.use(auth.verifyToken, auth.requireEspecialista, auth.requireEspecialidad('Odontologia'));

// Obtener todos los odontogramas del especialista
router.get('/', async (req, res) => {
    try {
        const odontogramas = await database.query(`
            SELECT o.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM odontogramas o
            JOIN pacientes p ON o.paciente_uid = p.uid
            WHERE o.especialista_uid = $1
            ORDER BY o.fecha_creacion DESC
        `, [req.user.uid]);

        // Parsear los arrays JSON de dientes
        const odontogramasParsed = odontogramas.map(odo => ({
            ...odo,
            dientes: odo.dientes ? JSON.parse(odo.dientes) : []
        }));

        res.json({
            success: true,
            data: odontogramasParsed
        });
    } catch (error) {
        console.error('Error al obtener odontogramas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener odontogramas de un paciente específico
router.get('/paciente/:paciente_uid', async (req, res) => {
    try {
        const { paciente_uid } = req.params;

        // Verificar que el paciente existe y pertenece a odontología
        const paciente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = 'Odontologia' OR seccion = 'Ambas')
        `, [paciente_uid]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const odontogramas = await database.query(`
            SELECT o.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM odontogramas o
            JOIN pacientes p ON o.paciente_uid = p.uid
            WHERE o.especialista_uid = $1 AND o.paciente_uid = $2
            ORDER BY o.fecha_creacion DESC
        `, [req.user.uid, paciente_uid]);

        // Parsear los arrays JSON de dientes
        const odontogramasParsed = odontogramas.map(odo => ({
            ...odo,
            dientes: odo.dientes ? JSON.parse(odo.dientes) : []
        }));

        res.json({
            success: true,
            data: odontogramasParsed
        });
    } catch (error) {
        console.error('Error al obtener odontogramas del paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener odontograma por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const odontograma = await database.get(`
            SELECT o.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM odontogramas o
            JOIN pacientes p ON o.paciente_uid = p.uid
            WHERE o.id = $1 AND o.especialista_uid = $2
        `, [id, req.user.uid]);

        if (!odontograma) {
            return res.status(404).json({
                success: false,
                message: 'Odontograma no encontrado'
            });
        }

        // Parsear el array JSON de dientes
        odontograma.dientes = odontograma.dientes ? JSON.parse(odontograma.dientes) : [];

        res.json({
            success: true,
            data: odontograma
        });
    } catch (error) {
        console.error('Error al obtener odontograma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear nuevo odontograma
router.post('/', [
    body('paciente_uid').notEmpty().withMessage('Paciente requerido'),
    body('dientes').isArray().withMessage('Dientes debe ser un array'),
    body('estado').notEmpty().withMessage('Estado requerido'),
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

        const { paciente_uid, dientes, estado, observaciones } = req.body;

        // Verificar que el paciente existe y pertenece a odontología
        const paciente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = 'Odontologia' OR seccion = 'Ambas')
        `, [paciente_uid]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Crear odontograma
        const result = await database.run(`
            INSERT INTO odontogramas (paciente_uid, especialista_uid, dientes, estado, observaciones) 
            VALUES ($1, $2, $3, $4, $5)
        `, [paciente_uid, req.user.uid, JSON.stringify(dientes), estado, observaciones]);

        const odontograma = await database.get(`
            SELECT o.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM odontogramas o
            JOIN pacientes p ON o.paciente_uid = p.uid
            WHERE o.id = $1
        `, [result.id]);

        // Parsear el array JSON de dientes
        odontograma.dientes = odontograma.dientes ? JSON.parse(odontograma.dientes) : [];

        res.status(201).json({
            success: true,
            message: 'Odontograma creado exitosamente',
            data: odontograma
        });

    } catch (error) {
        console.error('Error al crear odontograma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar odontograma
router.put('/:id', [
    body('dientes').isArray().withMessage('Dientes debe ser un array'),
    body('estado').notEmpty().withMessage('Estado requerido'),
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
        const { dientes, estado, observaciones } = req.body;

        // Verificar que el odontograma existe y pertenece al especialista
        const odontograma = await database.get(`
            SELECT * FROM odontogramas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!odontograma) {
            return res.status(404).json({
                success: false,
                message: 'Odontograma no encontrado'
            });
        }

        // Actualizar odontograma
        await database.run(`
            UPDATE odontogramas 
            SET dientes = $1, estado = $2, observaciones = $3
            WHERE id = $4
        `, [JSON.stringify(dientes), estado, observaciones, id]);

        const odontogramaActualizado = await database.get(`
            SELECT o.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM odontogramas o
            JOIN pacientes p ON o.paciente_uid = p.uid
            WHERE o.id = $1
        `, [id]);

        // Parsear el array JSON de dientes
        odontogramaActualizado.dientes = odontogramaActualizado.dientes ? JSON.parse(odontogramaActualizado.dientes) : [];

        res.json({
            success: true,
            message: 'Odontograma actualizado exitosamente',
            data: odontogramaActualizado
        });

    } catch (error) {
        console.error('Error al actualizar odontograma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar odontograma
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el odontograma existe y pertenece al especialista
        const odontograma = await database.get(`
            SELECT * FROM odontogramas 
            WHERE id = $1 AND especialista_uid = $2
        `, [id, req.user.uid]);

        if (!odontograma) {
            return res.status(404).json({
                success: false,
                message: 'Odontograma no encontrado'
            });
        }

        // Eliminar odontograma
        await database.run('DELETE FROM odontogramas WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Odontograma eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar odontograma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 