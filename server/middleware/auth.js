// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

const authorize = (req, res, next) => {
    const userId = req.params.userId;
    
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    
    next();
};

module.exports = { authenticate, authorize };