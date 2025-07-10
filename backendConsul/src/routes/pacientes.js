const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.verifyToken, auth.requireEspecialista);

// Obtener todos los pacientes del especialista
router.get('/', async (req, res) => {
    try {
        const pacientes = await database.query(`
            SELECT p.*, u.lastLogin 
            FROM pacientes p 
            JOIN usuarios u ON p.uid = u.uid 
            WHERE p.seccion = $1 OR p.seccion = 'Ambas'
            ORDER BY p.nombre
        `, [req.especialista.especialidad]);

        res.json({
            success: true,
            data: pacientes
        });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener paciente por ID
router.get('/:uid', async (req, res) => {
    try {
        const paciente = await database.get(`
            SELECT p.*, u.lastLogin 
            FROM pacientes p 
            JOIN usuarios u ON p.uid = u.uid 
            WHERE p.uid = $1 AND (p.seccion = $2 OR p.seccion = 'Ambas')
        `, [req.params.uid, req.especialista.especialidad]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        res.json({
            success: true,
            data: paciente
        });
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear nuevo paciente
router.post('/', [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('obraSocial').notEmpty().withMessage('Obra social requerida'),
    body('domicilio').notEmpty().withMessage('Domicilio requerido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
    body('fechaNacimiento').isISO8601().withMessage('Fecha de nacimiento inválida'),
    body('seccion').isIn(['Kinesiologia', 'Odontologia', 'Ambas']).withMessage('Sección inválida')
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

        const { nombre, obraSocial, domicilio, telefono, fechaNacimiento, seccion } = req.body;

        // Verificar que el especialista pueda crear pacientes de esta sección
        if (seccion !== req.especialista.especialidad && seccion !== 'Ambas') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para crear pacientes de esta sección'
            });
        }

        const uid = uuidv4();

        // Crear usuario base
        await database.run(
            'INSERT INTO usuarios (uid) VALUES ($1)',
            [uid]
        );

        // Crear paciente
        await database.run(`
            INSERT INTO pacientes (uid, nombre, obraSocial, domicilio, telefono, fechaNacimiento, seccion) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [uid, nombre, obraSocial, domicilio, telefono, fechaNacimiento, seccion]);

        const paciente = await database.get(`
            SELECT p.*, u.lastLogin 
            FROM pacientes p 
            JOIN usuarios u ON p.uid = u.uid 
            WHERE p.uid = $1
        `, [uid]);

        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            data: paciente
        });

    } catch (error) {
        console.error('Error al crear paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar paciente
router.put('/:uid', [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('obraSocial').notEmpty().withMessage('Obra social requerida'),
    body('domicilio').notEmpty().withMessage('Domicilio requerido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
    body('fechaNacimiento').isISO8601().withMessage('Fecha de nacimiento inválida'),
    body('seccion').isIn(['Kinesiologia', 'Odontologia', 'Ambas']).withMessage('Sección inválida')
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

        const { nombre, obraSocial, domicilio, telefono, fechaNacimiento, seccion } = req.body;
        const { uid } = req.params;

        // Verificar que el paciente existe y pertenece a la especialidad del especialista
        const pacienteExistente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = $2 OR seccion = 'Ambas')
        `, [uid, req.especialista.especialidad]);

        if (!pacienteExistente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Verificar permisos para la nueva sección
        if (seccion !== req.especialista.especialidad && seccion !== 'Ambas') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para asignar pacientes a esta sección'
            });
        }

        // Actualizar paciente
        await database.run(`
            UPDATE pacientes 
            SET nombre = $1, obraSocial = $2, domicilio = $3, telefono = $4, fechaNacimiento = $5, seccion = $6
            WHERE uid = $7
        `, [nombre, obraSocial, domicilio, telefono, fechaNacimiento, seccion, uid]);

        const paciente = await database.get(`
            SELECT p.*, u.lastLogin 
            FROM pacientes p 
            JOIN usuarios u ON p.uid = u.uid 
            WHERE p.uid = $1
        `, [uid]);

        res.json({
            success: true,
            message: 'Paciente actualizado exitosamente',
            data: paciente
        });

    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar paciente
router.delete('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        // Verificar que el paciente existe y pertenece a la especialidad del especialista
        const paciente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = $2 OR seccion = 'Ambas')
        `, [uid, req.especialista.especialidad]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Verificar si tiene turnos activos
        const turnosActivos = await database.get(`
            SELECT COUNT(*) as count FROM turnos 
            WHERE paciente_uid = $1 AND estado = 'activo'
        `, [uid]);

        if (turnosActivos.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el paciente porque tiene turnos activos'
            });
        }

        // Eliminar paciente (esto también eliminará el usuario base por CASCADE)
        await database.run('DELETE FROM pacientes WHERE uid = $1', [uid]);

        res.json({
            success: true,
            message: 'Paciente eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 