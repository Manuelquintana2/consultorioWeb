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
    paciente_id: number;
    diagnostico: string;
    tratamiento: string;
    evaluacion: string;
    observaciones: string;
}

export interface Odontograma {
    paciente_id: number;
    dientes: string[];
    estado: string;
    observaciones: string;
} 