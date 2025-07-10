const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'consultorio.db');
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error al conectar con la base de datos:', err);
                    reject(err);
                } else {
                    console.log('Conectado a la base de datos SQLite');
                    this.createTables()
                        .then(() => {
                            this.insertInitialData();
                            resolve();
                        })
                        .catch(reject);
                }
            });
        });
    }

    async createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error al crear las tablas:', err);
                    reject(err);
                } else {
                    console.log('Tablas creadas exitosamente');
                    resolve();
                }
            });
        });
    }

    async insertInitialData() {
        // Insertar especialistas iniciales si no existen
        const checkQuery = "SELECT COUNT(*) as count FROM especialistas";
        
        this.db.get(checkQuery, [], (err, row) => {
            if (err) {
                console.error('Error al verificar datos iniciales:', err);
                return;
            }

            if (row.count === 0) {
                const bcrypt = require('bcryptjs');
                const kinesiologaPassword = bcrypt.hashSync('kinesiologa123', 10);
                const odontologoPassword = bcrypt.hashSync('odontologo123', 10);

                // Insertar usuarios base
                this.db.run(
                    "INSERT INTO usuarios (uid) VALUES (?), (?)",
                    ['esp_kinesiologa', 'esp_odontologo'],
                    (err) => {
                        if (err) {
                            // Puede que ya existan, ignora el error
                        }
                        // Insertar especialistas
                        this.db.run(
                            "INSERT INTO especialistas (uid, email, password, especialidad) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
                            [
                                'esp_kinesiologa', 'kinesiologa@consultorio.com', kinesiologaPassword, 'Kinesiologia',
                                'esp_odontologo', 'odontologo@consultorio.com', odontologoPassword, 'Odontologia'
                            ],
                            (err) => {
                                if (err) {
                                    // Puede que ya existan, ignora el error
                                } else {
                                    console.log('Datos iniciales insertados exitosamente');
                                    console.log('Credenciales iniciales:');
                                    console.log('Kinesióloga: kinesiologa@consultorio.com / kinesiologa123');
                                    console.log('Odontólogo: odontologo@consultorio.com / odontologo123');
                                }
                            }
                        );
                    }
                );
            }
        });
    }

    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error al cerrar la base de datos:', err);
                } else {
                    console.log('Base de datos cerrada');
                }
            });
        }
    }
}

module.exports = new Database(); 