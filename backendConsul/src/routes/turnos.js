const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/postgres');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.verifyToken, auth.requireEspecialista);

// Obtener todos los turnos del especialista
router.get('/', async (req, res) => {
    try {
        const turnos = await database.query(`
            SELECT t.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM turnos t
            JOIN pacientes p ON t.paciente_uid = p.uid
            WHERE t.especialista_uid = $1
            ORDER BY t.fecha DESC, t.hora DESC
        `, [req.user.uid]);

        res.json({
            success: true,
            data: turnos
        });
    } catch (error) {
        console.error('Error al obtener turnos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener turnos por fecha
router.get('/fecha/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;
        
        const turnos = await database.query(`
            SELECT t.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM turnos t
            JOIN pacientes p ON t.paciente_uid = p.uid
            WHERE t.especialista_uid = $1 AND t.fecha = $2
            ORDER BY t.hora
        `, [req.user.uid, fecha]);

        res.json({
            success: true,
            data: turnos
        });
    } catch (error) {
        console.error('Error al obtener turnos por fecha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear nuevo turno
router.post('/', [
    body('paciente_uid').notEmpty().withMessage('Paciente requerido'),
    body('fecha').isDate().withMessage('Fecha inválida'),
    body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida (formato HH:MM)'),
    body('comentario').optional()
], async (req, res) => {
    try {
        console.log('Datos recibidos para crear turno:', req.body);
        console.log('Usuario autenticado:', req.user);
        console.log('Especialista:', req.especialista);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Errores de validación:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { paciente_uid, fecha, hora, comentario } = req.body;

        // Verificar que el paciente existe y pertenece a la especialidad del especialista
        const paciente = await database.get(`
            SELECT seccion FROM pacientes 
            WHERE uid = $1 AND (seccion = $2 OR seccion = 'Ambas')
        `, [paciente_uid, req.especialista.especialidad]);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Verificar que la fecha no sea en el pasado
        const fechaTurno = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaTurno < hoy) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden crear turnos en fechas pasadas'
            });
        }

        // Verificar que el especialista tiene horarios para ese día
        const fechaObj = new Date(fecha);
        const diaSemana = fechaObj.getDay();
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const diaColumna = diasSemana[diaSemana];

        const horarios = await database.get(`
            SELECT ${diaColumna} FROM horarios 
            WHERE especialista_uid = $1
        `, [req.user.uid]);

        if (!horarios || !horarios[diaColumna]) {
            return res.status(400).json({
                success: false,
                message: `No tienes horarios configurados para el ${diaColumna}`
            });
        }

        // Parsear los horarios del día
        const parseJsonSafely = (jsonString) => {
            try {
                if (!jsonString) return [];
                if (Array.isArray(jsonString)) return jsonString;
                if (typeof jsonString === 'string') return JSON.parse(jsonString);
                return [];
            } catch (error) {
                return [];
            }
        };

        const horariosDelDia = parseJsonSafely(horarios[diaColumna]);
        
        if (horariosDelDia.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No tienes horarios configurados para el ${diaColumna}`
            });
        }

        // Verificar que la hora seleccionada está en los horarios configurados
        if (!horariosDelDia.includes(hora)) {
            return res.status(400).json({
                success: false,
                message: `La hora ${hora} no está disponible en tu horario del ${diaColumna}`
            });
        }

        // Obtener la capacidad de turnos del especialista
        const especialista = await database.get(`
            SELECT capacidad_turnos FROM especialistas 
            WHERE uid = $1
        `, [req.user.uid]);

        const capacidadTurnos = especialista?.capacidad_turnos || 1;

        // Verificar disponibilidad del horario considerando la capacidad
        const turnosEnHorario = await database.query(`
            SELECT COUNT(*) as count FROM turnos 
            WHERE especialista_uid = $1 AND fecha = $2 AND hora = $3 AND estado = 'activo'
        `, [req.user.uid, fecha, hora]);

        if (turnosEnHorario[0].count >= capacidadTurnos) {
            return res.status(400).json({
                success: false,
                message: `Ya no hay disponibilidad en ese horario. Capacidad máxima: ${capacidadTurnos} turnos`
            });
        }

        // Verificar que el paciente no tenga otro turno en la misma fecha
        const turnoPaciente = await database.get(`
            SELECT uid FROM turnos 
            WHERE paciente_uid = $1 AND fecha = $2 AND estado = 'activo'
        `, [paciente_uid, fecha]);

        if (turnoPaciente) {
            return res.status(400).json({
                success: false,
                message: 'El paciente ya tiene un turno en esa fecha'
            });
        }

        const uid = uuidv4();

        // Crear turno
        await database.run(`
            INSERT INTO turnos (uid, especialista_uid, paciente_uid, fecha, hora, comentario) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [uid, req.user.uid, paciente_uid, fecha, hora, comentario]);

        const turno = await database.get(`
            SELECT t.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM turnos t
            JOIN pacientes p ON t.paciente_uid = p.uid
            WHERE t.uid = $1
        `, [uid]);

        res.status(201).json({
            success: true,
            message: 'Turno creado exitosamente',
            data: turno
        });

    } catch (error) {
        console.error('Error al crear turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar turno
router.put('/:uid', [
    body('fecha').optional().isDate().withMessage('Fecha inválida'),
    body('hora').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida (formato HH:MM)'),
    body('comentario').optional()
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

        const { uid } = req.params;
        const { fecha, hora, comentario } = req.body;

        // Verificar que el turno existe y pertenece al especialista
        const turno = await database.get(`
            SELECT * FROM turnos 
            WHERE uid = $1 AND especialista_uid = $2
        `, [uid, req.user.uid]);

        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        if (turno.estado !== 'activo') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un turno cancelado o completado'
            });
        }

        // Si se está cambiando fecha/hora, verificar disponibilidad
        if (fecha || hora) {
            const nuevaFecha = fecha || turno.fecha;
            const nuevaHora = hora || turno.hora;

            // Verificar que la fecha no sea en el pasado
            const fechaTurno = new Date(nuevaFecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            if (fechaTurno < hoy) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden programar turnos en fechas pasadas'
                });
            }

            // Verificar que el especialista tiene horarios para ese día
            const fechaObj = new Date(nuevaFecha);
            const diaSemana = fechaObj.getDay();
            const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const diaColumna = diasSemana[diaSemana];

            const horarios = await database.get(`
                SELECT ${diaColumna} FROM horarios 
                WHERE especialista_uid = $1
            `, [req.user.uid]);

            if (!horarios || !horarios[diaColumna]) {
                return res.status(400).json({
                    success: false,
                    message: `No tienes horarios configurados para el ${diaColumna}`
                });
            }

            // Parsear los horarios del día
            const parseJsonSafely = (jsonString) => {
                try {
                    if (!jsonString) return [];
                    if (Array.isArray(jsonString)) return jsonString;
                    if (typeof jsonString === 'string') return JSON.parse(jsonString);
                    return [];
                } catch (error) {
                    return [];
                }
            };

            const horariosDelDia = parseJsonSafely(horarios[diaColumna]);
            
            if (horariosDelDia.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `No tienes horarios configurados para el ${diaColumna}`
                });
            }

            // Verificar que la hora seleccionada está en los horarios configurados
            if (!horariosDelDia.includes(nuevaHora)) {
                return res.status(400).json({
                    success: false,
                    message: `La hora ${nuevaHora} no está disponible en tu horario del ${diaColumna}`
                });
            }

            // Obtener la capacidad de turnos del especialista
            const especialista = await database.get(`
                SELECT capacidad_turnos FROM especialistas 
                WHERE uid = $1
            `, [req.user.uid]);

            const capacidadTurnos = especialista?.capacidad_turnos || 1;

            // Verificar disponibilidad del nuevo horario considerando la capacidad
            const turnosEnHorario = await database.query(`
                SELECT COUNT(*) as count FROM turnos 
                WHERE especialista_uid = $1 AND fecha = $2 AND hora = $3 AND estado = 'activo' AND uid != $4
            `, [req.user.uid, nuevaFecha, nuevaHora, uid]);

            if (turnosEnHorario[0].count >= capacidadTurnos) {
                return res.status(400).json({
                    success: false,
                    message: `Ya no hay disponibilidad en ese horario. Capacidad máxima: ${capacidadTurnos} turnos`
                });
            }

            // Verificar que el paciente no tenga otro turno en la nueva fecha
            const turnoPaciente = await database.get(`
                SELECT uid FROM turnos 
                WHERE paciente_uid = $1 AND fecha = $2 AND estado = 'activo' AND uid != $3
            `, [turno.paciente_uid, nuevaFecha, uid]);

            if (turnoPaciente) {
                return res.status(400).json({
                    success: false,
                    message: 'El paciente ya tiene un turno en esa fecha'
                });
            }
        }

        // Construir query de actualización
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (fecha) {
            updates.push(`fecha = $${paramIndex++}`);
            params.push(fecha);
        }
        if (hora) {
            updates.push(`hora = $${paramIndex++}`);
            params.push(hora);
        }
        if (comentario !== undefined) {
            updates.push(`comentario = $${paramIndex++}`);
            params.push(comentario);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron datos para actualizar'
            });
        }

        params.push(uid);

        await database.run(`
            UPDATE turnos 
            SET ${updates.join(', ')}
            WHERE uid = $${paramIndex}
        `, params);

        const turnoActualizado = await database.get(`
            SELECT t.*, p.nombre as paciente_nombre, p.telefono as paciente_telefono
            FROM turnos t
            JOIN pacientes p ON t.paciente_uid = p.uid
            WHERE t.uid = $1
        `, [uid]);

        res.json({
            success: true,
            message: 'Turno actualizado exitosamente',
            data: turnoActualizado
        });

    } catch (error) {
        console.error('Error al actualizar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Cancelar turno
router.put('/:uid/cancelar', async (req, res) => {
    try {
        const { uid } = req.params;

        // Verificar que el turno existe y pertenece al especialista
        const turno = await database.get(`
            SELECT * FROM turnos 
            WHERE uid = $1 AND especialista_uid = $2
        `, [uid, req.user.uid]);

        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        if (turno.estado !== 'activo') {
            return res.status(400).json({
                success: false,
                message: 'El turno ya no está activo'
            });
        }

        // Cancelar turno
        await database.run(`
            UPDATE turnos 
            SET estado = 'cancelado'
            WHERE uid = $1
        `, [uid]);

        res.json({
            success: true,
            message: 'Turno cancelado exitosamente'
        });

    } catch (error) {
        console.error('Error al cancelar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Completar turno
router.put('/:uid/completar', async (req, res) => {
    try {
        const { uid } = req.params;

        // Verificar que el turno existe y pertenece al especialista
        const turno = await database.get(`
            SELECT * FROM turnos 
            WHERE uid = $1 AND especialista_uid = $2
        `, [uid, req.user.uid]);

        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        if (turno.estado !== 'activo') {
            return res.status(400).json({
                success: false,
                message: 'El turno no está activo'
            });
        }

        // Completar turno
        await database.run(`
            UPDATE turnos 
            SET estado = 'completado'
            WHERE uid = $1
        `, [uid]);

        res.json({
            success: true,
            message: 'Turno completado exitosamente'
        });

    } catch (error) {
        console.error('Error al completar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 