# Sistema de Gestión de Consultorio Médico

Sistema completo para la gestión de un consultorio médico con especialidades de Kinesiología y Odontología.

## 🏥 Características

### Funcionalidades Generales
- **Autenticación segura** con JWT para especialistas
- **Gestión de pacientes** por especialidad
- **Sistema de turnos** con validaciones
- **Horarios de disponibilidad** configurables
- **Interfaz moderna y responsive**

### Funcionalidades Específicas por Especialidad
- **Kinesiólogos**: Gestión de fichas kinesicas
- **Odontólogos**: Gestión de odontogramas

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **SQLite** para base de datos
- **JWT** para autenticación
- **bcryptjs** para encriptación
- **express-validator** para validaciones
- **helmet** y **cors** para seguridad

### Frontend
- **Angular 19** con TypeScript
- **Angular Material** para componentes UI
- **RxJS** para programación reactiva
- **date-fns** para manejo de fechas

## 📁 Estructura del Proyecto

```
consultorioWeb/
├── backendConsul/          # Backend Node.js
│   ├── src/
│   │   ├── database/       # Configuración de BD
│   │   ├── middleware/     # Middleware de auth
│   │   ├── routes/         # Rutas de la API
│   │   └── index.js        # Servidor principal
│   ├── package.json
│   └── README.md
├── consultorio/            # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Componentes
│   │   │   ├── services/   # Servicios
│   │   │   ├── guards/     # Guards de auth
│   │   │   └── interceptors/ # Interceptores HTTP
│   │   └── environments/   # Configuración
│   ├── package.json
│   └── angular.json
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn
- Angular CLI (para el frontend)

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd consultorioWeb
```

### 2. Configurar el Backend
```bash
cd backendConsul
npm install
cp env.example .env
npm run dev
```

### 3. Configurar el Frontend
```bash
cd consultorio
npm install
ng serve
```

## 🔐 Credenciales Iniciales

El sistema se inicializa con dos especialistas predefinidos:

### Kinesióloga
- **Email:** kinesiologa@consultorio.com
- **Contraseña:** kinesiologa123

### Odontólogo
- **Email:** odontologo@consultorio.com
- **Contraseña:** odontologo123

## 📊 Base de Datos

### Tablas Principales
- **usuarios** - Tabla base para todos los usuarios
- **especialistas** - Información específica de especialistas
- **pacientes** - Información específica de pacientes
- **horarios** - Horarios de disponibilidad
- **turnos** - Turnos programados
- **fichas_kinesicas** - Fichas de kinesiología
- **odontogramas** - Odontogramas

### Relaciones
- Cada especialista tiene su propia lista de pacientes
- Los pacientes pueden pertenecer a una o ambas especialidades
- Los turnos están vinculados a especialistas y pacientes
- Las fichas y odontogramas están restringidas por especialidad

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de especialistas
- `GET /api/auth/verify` - Verificar token
- `PUT /api/auth/change-password` - Cambiar contraseña

### Pacientes
- `GET /api/pacientes` - Obtener pacientes
- `POST /api/pacientes` - Crear paciente
- `PUT /api/pacientes/:uid` - Actualizar paciente
- `DELETE /api/pacientes/:uid` - Eliminar paciente

### Turnos
- `GET /api/turnos` - Obtener turnos
- `POST /api/turnos` - Crear turno
- `PUT /api/turnos/:uid` - Actualizar turno
- `PUT /api/turnos/:uid/cancelar` - Cancelar turno
- `PUT /api/turnos/:uid/completar` - Completar turno

### Horarios
- `GET /api/horarios` - Obtener horarios
- `PUT /api/horarios` - Actualizar horarios
- `GET /api/horarios/disponibles/:fecha` - Horarios disponibles

### Fichas Kinesicas (Solo Kinesiólogos)
- `GET /api/fichas-kinesicas` - Obtener fichas
- `POST /api/fichas-kinesicas` - Crear ficha
- `PUT /api/fichas-kinesicas/:id` - Actualizar ficha
- `DELETE /api/fichas-kinesicas/:id` - Eliminar ficha

### Odontogramas (Solo Odontólogos)
- `GET /api/odontogramas` - Obtener odontogramas
- `POST /api/odontogramas` - Crear odontograma
- `PUT /api/odontogramas/:id` - Actualizar odontograma
- `DELETE /api/odontogramas/:id` - Eliminar odontograma

## 🎨 Interfaz de Usuario

### Características del Frontend
- **Diseño responsive** que se adapta a diferentes dispositivos
- **Interfaz intuitiva** con navegación clara
- **Validaciones en tiempo real** en formularios
- **Notificaciones** para acciones del usuario
- **Temas visuales** consistentes

### Componentes Principales
- **Login** - Autenticación de especialistas
- **Dashboard** - Panel principal con acceso a todas las funciones
- **Gestión de Pacientes** - CRUD completo de pacientes
- **Gestión de Turnos** - Programación y gestión de turnos
- **Configuración de Horarios** - Definir disponibilidad
- **Fichas Kinesicas** - Gestión específica para kinesiólogos
- **Odontogramas** - Gestión específica para odontólogos

## 🔒 Seguridad

### Medidas Implementadas
- **Autenticación JWT** con tokens seguros
- **Encriptación de contraseñas** con bcrypt
- **Validación de datos** en todas las rutas
- **Autorización por especialidad** para funcionalidades específicas
- **Headers de seguridad** con helmet
- **CORS configurado** para el frontend
- **Interceptores HTTP** para manejo automático de tokens

### Permisos por Especialidad
- **Kinesiólogos**: Acceso a fichas kinesicas
- **Odontólogos**: Acceso a odontogramas
- **Ambos**: Gestión de pacientes, turnos y horarios

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
cd backendConsul
npm run dev

# Frontend
cd consultorio
ng serve
```

### Producción
```bash
# Backend
cd backendConsul
npm start

# Frontend
cd consultorio
ng build --prod
```

## 📝 Notas Importantes

1. **Base de datos**: Se crea automáticamente en desarrollo
2. **Variables de entorno**: Configurar según el entorno
3. **Puertos**: Backend en 3000, Frontend en 4200
4. **CORS**: Configurado para desarrollo local
5. **Logs**: El backend incluye logging detallado

## 🔮 Próximas Mejoras

- [ ] Tests unitarios y de integración
- [ ] Documentación con Swagger
- [ ] Migración a PostgreSQL para producción
- [ ] Sistema de notificaciones
- [ ] Reportes avanzados
- [ ] Backup automático
- [ ] PWA (Progressive Web App)
- [ ] Integración con sistemas externos

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo. 