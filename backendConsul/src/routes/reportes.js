const express = require('express');
const { body, query, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.verifyToken, auth.requireEspecialista);

function getDateRangeFromQuery(req) {
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(to);
    if (!req.query.from) {
        from.setDate(to.getDate() - 30);
    }

    const toIso = (d) => {
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
    };

    return { from: toIso(from), to: toIso(to) };
}

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

// =========================
// Estadísticas / Reportes
// =========================

// Logs de ingresos al sistema
router.get(
    '/stats/logins',
    [
        query('from').optional().isISO8601().withMessage('from debe ser una fecha ISO (YYYY-MM-DD)'),
        query('to').optional().isISO8601().withMessage('to debe ser una fecha ISO (YYYY-MM-DD)'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit inválido')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { from, to } = getDateRangeFromQuery(req);
            const limit = req.query.limit ? Number(req.query.limit) : 200;

            if (!from || !to) {
                return res.status(400).json({ success: false, message: 'Rango de fechas inválido' });
            }

            const rows = await database.query(
                `
                SELECT 
                    l.usuario_uid,
                    COALESCE(l.email, e.email) AS usuario,
                    to_char(l.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS dia,
                    to_char(l.created_at AT TIME ZONE 'UTC', 'HH24:MI') AS hora,
                    l.created_at
                FROM login_logs l
                LEFT JOIN especialistas e ON e.uid = l.usuario_uid
                WHERE (l.created_at::date) BETWEEN $1::date AND $2::date
                ORDER BY l.created_at DESC
                LIMIT $3
                `,
                [from, to, limit]
            );

            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error al obtener logs de login:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
);

// Cantidad de turnos por especialista (rango)
router.get(
    '/stats/turnos-por-especialista',
    [
        query('from').optional().isISO8601().withMessage('from debe ser una fecha ISO (YYYY-MM-DD)'),
        query('to').optional().isISO8601().withMessage('to debe ser una fecha ISO (YYYY-MM-DD)')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { from, to } = getDateRangeFromQuery(req);
            if (!from || !to) {
                return res.status(400).json({ success: false, message: 'Rango de fechas inválido' });
            }

            const rows = await database.query(
                `
                SELECT
                    t.especialista_uid,
                    e.email AS especialista_email,
                    e.especialidad,
                    COUNT(*)::int AS cantidad
                FROM turnos t
                JOIN especialistas e ON e.uid = t.especialista_uid
                WHERE t.fecha BETWEEN $1::date AND $2::date
                GROUP BY 1, 2, 3
                ORDER BY cantidad DESC, especialista_email ASC
                `,
                [from, to]
            );

            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error al obtener turnos por especialista:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
);

// Cantidad de turnos por día (incluye especialista) (rango)
router.get(
    '/stats/turnos-por-dia',
    [
        query('from').optional().isISO8601().withMessage('from debe ser una fecha ISO (YYYY-MM-DD)'),
        query('to').optional().isISO8601().withMessage('to debe ser una fecha ISO (YYYY-MM-DD)')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { from, to } = getDateRangeFromQuery(req);
            if (!from || !to) {
                return res.status(400).json({ success: false, message: 'Rango de fechas inválido' });
            }

            const rows = await database.query(
                `
                SELECT
                    to_char(t.fecha, 'YYYY-MM-DD') AS dia,
                    t.especialista_uid,
                    e.email AS especialista_email,
                    e.especialidad,
                    COUNT(*)::int AS cantidad
                FROM turnos t
                JOIN especialistas e ON e.uid = t.especialista_uid
                WHERE t.fecha BETWEEN $1::date AND $2::date
                GROUP BY 1, 2, 3, 4
                ORDER BY dia ASC, especialista_email ASC
                `,
                [from, to]
            );

            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error al obtener turnos por día:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
);

// Turnos completados por médico en un lapso de tiempo
router.get(
    '/stats/completados-por-medico',
    [
        query('from').optional().isISO8601().withMessage('from debe ser una fecha ISO (YYYY-MM-DD)'),
        query('to').optional().isISO8601().withMessage('to debe ser una fecha ISO (YYYY-MM-DD)')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { from, to } = getDateRangeFromQuery(req);
            if (!from || !to) {
                return res.status(400).json({ success: false, message: 'Rango de fechas inválido' });
            }

            const rows = await database.query(
                `
                SELECT
                    t.especialista_uid,
                    e.email AS especialista_email,
                    e.especialidad,
                    COUNT(*)::int AS cantidad_completados
                FROM turnos t
                JOIN especialistas e ON e.uid = t.especialista_uid
                WHERE t.estado = 'completado'
                  AND t.fecha BETWEEN $1::date AND $2::date
                GROUP BY 1, 2, 3
                ORDER BY cantidad_completados DESC, especialista_email ASC
                `,
                [from, to]
            );

            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error al obtener completados por médico:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
);


module.exports = router;