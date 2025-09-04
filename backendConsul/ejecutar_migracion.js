const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_hMg3qznR1Lyk@ep-round-tree-a8ai1ufh-pooler.eastus2.azure.neon.tech/consultorio_db?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function ejecutarMigracion() {
    try {
        console.log('Conectando a la base de datos...');
        
        // Agregar campo tipo
        console.log('Agregando campo tipo...');
        await pool.query(`
            ALTER TABLE odontogramas 
            ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'adulto' CHECK(tipo IN ('adulto', 'nino'))
        `);
        
        // Actualizar odontogramas existentes
        console.log('Actualizando odontogramas existentes...');
        await pool.query(`
            UPDATE odontogramas 
            SET tipo = 'nino' 
            WHERE id IN (
                SELECT o.id 
                FROM odontogramas o
                JOIN piezas_odontograma p ON o.id = p.odontograma_id
                GROUP BY o.id
                HAVING COUNT(p.id) = 20
            )
        `);
        
        // Verificar resultados
        const resultado = await pool.query('SELECT tipo, COUNT(*) as cantidad FROM odontogramas GROUP BY tipo');
        console.log('Resultado de la migración:', resultado.rows);
        
        console.log('Migración completada exitosamente');
        
    } catch (error) {
        console.error('Error en la migración:', error);
    } finally {
        await pool.end();
    }
}

ejecutarMigracion();
