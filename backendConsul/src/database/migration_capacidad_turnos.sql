-- Migración para agregar capacidad de turnos por especialidad

-- Agregar columna capacidad_turnos a la tabla especialistas
ALTER TABLE especialistas ADD COLUMN capacidad_turnos INTEGER DEFAULT 1;

-- Actualizar capacidad según especialidad
UPDATE especialistas SET capacidad_turnos = 4 WHERE especialidad = 'Kinesiologia';
UPDATE especialistas SET capacidad_turnos = 1 WHERE especialidad = 'Odontologia'; 