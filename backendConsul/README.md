# Backend Consultorio Médico

Backend para la gestión de un consultorio médico con especialidades de Kinesiología y Odontología.

## Características

- **Autenticación JWT** para especialistas
- **Gestión de pacientes** por especialidad
- **Sistema de turnos** con validaciones
- **Horarios de disponibilidad** configurables
- **Fichas kinesicas** para kinesiólogos
- **Odontogramas** para odontólogos
- **Base de datos SQLite** para desarrollo
- **Validación de datos** con express-validator
- **Seguridad** con helmet y CORS

## Tecnologías

- Node.js
- Express.js
- Postgresql
- JWT (jsonwebtoken)
- bcryptjs
- express-validator
- helmet
- cors
- morgan

## Instalación

1. **Clonar el repositorio**
```bash
cd backendConsul
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env
```

4. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Credenciales Iniciales

El sistema se inicializa con dos especialistas predefinidos:

### Kinesióloga
- **Email:** kinesiologa@consultorio.com
- **Contraseña:** kinesiologa123

### Odontólogo
- **Email:** odontologo@consultorio.com
- **Contraseña:** odontologo123

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de especialistas
- `GET /api/auth/verify` - Verificar token
- `PUT /api/auth/change-password` - Cambiar contraseña

### Pacientes
- `GET /api/pacientes` - Obtener pacientes del especialista
- `GET /api/pacientes/:uid` - Obtener paciente específico
- `POST /api/pacientes` - Crear nuevo paciente
- `PUT /api/pacientes/:uid` - Actualizar paciente
- `DELETE /api/pacientes/:uid` - Eliminar paciente

### Turnos
- `GET /api/turnos` - Obtener turnos del especialista
- `GET /api/turnos/fecha/:fecha` - Obtener turnos por fecha
- `POST /api/turnos` - Crear nuevo turno
- `PUT /api/turnos/:uid` - Actualizar turno
- `PUT /api/turnos/:uid/cancelar` - Cancelar turno
- `PUT /api/turnos/:uid/completar` - Completar turno

### Horarios
- `GET /api/horarios` - Obtener horarios del especialista
- `PUT /api/horarios` - Actualizar horarios
- `GET /api/horarios/disponibles/:fecha` - Obtener horarios disponibles

### Fichas Kinesicas (Solo Kinesiólogos)
- `GET /api/fichas-kinesicas` - Obtener fichas del especialista
- `GET /api/fichas-kinesicas/paciente/:paciente_uid` - Obtener fichas de un paciente
- `GET /api/fichas-kinesicas/:id` - Obtener ficha específica
- `POST /api/fichas-kinesicas` - Crear nueva ficha
- `PUT /api/fichas-kinesicas/:id` - Actualizar ficha
- `DELETE /api/fichas-kinesicas/:id` - Eliminar ficha

### Odontogramas (Solo Odontólogos)
- `GET /api/odontogramas` - Obtener odontogramas del especialista
- `GET /api/odontogramas/paciente/:paciente_uid` - Obtener odontogramas de un paciente
- `GET /api/odontogramas/:id` - Obtener odontograma específico
- `POST /api/odontogramas` - Crear nuevo odontograma
- `PUT /api/odontogramas/:id` - Actualizar odontograma
- `DELETE /api/odontogramas/:id` - Eliminar odontograma

## Estructura de la Base de Datos

### Tablas Principales
- **usuarios** - Tabla base para todos los usuarios
- **especialistas** - Información específica de especialistas
- **pacientes** - Información específica de pacientes
- **horarios** - Horarios de disponibilidad de especialistas
- **turnos** - Turnos programados
- **fichas_kinesicas** - Fichas de kinesiología
- **odontogramas** - Odontogramas

## Seguridad

- **JWT** para autenticación
- **bcrypt** para hashear contraseñas
- **helmet** para headers de seguridad
- **CORS** configurado
- **Validación** de datos en todas las rutas
- **Autorización** por especialidad

## Desarrollo

### Scripts Disponibles
- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo con nodemon
- `npm test` - Ejecutar tests (pendiente de implementar)

### Variables de Entorno
- `PORT` - Puerto del servidor (default: 3000)
- `FRONTEND_URL` - URL del frontend para CORS
- `JWT_SECRET` - Secreto para JWT

## Notas Importantes

1. **Base de datos**: Se crea automáticamente en `src/database/consultorio.db`
2. **Especialistas iniciales**: Se crean automáticamente al iniciar por primera vez
3. **Validaciones**: Todas las rutas incluyen validación de datos
4. **Autorización**: Cada especialista solo puede acceder a sus propios datos
5. **Especialidades**: Los permisos están restringidos por especialidad

## Próximas Mejoras

- [ ] Tests unitarios y de integración
- [ ] Logging avanzado
- [ ] Rate limiting
- [ ] Documentación con Swagger
- [ ] Migración a PostgreSQL para producción
- [ ] Backup automático de base de datos 