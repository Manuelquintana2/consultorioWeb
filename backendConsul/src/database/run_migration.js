const database = require('./postgres');

async function runMigration() {
    try {
        console.log('Ejecutando migración de capacidad de turnos...');
        
        // Agregar columna capacidad_turnos
        await database.run(`
            ALTER TABLE especialistas ADD COLUMN IF NOT EXISTS capacidad_turnos INTEGER DEFAULT 1
        `);
        
        // Actualizar capacidad según especialidad
        await database.run(`
            UPDATE especialistas SET capacidad_turnos = 4 WHERE especialidad = 'Kinesiologia'
        `);
        
        await database.run(`
            UPDATE especialistas SET capacidad_turnos = 1 WHERE especialidad = 'Odontologia'
        `);
        
        console.log('Migración completada exitosamente');
        
        // Verificar los cambios
        const especialistas = await database.query(`
            SELECT uid, email, especialidad, capacidad_turnos FROM especialistas
        `);
        
        console.log('Especialistas actualizados:', especialistas);
        
    } catch (error) {
        console.error('Error en la migración:', error);
    } finally {
        process.exit(0);
    }
}

runMigration(); 