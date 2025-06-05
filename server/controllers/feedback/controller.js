const { db } = require('../database');

exports.submitFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, message } = req.body;
        
        if (!type || !message) {
            return res.status(400).json({ error: 'Tipo y mensaje son requeridos' });
        }
        
        if (message.length > 1000) {
            return res.status(400).json({ error: 'El mensaje es demasiado largo' });
        }
        
        const validTypes = ['suggestion', 'bug', 'other'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Tipo de feedback inválido' });
        }
        
        db.run(
            'INSERT INTO feedback (user_id, type, message) VALUES (?, ?, ?)',
            [userId, type, message],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al enviar feedback' });
                }
                
                res.status(201).json({ message: 'Feedback enviado con éxito' });
            }
        );
    } catch (error) {
        console.error('Error al enviar feedback:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getUserFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        
        db.all(
            'SELECT id, type, message, created_at FROM feedback WHERE user_id = ? ORDER BY created_at DESC',
            [userId],
            (err, feedback) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener feedback' });
                }
                
                res.json(feedback);
            }
        );
    } catch (error) {
        console.error('Error al obtener feedback:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getAllFeedback = async (req, res) => {
    try {
        // Solo para administradores
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        db.all(
            `SELECT f.id, f.type, f.message, f.created_at, u.name as user_name, u.email as user_email
             FROM feedback f
             JOIN users u ON f.user_id = u.id
             ORDER BY f.created_at DESC`,
            (err, feedback) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener feedback' });
                }
                
                res.json(feedback);
            }
        );
    } catch (error) {
        console.error('Error al obtener feedback:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.updateFeedbackStatus = async (req, res) => {
    try {
        // Solo para administradores
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const feedbackId = req.params.id;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        
        db.run(
            'UPDATE feedback SET status = ? WHERE id = ?',
            [status, feedbackId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al actualizar feedback' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Feedback no encontrado' });
                }
                
                res.json({ message: 'Estado actualizado' });
            }
        );
    } catch (error) {
        console.error('Error al actualizar feedback:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};