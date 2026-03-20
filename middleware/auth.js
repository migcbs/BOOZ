const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// ======================================================
// MIDDLEWARE: Verificar token JWT
// Protege cualquier ruta donde se use
// ======================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// ======================================================
// FACTORY: Verificar rol(es) permitidos
// Uso: requireRole('admin') o requireRole('admin', 'coach')
// Siempre debe ir DESPUÉS de verifyToken
// ======================================================
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.` 
            });
        }
        next();
    };
};

// ======================================================
// HELPER: Verificar que el usuario solo accede a sus datos
// Para rutas donde el cliente solo puede ver/editar lo suyo
// ======================================================
const requireOwnerOrRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado.' });
        }
        const isAllowedRole = roles.includes(req.user.role);
        const isOwner = req.user.email === req.params.email || 
                        req.user.id === req.params.id;

        if (!isAllowedRole && !isOwner) {
            return res.status(403).json({ error: 'Solo puedes acceder a tus propios datos.' });
        }
        next();
    };
};

module.exports = { verifyToken, requireRole, requireOwnerOrRole };