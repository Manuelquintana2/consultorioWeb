const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.verifyToken, auth.requireEspecialista);

// Obtener horarios del especialista
router.get('/', async (req, res) => {
    try {
        const horarios = await database.get(`
            SELECT * FROM horarios 
            WHERE especialista_uid = $1
        `, [req.user.uid]);

        if (!horarios) {
            return res.json({
                success: true,
                data: {
                    lunes: [],
                    martes: [],
                    miercoles: [],
                    jueves: [],
                    viernes: [],
                    sabado: []
                }
            });
        }

        // Parsear los arrays JSON con manejo de errores
        const parseJsonSafely = (jsonString) => {
            try {
                if (!jsonString) return [];
                
                // Si ya es un array, devolverlo directamente
                if (Array.isArray(jsonString)) {
                    return jsonString;
                }
                
                // Si es un string, intentar parsearlo
                if (typeof jsonString === 'string') {
                    return JSON.parse(jsonString);
                }
                
                return [];
            } catch (error) {
                console.error('Error parsing JSON:', error, 'String:', jsonString);
                console.error('Type of jsonString:', typeof jsonString);
                return [];
            }
        };

        const horariosParsed = {
            lunes: parseJsonSafely(horarios.lunes),
            martes: parseJsonSafely(horarios.martes),
            miercoles: parseJsonSafely(horarios.miercoles),
            jueves: parseJsonSafely(horarios.jueves),
            viernes: parseJsonSafely(horarios.viernes),
            sabado: parseJsonSafely(horarios.sabado)
        };

        res.json({
            success: true,
            data: horariosParsed
        });
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar horarios del especialista
router.put('/', [
    body('lunes').isArray().withMessage('Lunes debe ser un array'),
    body('martes').isArray().withMessage('Martes debe ser un array'),
    body('miercoles').isArray().withMessage('Miércoles debe ser un array'),
    body('jueves').isArray().withMessage('Jueves debe ser un array'),
    body('viernes').isArray().withMessage('Viernes debe ser un array'),
    body('sabado').isArray().withMessage('Sábado debe ser un array'),
    body('lunes.*').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),
    body('martes.*').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),
    body('miercoles.*').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),
    body('jueves.*').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),
    body('viernes.*').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),
    body('sabado.*').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)')
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

        const { lunes, martes, miercoles, jueves, viernes, sabado } = req.body;

        // Verificar si ya existen horarios para este especialista
        const horariosExistentes = await database.get(`
            SELECT id FROM horarios 
            WHERE especialista_uid = $1
        `, [req.user.uid]);

        if (horariosExistentes) {
            // Actualizar horarios existentes
            const lunesJson = JSON.stringify(lunes);
            const martesJson = JSON.stringify(martes);
            const miercolesJson = JSON.stringify(miercoles);
            const juevesJson = JSON.stringify(jueves);
            const viernesJson = JSON.stringify(viernes);
            const sabadoJson = JSON.stringify(sabado);
            
            await database.run(`
                UPDATE horarios 
                SET lunes = $1, martes = $2, miercoles = $3, jueves = $4, viernes = $5, sabado = $6
                WHERE especialista_uid = $7
            `, [
                lunesJson,
                martesJson,
                miercolesJson,
                juevesJson,
                viernesJson,
                sabadoJson,
                req.user.uid
            ]);
        } else {
            // Crear nuevos horarios
            await database.run(`
                INSERT INTO horarios (especialista_uid, lunes, martes, miercoles, jueves, viernes, sabado)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                req.user.uid,
                JSON.stringify(lunes),
                JSON.stringify(martes),
                JSON.stringify(miercoles),
                JSON.stringify(jueves),
                JSON.stringify(viernes),
                JSON.stringify(sabado)
            ]);
        }

        res.json({
            success: true,
            message: 'Horarios actualizados exitosamente',
            data: {
                lunes,
                martes,
                miercoles,
                jueves,
                viernes,
                sabado
            }
        });

    } catch (error) {
        console.error('Error al actualizar horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener horarios disponibles para una fecha específica
router.get('/disponibles/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;

        // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
        // Parsear la fecha de manera segura para evitar problemas de zona horaria
        const [year, month, day] = fecha.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-11
        const diaSemana = fechaObj.getDay();

        // Mapear día de la semana a nombre de columna
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const diaColumna = diasSemana[diaSemana];
        
        console.log('Fecha recibida:', fecha);
        console.log('Fecha objeto:', fechaObj);
        console.log('Día de la semana:', diaSemana);
        console.log('Día columna:', diaColumna);

        // Obtener horarios del especialista para ese día
        const horarios = await database.get(`
            SELECT ${diaColumna} FROM horarios 
            WHERE especialista_uid = $1
        `, [req.user.uid]);

        if (!horarios || !horarios[diaColumna]) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Usar la misma función de parsing seguro
        const parseJsonSafely = (jsonString) => {
            try {
                if (!jsonString) return [];
                
                // Si ya es un array, devolverlo directamente
                if (Array.isArray(jsonString)) {
                    return jsonString;
                }
                
                // Si es un string, intentar parsearlo
                if (typeof jsonString === 'string') {
                    return JSON.parse(jsonString);
                }
                
                return [];
            } catch (error) {
                console.error('Error parsing JSON:', error, 'String:', jsonString);
                console.error('Type of jsonString:', typeof jsonString);
                return [];
            }
        };

        const horariosDisponibles = parseJsonSafely(horarios[diaColumna]);

        // Obtener la capacidad de turnos del especialista
        const especialista = await database.get(`
            SELECT capacidad_turnos FROM especialistas 
            WHERE uid = $1
        `, [req.user.uid]);

        const capacidadTurnos = especialista?.capacidad_turnos || 1;

        // Obtener turnos ya reservados para esa fecha con conteo
        const turnosReservados = await database.query(`
            SELECT hora, COUNT(*) as count FROM turnos 
            WHERE especialista_uid = $1 AND fecha = $2 AND estado = 'activo'
            GROUP BY hora
        `, [req.user.uid, fecha]);

        // Crear un mapa de horas ocupadas con su conteo
        const horasOcupadas = {};
        turnosReservados.forEach(turno => {
            horasOcupadas[turno.hora] = turno.count;
        });

        // Filtrar horarios disponibles considerando la capacidad
        const horariosLibres = horariosDisponibles.filter(hora => {
            const turnosEnHora = horasOcupadas[hora] || 0;
            return turnosEnHora < capacidadTurnos;
        });

        res.json({
            success: true,
            data: horariosLibres
        });

    } catch (error) {
        console.error('Error al obtener horarios disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 