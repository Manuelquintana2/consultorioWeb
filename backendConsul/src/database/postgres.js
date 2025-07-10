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
                tratamiento TEXT NOT NULL,
                evaluacion TEXT NOT NULL,
                observaciones TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
        `;

        await this.pool.query(createTablesQuery);
        console.log('Tablas creadas exitosamente');

        // Crear índices
        await this.createIndexes();
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
}

module.exports = new PostgresDatabase(); 