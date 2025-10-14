const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const PDF_PACIENTES = require('../controllers/pdf-pacientes.controller');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.verifyToken, auth.requireEspecialista);

// Obtener todos los PDFs de un paciente
router.get('/paciente/:uidPaciente', [
    param('uidPaciente').isUUID().withMessage('UID de paciente inválido')
], async (req, res) => {
    try {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { uidPaciente } = req.params;

        // Verificar que el paciente pertenece a la especialidad del usuario
        const paciente = await PDF_PACIENTES.verifyPacienteAccess(
            uidPaciente, 
            req.especialista.especialidad
        );

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado o sin permisos'
            });
        }

        const pdfs = await PDF_PACIENTES.getAllByPaciente(uidPaciente);

        res.json({
            success: true,
            data: pdfs
        });

    } catch (error) {
        console.error('Error al obtener PDFs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener un PDF por ID
router.get('/:id', [
    param('id').isInt().withMessage('ID inválido')
], async (req, res) => {
    try {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const pdf = await PDF_PACIENTES.getById(id);

        if (!pdf) {
            return res.status(404).json({
                success: false,
                message: 'PDF no encontrado'
            });
        }

        // Verificar que el paciente pertenece a la especialidad del usuario
        const paciente = await PDF_PACIENTES.verifyPacienteAccess(
            pdf.uid_paciente, 
            req.especialista.especialidad
        );

        if (!paciente) {
            return res.status(403).json({
                success: false,
                message: 'Sin permisos para acceder a este PDF'
            });
        }

        res.json({
            success: true,
            data: pdf
        });

    } catch (error) {
        console.error('Error al obtener PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Subir un nuevo PDF para un paciente
router.post('/', upload.single('pdf'), [
    body('uidPaciente').isUUID().withMessage('UID de paciente inválido')
], async (req, res) => {
    try {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo PDF'
            });
        }

        const { uidPaciente } = req.body;

        // Verificar que el paciente pertenece a la especialidad del usuario
        const paciente = await PDF_PACIENTES.verifyPacienteAccess(
            uidPaciente, 
            req.especialista.especialidad
        );

        if (!paciente) {
            // Eliminar el archivo subido si no hay permisos
            await PDF_PACIENTES.deleteFile(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado o sin permisos'
            });
        }

        // Guardar solo la ruta relativa (uploads/pdfs/filename.pdf)
        const pathRelativo = req.file.path.replace(/\\/g, '/').split('src/')[1];
        
        // Crear registro en la base de datos
        const pdf = await PDF_PACIENTES.create(uidPaciente, pathRelativo);

        res.status(201).json({
            success: true,
            message: 'PDF subido exitosamente',
            data: pdf
        });

    } catch (error) {
        console.error('Error al subir PDF:', error);
        
        // Eliminar el archivo si hubo error
        if (req.file) {
            await PDF_PACIENTES.deleteFile(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar un PDF
router.delete('/:id', [
    param('id').isInt().withMessage('ID inválido')
], async (req, res) => {
    try {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;

        // Obtener el PDF
        const pdf = await PDF_PACIENTES.getById(id);

        if (!pdf) {
            return res.status(404).json({
                success: false,
                message: 'PDF no encontrado'
            });
        }

        // Verificar que el paciente pertenece a la especialidad del usuario
        const paciente = await PDF_PACIENTES.verifyPacienteAccess(
            pdf.uid_paciente, 
            req.especialista.especialidad
        );

        if (!paciente) {
            return res.status(403).json({
                success: false,
                message: 'Sin permisos para eliminar este PDF'
            });
        }

        // Eliminar de la base de datos
        await PDF_PACIENTES.delete(id);

        // Eliminar archivo físico
        await PDF_PACIENTES.deleteFile(pdf.path);

        res.json({
            success: true,
            message: 'PDF eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;

