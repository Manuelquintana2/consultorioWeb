const { Pool } = require('pg');

// Configuración de Neon PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_hMg3qznR1Lyk@ep-round-tree-a8ai1ufh-pooler.eastus2.azure.neon.tech/consultorio_db?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function ejecutarMigracionNeon() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectando a Neon PostgreSQL...');
        
        // 1. Agregar campo tipo a la tabla odontogramas
        console.log('📝 Agregando campo tipo a la tabla odontogramas...');
        await client.query(`
            ALTER TABLE odontogramas 
            ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'adulto' CHECK(tipo IN ('adulto', 'nino'))
        `);
        console.log('✅ Campo tipo agregado exitosamente');
        
        // 2. Verificar odontogramas existentes
        console.log('🔍 Verificando odontogramas existentes...');
        const odontogramas = await client.query('SELECT id, tipo FROM odontogramas ORDER BY id');
        console.log('📊 Odontogramas encontrados:', odontogramas.rows);
        
        // 3. Actualizar odontogramas que tienen exactamente 20 piezas (niños)
        console.log('👶 Actualizando odontogramas de niños...');
        const resultadoNinos = await client.query(`
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
        console.log(`✅ ${resultadoNinos.rowCount} odontogramas actualizados a tipo 'nino'`);
        
        // 4. Verificar el resultado final
        console.log('📈 Verificando resultado final...');
        const resultadoFinal = await client.query(`
            SELECT tipo, COUNT(*) as cantidad 
            FROM odontogramas 
            GROUP BY tipo 
            ORDER BY tipo
        `);
        console.log('📊 Distribución final por tipo:', resultadoFinal.rows);
        
        // 5. Mostrar algunos ejemplos de piezas por tipo
        console.log('🔍 Ejemplos de piezas por tipo:');
        const ejemplos = await client.query(`
            SELECT o.id, o.tipo, COUNT(p.id) as cantidad_piezas, 
                   ARRAY_AGG(p.numero_pieza ORDER BY p.numero_pieza) as numeros_piezas
            FROM odontogramas o
            LEFT JOIN piezas_odontograma p ON o.id = p.odontograma_id
            GROUP BY o.id, o.tipo
            ORDER BY o.id
            LIMIT 5
        `);
        console.log('📋 Ejemplos:', ejemplos.rows);
        
        console.log('🎉 ¡Migración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
        console.log('🔌 Conexión cerrada');
    }
}

// Ejecutar la migración
ejecutarMigracionNeon()
    .then(() => {
        console.log('✅ Migración finalizada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
