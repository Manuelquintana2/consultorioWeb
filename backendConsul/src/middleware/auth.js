const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('../database/postgres');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';

const auth = {
    // Generar token JWT
    generateToken(uid, especialidad) {
        return jwt.sign(
            { uid, especialidad },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
    },

    // Middleware para verificar token
    verifyToken(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acceso requerido' 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido' 
            });
        }
    },

    // Middleware para verificar que sea especialista
    requireEspecialista(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Autenticación requerida' 
            });
        }

        // Verificar que el usuario sea especialista
        database.get(
            'SELECT especialidad FROM especialistas WHERE uid = $1',
            [req.user.uid]
        ).then(especialista => {
            if (!especialista) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Acceso denegado. Solo especialistas pueden acceder.' 
                });
            }
            req.especialista = especialista;
            next();
        }).catch(err => {
            console.error('Error al verificar especialista:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        });
    },

    // Middleware para verificar especialidad específica
    requireEspecialidad(especialidad) {
        return (req, res, next) => {
            if (!req.especialista) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Acceso denegado' 
                });
            }

            if (req.especialista.especialidad !== especialidad) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Acceso denegado. Solo especialistas de ${especialidad} pueden acceder.` 
                });
            }

            next();
        };
    },

    // Función para hashear contraseñas
    hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    },

    // Función para comparar contraseñas
    comparePassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }
};

module.exports = auth; 