const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class PostgresDatabase {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://neondb_owner:npg_hMg3qznR1Lyk@ep-round-tree-a8ai1ufh-pooler.eastus2.azure.neon.tech/consultorio_db?sslmode=require&channel_binding=require',
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    async init() {
        try {
            // Probar conexión
            const client = await this.pool.connect();
            console.log('Conectado a PostgreSQL en Neon');
            client.release();

            // Crear tablas
            await this.createTables();
            
            // Insertar datos iniciales
            await this.insertInitialData();
            
            console.log('Base de datos PostgreSQL inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar PostgreSQL:', error);
            throw error;
        }
    }

    async createTables() {
        const createTablesQuery = `
            -- Tabla de usuarios base
            CREATE TABLE IF NOT EXISTS usuarios (
                uid VARCHAR(255) PRIMARY KEY,
                lastLogin TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabla de especialistas
            CREATE TABLE IF NOT EXISTS especialistas (
                uid VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                especialidad VARCHAR(50) CHECK(especialidad IN ('Kinesiologia', 'Odontologia')) NOT NULL,
                FOREIGN KEY (uid) REFERENCES usuarios(uid) ON DELETE CASCADE
            );

            -- Tabla de pacientes
            CREATE TABLE IF NOT EXISTS pacientes (
                uid VARCHAR(255) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                obraSocial VARCHAR(255) NOT NULL,
                domicilio TEXT NOT NULL,
                telefono VARCHAR(50) NOT NULL,
                fechaNacimiento DATE NOT NULL,
                seccion VARCHAR(50) CHECK(seccion IN ('Kinesiologia', 'Odontologia', 'Ambas')) NOT NULL,
                FOREIGN KEY (uid) REFERENCES usuarios(uid) ON DELETE CASCADE
            );

            -- Tabla de horarios de especialistas
            CREATE TABLE IF NOT EXISTS horarios (
                id SERIAL PRIMARY KEY,
                especialista_uid VARCHAR(255) NOT NULL,
                lunes JSONB DEFAULT '[]',
                martes JSONB DEFAULT '[]',
                miercoles JSONB DEFAULT '[]',
                jueves JSONB DEFAULT '[]',
                viernes JSONB DEFAULT '[]',
                sabado JSONB DEFAULT '[]',
                FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
            );

            -- Tabla de turnos
            CREATE TABLE IF NOT EXISTS turnos (
                uid VARCHAR(255) PRIMARY KEY,
                especialista_uid VARCHAR(255) NOT NULL,
                paciente_uid VARCHAR(255) NOT NULL,
                fecha DATE NOT NULL,
                hora VARCHAR(5) NOT NULL,
                comentario TEXT,
                estado VARCHAR(20) DEFAULT 'activo' CHECK(estado IN ('activo', 'cancelado', 'completado')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE,
                FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE
            );

            -- Tabla de fichas kinesicas
            CREATE TABLE IF NOT EXISTS fichas_kinesicas (
                id SERIAL PRIMARY KEY,
                paciente_uid VARCHAR(255) NOT NULL,
                especialista_uid VARCHAR(255) NOT NULL,
                diagnostico TEXT NOT NULL,
                evaluacion TEXT NOT NULL,
                sintomas TEXT NOT NULL,
                estudios JSONB DEFAULT '[]',
                tratamiento TEXT NOT NULL,
                sesiones JSONB DEFAULT '[]',
                observaciones TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE,
                FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
            );

            -- Tabla de odontogramas
            CREATE TABLE IF NOT EXISTS odontogramas (
                id SERIAL PRIMARY KEY,
                paciente_uid VARCHAR(255) NOT NULL,
                especialista_uid VARCHAR(255) NOT NULL,
                dientes JSONB NOT NULL,
                estado VARCHAR(255) NOT NULL,
                observaciones TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE,
                FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
            );

            -- Tabla de piezas de odontograma
            CREATE TABLE IF NOT EXISTS piezas_odontograma (
                id SERIAL PRIMARY KEY,
                odontograma_id INTEGER NOT NULL,
                numero_pieza INTEGER NOT NULL,
                simbolo VARCHAR(10),
                simbolo_color VARCHAR(20),
                FOREIGN KEY (odontograma_id) REFERENCES odontogramas(id) ON DELETE CASCADE
            );

            -- Tabla de partes de pieza
            CREATE TABLE IF NOT EXISTS partes_pieza (
                id SERIAL PRIMARY KEY,
                pieza_odontograma_id INTEGER NOT NULL,
                nombre_parte VARCHAR(255) NOT NULL,
                estado VARCHAR(255) NOT NULL,
                tratamiento TEXT,
                color VARCHAR(50),
                observaciones TEXT,
                FOREIGN KEY (pieza_odontograma_id) REFERENCES piezas_odontograma(id) ON DELETE CASCADE
            );
        `;

        await this.pool.query(createTablesQuery);
        console.log('Tablas creadas exitosamente');

        // Crear índices
        await this.createIndexes();
        
        // Ejecutar migraciones
        await this.runMigrations();
    }

    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_turnos_especialista ON turnos(especialista_uid)',
            'CREATE INDEX IF NOT EXISTS idx_turnos_paciente ON turnos(paciente_uid)',
            'CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha)',
            'CREATE INDEX IF NOT EXISTS idx_fichas_paciente ON fichas_kinesicas(paciente_uid)',
            'CREATE INDEX IF NOT EXISTS idx_odontogramas_paciente ON odontogramas(paciente_uid)',
            'CREATE INDEX IF NOT EXISTS idx_especialistas_email ON especialistas(email)'
        ];

        for (const index of indexes) {
            await this.pool.query(index);
        }
        console.log('Índices creados exitosamente');
    }

    async runMigrations() {
        try {
            // Migración: Agregar campos simbolo y simbolo_color a piezas_odontograma
            await this.pool.query(`
                ALTER TABLE piezas_odontograma 
                ADD COLUMN IF NOT EXISTS simbolo VARCHAR(10),
                ADD COLUMN IF NOT EXISTS simbolo_color VARCHAR(20)
            `);
            console.log('Migraciones ejecutadas exitosamente');
        } catch (error) {
            console.error('Error al ejecutar migraciones:', error);
        }
    }

    async insertInitialData() {
        try {
            // Verificar si ya existen especialistas
            const checkResult = await this.pool.query('SELECT COUNT(*) as count FROM especialistas');
            
            if (checkResult.rows[0].count === '0') {
                const kinesiologaPassword = bcrypt.hashSync('kinesiologa123', 10);
                const odontologoPassword = bcrypt.hashSync('odontologo123', 10);

                // Insertar usuarios base
                await this.pool.query(`
                    INSERT INTO usuarios (uid) VALUES 
                    ('esp_kinesiologa'),
                    ('esp_odontologo')
                `);

                // Insertar especialistas
                await this.pool.query(`
                    INSERT INTO especialistas (uid, email, password, especialidad) VALUES 
                    ('esp_kinesiologa', 'kinesiologa@consultorio.com', $1, 'Kinesiologia'),
                    ('esp_odontologo', 'odontologo@consultorio.com', $2, 'Odontologia')
                `, [kinesiologaPassword, odontologoPassword]);

                console.log('Datos iniciales insertados exitosamente');
                console.log('Credenciales iniciales:');
                console.log('Kinesióloga: kinesiologa@consultorio.com / kinesiologa123');
                console.log('Odontólogo: odontologo@consultorio.com / odontologo123');
            }
        } catch (error) {
            console.error('Error al insertar datos iniciales:', error);
        }
    }

    async query(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return result.rows;
    }

    async get(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return result.rows[0] || null;
    }

    async run(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return {
            id: result.rows[0]?.id,
            changes: result.rowCount
        };
    }

    async close() {
        await this.pool.end();
        console.log('Conexión a PostgreSQL cerrada');
    }

    // ODONTOGRAMAS RELACIONAL

    // Crear odontograma
    async crearOdontograma(paciente_uid, especialista_uid, observaciones) {
        const result = await this.pool.query(
            'INSERT INTO odontogramas (paciente_uid, especialista_uid, observaciones) VALUES ($1, $2, $3) RETURNING *',
            [paciente_uid, especialista_uid, observaciones]
        );
        return result.rows[0];
    }

    // Crear pieza de odontograma
    async crearPiezaOdontograma(odontograma_id, numero_pieza, simbolo = '', simbolo_color = '') {
        const result = await this.pool.query(
            'INSERT INTO piezas_odontograma (odontograma_id, numero_pieza, simbolo, simbolo_color) VALUES ($1, $2, $3, $4) RETURNING *',
            [odontograma_id, numero_pieza, simbolo, simbolo_color]
        );
        return result.rows[0];
    }

    // Crear parte de pieza
    async crearPartePieza(pieza_odontograma_id, nombre_parte, estado, tratamiento, color, observaciones) {
        const result = await this.pool.query(
            'INSERT INTO partes_pieza (pieza_odontograma_id, nombre_parte, estado, tratamiento, color, observaciones) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [pieza_odontograma_id, nombre_parte, estado, tratamiento, color, observaciones]
        );
        return result.rows[0];
    }

    // Obtener odontograma completo (con piezas y partes)
    async obtenerOdontogramaCompleto(id) {
        const odontograma = await this.get('SELECT * FROM odontogramas WHERE id = $1', [id]);
        if (!odontograma) return null;
        const piezas = await this.query('SELECT * FROM piezas_odontograma WHERE odontograma_id = $1', [id]);
        for (const pieza of piezas) {
            // Normalizar nombres de campos para el frontend
            pieza.simboloColor = pieza.simbolo_color;
            delete pieza.simbolo_color;
            
            pieza.partes = await this.query('SELECT * FROM partes_pieza WHERE pieza_odontograma_id = $1', [pieza.id]);
        }
        odontograma.piezas = piezas;
        return odontograma;
    }

    // Actualizar observaciones de odontograma
    async actualizarOdontograma(id, observaciones) {
        await this.pool.query('UPDATE odontogramas SET observaciones = $1 WHERE id = $2', [observaciones, id]);
    }

    // Eliminar odontograma (borrado en cascada)
    async eliminarOdontograma(id) {
        await this.pool.query('DELETE FROM odontogramas WHERE id = $1', [id]);
    }

    // Eliminar todas las piezas de un odontograma (para actualización)
    async eliminarPiezasOdontograma(odontograma_id) {
        await this.pool.query('DELETE FROM piezas_odontograma WHERE odontograma_id = $1', [odontograma_id]);
    }

    // Actualizar pieza de odontograma
    async actualizarPiezaOdontograma(pieza_id, simbolo, simbolo_color) {
        await this.pool.query(
            'UPDATE piezas_odontograma SET simbolo = $1, simbolo_color = $2 WHERE id = $3',
            [simbolo, simbolo_color, pieza_id]
        );
    }

    // Actualizar partes de una pieza
    async actualizarPartesPieza(pieza_id, partes) {
        // Eliminar partes existentes
        await this.pool.query('DELETE FROM partes_pieza WHERE pieza_odontograma_id = $1', [pieza_id]);
        
        // Crear nuevas partes
        for (const parte of partes) {
            await this.crearPartePieza(
                pieza_id,
                parte.nombre_parte,
                parte.estado,
                parte.tratamiento,
                parte.color,
                parte.observaciones
            );
        }
    }

    // Eliminar una pieza específica
    async eliminarPiezaOdontograma(pieza_id) {
        await this.pool.query('DELETE FROM piezas_odontograma WHERE id = $1', [pieza_id]);
    }
}

module.exports = new PostgresDatabase(); 