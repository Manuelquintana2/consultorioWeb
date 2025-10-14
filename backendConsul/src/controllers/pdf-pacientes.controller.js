const database = require('../database/postgres');
const fs = require('fs').promises;
const path = require('path');

const PDF_PACIENTES = {
    // Obtener todos los PDFs de un paciente
    getAllByPaciente: async (uidPaciente) => {
        return await database.query(
            `SELECT id, uid_paciente, path, fecha_subida 
             FROM pdf_pacientes 
             WHERE uid_paciente = $1 
             ORDER BY fecha_subida DESC`,
            [uidPaciente]
        );
    },

    // Obtener un PDF por ID
    getById: async (id) => {
        return await database.get(
            `SELECT id, uid_paciente, path, fecha_subida 
             FROM pdf_pacientes 
             WHERE id = $1`,
            [id]
        );
    },

    // Crear un nuevo registro de PDF
    create: async (uidPaciente, filePath) => {
        const result = await database.run(
            `INSERT INTO pdf_pacientes (uid_paciente, path, fecha_subida) 
             VALUES ($1, $2, NOW()) 
             RETURNING id, uid_paciente, path, fecha_subida`,
            [uidPaciente, filePath]
        );
        return result;
    },

    // Eliminar un PDF
    delete: async (id) => {
        return await database.run(
            `DELETE FROM pdf_pacientes WHERE id = $1`,
            [id]
        );
    },

    // Verificar si el paciente pertenece a la especialidad del usuario
    verifyPacienteAccess: async (uidPaciente, especialidad) => {
        return await database.get(
            `SELECT p.uid 
             FROM pacientes p 
             WHERE p.uid = $1 AND (p.seccion = $2 OR p.seccion = 'Ambas')`,
            [uidPaciente, especialidad]
        );
    },

    // Eliminar archivo físico del servidor
    deleteFile: async (filePath) => {
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            return false;
        }
    }
};

module.exports = PDF_PACIENTES;

