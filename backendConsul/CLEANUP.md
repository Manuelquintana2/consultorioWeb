# Limpieza del Proyecto - Backend

## Archivos Eliminados

### Base de Datos
- `consultorio.db` - Base de datos SQLite (96KB) - Ya no se usa, migrado a PostgreSQL
- `database.js` - Configuración de SQLite - Reemplazado por `postgres.js`
- `schema.sql` - Esquema de SQLite - Ya no necesario

### Migraciones (Ya Ejecutadas)
- `migration_fichas_kinesicas.sql` - Migración de fichas kinesicas
- `run_migration.js` - Script de ejecución de migración
- `run_migration_fichas.js` - Script específico para fichas
- `migrate_postgres_fichas.js` - Migración a PostgreSQL
- `run_force_migration.js` - Script de migración forzada
- `force_migration_fichas.sql` - Migración forzada de fichas
- `check_table_structure.js` - Verificación de estructura
- `migration_capacidad_turnos.sql` - Migración de capacidad de turnos

### Dependencias
- `sqlite3` - Driver de SQLite - Ya no necesario, migrado a PostgreSQL

## Archivos Mantenidos

### Base de Datos
- `postgres.js` - Configuración y conexión a PostgreSQL (Neon)

### Rutas
- `auth.js` - Autenticación
- `pacientes.js` - Gestión de pacientes
- `turnos.js` - Gestión de turnos
- `horarios.js` - Gestión de horarios
- `fichas-kinesicas.js` - Gestión de fichas kinesicas
- `odontogramas.js` - Gestión de odontogramas

## Logs de Debug Eliminados

Se eliminaron todos los logs de debug temporales que se agregaron para solucionar problemas:
- Logs de carga de fichas
- Logs de actualización de estudios y sesiones
- Logs de creación de fichas
- Logs de parseo de JSON

Se mantuvieron solo los logs de error importantes para el debugging en producción.

## Estado Actual

✅ **Proyecto limpio y optimizado**
✅ **Solo archivos necesarios**
✅ **Sin logs de debug innecesarios**
✅ **Base de datos PostgreSQL funcionando correctamente**
✅ **Todas las funcionalidades operativas**
✅ **Dependencias optimizadas**

## Espacio Liberado

- **Base de datos SQLite**: ~96KB
- **Archivos de migración**: ~20KB
- **Logs de debug**: ~5KB
- **Dependencia sqlite3**: ~120 paquetes eliminados
- **Total**: ~121KB + dependencias liberados

## Beneficios de la Limpieza

1. **Mejor rendimiento**: Menos archivos que cargar
2. **Mantenimiento más fácil**: Solo archivos relevantes
3. **Menor tamaño del proyecto**: ~121KB liberados
4. **Dependencias optimizadas**: Solo lo necesario
5. **Código más limpio**: Sin logs de debug innecesarios 

# Migración SQL para nueva estructura de odontogramas

```sql
-- Eliminar tablas antiguas si existen (haz backup si tienes datos importantes)
DROP TABLE IF EXISTS partes_pieza CASCADE;
DROP TABLE IF EXISTS piezas_odontograma CASCADE;
DROP TABLE IF EXISTS odontogramas CASCADE;

-- Tabla principal de odontogramas
CREATE TABLE odontogramas (
    id SERIAL PRIMARY KEY,
    paciente_uid VARCHAR(255) NOT NULL,
    especialista_uid VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (paciente_uid) REFERENCES pacientes(uid) ON DELETE CASCADE,
    FOREIGN KEY (especialista_uid) REFERENCES especialistas(uid) ON DELETE CASCADE
);

-- Tabla de piezas de cada odontograma
CREATE TABLE piezas_odontograma (
    id SERIAL PRIMARY KEY,
    odontograma_id INTEGER REFERENCES odontogramas(id) ON DELETE CASCADE,
    numero_pieza INTEGER NOT NULL
);

-- Tabla de partes de cada pieza
CREATE TABLE partes_pieza (
    id SERIAL PRIMARY KEY,
    pieza_odontograma_id INTEGER REFERENCES piezas_odontograma(id) ON DELETE CASCADE,
    nombre_parte VARCHAR(20) NOT NULL, -- ej: vestibular, lingual, mesial, distal, oclusal
    estado VARCHAR(30),                -- ej: ausente, extracción, sano, etc.
    tratamiento VARCHAR(30),           -- ej: corona, prótesis fija, etc.
    color VARCHAR(10),                 -- ej: rojo, azul
    observaciones TEXT
);
```

---

**Siguiente paso:** Adaptar el backend para trabajar con esta nueva estructura relacional (crear, leer, actualizar y eliminar odontogramas, piezas y partes). 