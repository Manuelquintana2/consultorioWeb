-- Esquema de base de datos para consultorio médico

-- Tabla de usuarios base
CREATE TABLE IF NOT EXISTS usuarios (
    uid TEXT PRIMARY KEY,
    lastLogin DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de especialistas
CREATE TABLE IF NOT EXISTS especialistas (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    especialidad TEXT CHECK(especialidad IN ('Kinesiologia', 'Odontologia')) NOT NULL,
    FOREIGN KEY (uid) REFERENCES usuarios(uid) ON DELETE CASCADE
);

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    uid TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    obraSocial TEXT NOT NULL,
    domicilio TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fechaNacimiento DATE NOT NULL,
    seccion TEXT CHECK(seccion IN ('Kinesiologia', 'Odontologia', 'Ambas')) NOT NULL,
    FOREIGN KEY (uid) REFERENCES usuarios(uid) ON DELETE CASCADE
);

-- Tabla de horarios de especialistas
CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    especialista_uid TEXT NOT NULL,
    lunes TEXT, -- JSON array de horarios
    martes TEXT, -- JSON array de horarios
    miercoles TEXT, -- JSON array de horarios
    jueves TEXT, -- JSON array de horarios
    viernes TEXT, -- JSON array de horarios
    sabado TEXT, -- JSON array de horarios
    FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS turnos (
    uid TEXT PRIMARY KEY,
    especialista_uid TEXT NOT NULL,
    paciente_uid TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TEXT NOT NULL,
    comentario TEXT,
    estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'cancelado', 'completado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE,
    FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE
);

-- Tabla de fichas kinesicas
CREATE TABLE IF NOT EXISTS fichas_kinesicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_uid TEXT NOT NULL,
    especialista_uid TEXT NOT NULL,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT NOT NULL,
    evaluacion TEXT NOT NULL,
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE,
    FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
);

-- Tabla de odontogramas
CREATE TABLE IF NOT EXISTS odontogramas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_uid TEXT NOT NULL,
    especialista_uid TEXT NOT NULL,
    dientes TEXT NOT NULL, -- JSON array de dientes
    estado TEXT NOT NULL,
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE,
    FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_turnos_especialista ON turnos(especialista_uid);
CREATE INDEX IF NOT EXISTS idx_turnos_paciente ON turnos(paciente_uid);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_fichas_paciente ON fichas_kinesicas(paciente_uid);
CREATE INDEX IF NOT EXISTS idx_odontogramas_paciente ON odontogramas(paciente_uid);
CREATE INDEX IF NOT EXISTS idx_especialistas_email ON especialistas(email); 