const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y verificar que sea kinesiólogo
router.use(auth.verifyToken, auth.requireEspecialista, auth.requireEspecialidad('Kinesiologia'));

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

        res.json({
            success: true,
            data: fichas
        });
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

        res.json({
            success: true,
            data: fichas
        });
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

        res.json({
            success: true,
            data: ficha
        });
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
    body('tratamiento').notEmpty().withMessage('Tratamiento requerido'),
    body('evaluacion').notEmpty().withMessage('Evaluación requerida'),
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

        const { paciente_uid, diagnostico, tratamiento, evaluacion, observaciones } = req.body;

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
            INSERT INTO fichas_kinesicas (paciente_uid, especialista_uid, diagnostico, tratamiento, evaluacion, observaciones) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [paciente_uid, req.user.uid, diagnostico, tratamiento, evaluacion, observaciones]);

        const ficha = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [result.id]);

        res.status(201).json({
            success: true,
            message: 'Ficha kinesica creada exitosamente',
            data: ficha
        });

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
    body('tratamiento').notEmpty().withMessage('Tratamiento requerido'),
    body('evaluacion').notEmpty().withMessage('Evaluación requerida'),
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
        const { diagnostico, tratamiento, evaluacion, observaciones } = req.body;

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

        // Actualizar ficha
        await database.run(`
            UPDATE fichas_kinesicas 
            SET diagnostico = $1, tratamiento = $2, evaluacion = $3, observaciones = $4
            WHERE id = $5
        `, [diagnostico, tratamiento, evaluacion, observaciones, id]);

        const fichaActualizada = await database.get(`
            SELECT fk.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM fichas_kinesicas fk
            JOIN pacientes p ON fk.paciente_uid = p.uid
            WHERE fk.id = $1
        `, [id]);

        res.json({
            success: true,
            message: 'Ficha kinesica actualizada exitosamente',
            data: fichaActualizada
        });

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

module.exports = router; 