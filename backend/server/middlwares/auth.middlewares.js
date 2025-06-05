const jwt = require('jsonwebtoken');
const { db } = require('../database');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (!user) {
                return res.status(401).json({ error: 'Usuario no encontrado' });
            }
            
            req.user = user;
            next();
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        console.error('Error en autenticación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};