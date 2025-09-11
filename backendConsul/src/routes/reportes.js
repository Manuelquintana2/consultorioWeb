const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.verifyToken, auth.requireEspecialista);

//Obtener reportes (campo reporte en la tabla reportes)
router.get('/', async (req, res) => {
    try {
        const reportes = await database.query(`
            SELECT * 
            FROM reportes 
        `);
        res.json({
            success: true,
            data: reportes
        });
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
//Insertar reporte en la tabla reportes campo reporte
router.post('/',
    body('reporte').notEmpty().withMessage('El campo reporte es obligatorio'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        try {
            const { reporte } = req.body;
            const nuevoReporte = await database.run(`
                INSERT INTO reportes (reporte) 
                VALUES ($1) 
                RETURNING *
            `, [reporte]);
            res.status(201).json({
                success: true,
                data: nuevoReporte
            });
        } catch (error) {
            console.error('Error al crear reporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });

    // Modificar reporte por id
router.put('/:id',
    body('reporte').notEmpty().withMessage('El campo reporte es obligatorio'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { reporte } = req.body;

            const reporteActualizado = await database.run(`
                UPDATE reportes 
                SET reporte = $1 
                WHERE id = $2 
                RETURNING *
            `, [reporte, id]);

            if (reporteActualizado.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Reporte no encontrado'
                });
            }

            res.json({
                success: true,
                data: reporteActualizado[0]
            });
        } catch (error) {
            console.error('Error al modificar reporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
);

// Eliminar reporte por id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const reporteEliminado = await database.run(`
            DELETE FROM reportes 
            WHERE id = $1 
            RETURNING *
        `, [id]);

        if (reporteEliminado.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Reporte eliminado correctamente',
            data: reporteEliminado[0]
        });
    } catch (error) {
        console.error('Error al eliminar reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});


module.exports = router;