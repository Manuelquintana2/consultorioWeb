export interface UsuarioDetails {
    uid?: string;
    lastLogin?: Date;
}

export interface Paciente extends UsuarioDetails {
    nombre: string;
    obraSocial: string;
    domicilio: string;
    telefono: string;
    fechaNacimiento: Date;
    seccion: 'Kinesiologia' | 'Odontologia' | 'Ambas';
}

export interface Especialista extends UsuarioDetails {
    email: string;
    password: string;
    especialidad: 'Kinesiologia' | 'Odontologia'
}

export type Horarios = {
    lunes: string[];
    martes: string[];
    miercoles: string[];
    jueves: string[];
    viernes: string[];
    sabado: string[];
};

export interface Turno {
    uid?: string;
    especialista_uid: string;
    fecha: string;
    hora: string;
    paciente_uid: string;
    comentario?: string;
}

export interface ZonaDiente {
    nombre: 'M' | 'D' | 'O' | 'V' | 'L';  // Mesial, Distal, Oclusal, Vestibular, Lingual
    estado: string;  // Estado del diente (sano, caries, restaurado, etc.)
}

export interface Diente {
    id: number;  // ID del diente (1 a 32)
    tipo: 'permanente' | 'temporal' | 'mixto';  // Tipo de diente (permanente, temporal o mixto)
    zonas: ZonaDiente[];  // Zonas del diente
}

export interface FichaKinesica {
    id?: number;
    paciente_uid: string;
    especialista_uid: string;
    diagnostico: string;
    evaluacion: string;
    sintomas: string;
    estudios?: string[]; // Array de estudios realizados
    tratamiento: string;
    sesiones: SesionKinesica[]; // Array de sesiones con fechas
    observaciones?: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

export interface SesionKinesica {
    numero: number;
    fecha: string;
    descripcion?: string;
    notas?: string;
}

export interface Odontograma {
    paciente_uid: string;
    dientes: string[];
    estado: string;
    observaciones: string;
    fecha_creacion: string;
} 