const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Login de especialistas
router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar especialista por email
        const especialista = await database.get(
            'SELECT uid, email, password, especialidad FROM especialistas WHERE email = $1',
            [email]
        );

        if (!especialista) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        if (!auth.comparePassword(password, especialista.password)) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Actualizar último login
        await database.run(
            'UPDATE usuarios SET lastLogin = CURRENT_TIMESTAMP WHERE uid = $1',
            [especialista.uid]
        );

        // Generar token
        const token = auth.generateToken(especialista.uid, especialista.especialidad);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                especialista: {
                    uid: especialista.uid,
                    email: especialista.email,
                    especialidad: especialista.especialidad
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', auth.verifyToken, auth.requireEspecialista, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            uid: req.user.uid,
            especialidad: req.especialista.especialidad
        }
    });
});

// Cambiar contraseña
router.put('/change-password', [
    auth.verifyToken,
    auth.requireEspecialista,
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
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

        const { currentPassword, newPassword } = req.body;

        // Obtener especialista actual
        const especialista = await database.get(
            'SELECT password FROM especialistas WHERE uid = $1',
            [req.user.uid]
        );

        if (!auth.comparePassword(currentPassword, especialista.password)) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hashear nueva contraseña
        const hashedPassword = auth.hashPassword(newPassword);

        // Actualizar contraseña
        await database.run(
            'UPDATE especialistas SET password = $1 WHERE uid = $2',
            [hashedPassword, req.user.uid]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 