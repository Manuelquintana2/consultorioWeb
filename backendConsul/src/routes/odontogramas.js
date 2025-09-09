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
        res.json({ success: true, data: odontogramas });
    } catch (error) {
        console.error('Error al obtener odontogramas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
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

// Obtener odontograma completo por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const odontograma = await database.obtenerOdontogramaCompleto(id);
        if (!odontograma) {
            return res.status(404).json({ success: false, message: 'Odontograma no encontrado' });
        }
        res.json({ success: true, data: odontograma });
    } catch (error) {
        console.error('Error al obtener odontograma:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Crear nuevo odontograma (solo piezas modificadas)
router.post('/', async (req, res) => {
    try {
        const { paciente_uid, atenciones, piezas, tipo } = req.body;

        if (!paciente_uid || !Array.isArray(piezas)) {
            return res.status(400).json({ success: false, message: 'Datos inválidos' });
        }
        
        // Validar que atenciones sea un array si se envía
        if (atenciones && !Array.isArray(atenciones)) {
            return res.status(400).json({ success: false, message: 'Atenciones debe ser un array' });
        }
        console.log('Atenciones recibidas:', atenciones);
        // Crear odontograma con campo atenciones (jsonb)
        const odontograma = await database.crearOdontograma(
            paciente_uid,
            req.user.uid,
            atenciones || [],  // se guarda array vacío si no mandan nada
            tipo || 'adulto'
        );

        // Procesar piezas
        for (const pieza of piezas) {
            const piezaDb = await database.crearPiezaOdontograma(
                odontograma.id,
                pieza.numero_pieza,
                pieza.simbolo || '',
                pieza.simboloColor || ''
            );

            for (const parte of pieza.partes) {
                await database.crearPartePieza(
                    piezaDb.id,
                    parte.nombre_parte,
                    parte.estado || '',
                    parte.tratamiento || '',
                    parte.color || '',
                    parte.observaciones || ''
                );
            }
        }

        const odontogramaCompleto = await database.obtenerOdontogramaCompleto(odontograma.id);
        res.status(201).json({
            success: true,
            message: 'Odontograma creado',
            data: odontogramaCompleto
        });
    } catch (error) {
        console.error('Error al crear odontograma:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Actualizar odontograma (solo piezas modificadas)
// Actualizar odontograma (solo piezas modificadas)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente_uid, atenciones, piezas, tipo } = req.body;

    if (!paciente_uid || !Array.isArray(piezas)) {
      return res.status(400).json({ success: false, message: 'Datos inválidos' });
    }

    console.log('Atenciones recibidas:', atenciones);

    // Obtener odontograma actual
    const odontogramaActual = await database.query(
      'SELECT * FROM odontogramas WHERE id = $1 AND paciente_uid = $2',
      [id, paciente_uid]
    );

    if (!odontogramaActual.length) {
      return res.status(404).json({ success: false, message: 'Odontograma no encontrado' });
    }

    const odontogramaDb = odontogramaActual[0];

    // Si no se envían atenciones, mantener las existentes
    const atencionesFinales = atenciones !== undefined
      ? atenciones
      : odontogramaDb.atenciones || [];

    // Actualizar odontograma con atenciones y tipo
    await database.actualizarOdontograma(
      id,
      atencionesFinales,
      tipo || odontogramaDb.tipo || 'adulto'
    );

    // Obtener piezas existentes
    const piezasExistentes = await database.query(
      'SELECT * FROM piezas_odontograma WHERE odontograma_id = $1',
      [id]
    );

    const piezasExistentesMap = new Map();
    piezasExistentes.forEach(pieza => {
      piezasExistentesMap.set(pieza.numero_pieza, pieza);
    });

    // Procesar piezas
    for (const pieza of piezas) {
      const piezaExistente = piezasExistentesMap.get(pieza.numero_pieza);

      if (piezaExistente) {
        // Actualizar pieza
        await database.actualizarPiezaOdontograma(
          piezaExistente.id,
          pieza.simbolo || '',
          pieza.simboloColor || ''
        );

        await database.actualizarPartesPieza(piezaExistente.id, pieza.partes);
        piezasExistentesMap.delete(pieza.numero_pieza);
      } else {
        // Nueva pieza
        const piezaDb = await database.crearPiezaOdontograma(
          id,
          pieza.numero_pieza,
          pieza.simbolo || '',
          pieza.simboloColor || ''
        );

        for (const parte of pieza.partes) {
          await database.crearPartePieza(
            piezaDb.id,
            parte.nombre_parte,
            parte.estado || '',
            parte.tratamiento || '',
            parte.color || '',
            parte.observaciones || ''
          );
        }
      }
    }

    // Eliminar piezas que no se mandaron
    for (const piezaExistente of piezasExistentesMap.values()) {
      await database.eliminarPiezaOdontograma(piezaExistente.id);
    }

    const odontogramaCompleto = await database.obtenerOdontogramaCompleto(id);
    res.json({ success: true, message: 'Odontograma actualizado', data: odontogramaCompleto });

  } catch (error) {
    console.error('Error al actualizar odontograma:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar odontograma
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await database.eliminarOdontograma(id);
        res.json({ success: true, message: 'Odontograma eliminado' });
    } catch (error) {
        console.error('Error al eliminar odontograma:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

module.exports = router; 