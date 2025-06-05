const { db } = require('../database');

exports.getAllTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filter, sort } = req.query;
        
        let query = 'SELECT * FROM tasks WHERE user_id = ?';
        const params = [userId];
        
        // Aplicar filtros
        if (filter === 'completed') {
            query += ' AND completed = 1';
        } else if (filter === 'pending') {
            query += ' AND completed = 0';
        }
        
        // Aplicar ordenamiento
        if (sort === 'newest') {
            query += ' ORDER BY created_at DESC';
        } else if (sort === 'oldest') {
            query += ' ORDER BY created_at ASC';
        } else if (sort === 'priority') {
            query += ' ORDER BY CASE priority WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END';
        }
        
        db.all(query, params, (err, tasks) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener tareas' });
            }
            
            res.json(tasks);
        });
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        
        db.get(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId],
            (err, task) => {
                if (!task) {
                    return res.status(404).json({ error: 'Tarea no encontrada' });
                }
                
                res.json(task);
            }
        );
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.createTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, category, priority } = req.body;
        
        if (!title || !category || !priority) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        if (title.length > 255) {
            return res.status(400).json({ error: 'El título es demasiado largo' });
        }
        
        const validCategories = ['personal', 'work', 'shopping', 'study', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Categoría inválida' });
        }
        
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ error: 'Prioridad inválida' });
        }
        
        db.run(
            `INSERT INTO tasks (user_id, title, category, priority) 
             VALUES (?, ?, ?, ?)`,
            [userId, title, category, priority],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al crear tarea' });
                }
                
                db.get(
                    'SELECT * FROM tasks WHERE id = ?',
                    [this.lastID],
                    (err, task) => {
                        res.status(201).json(task);
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const { title, category, priority, completed } = req.body;
        
        if (title && title.length > 255) {
            return res.status(400).json({ error: 'El título es demasiado largo' });
        }
        
        const validCategories = ['personal', 'work', 'shopping', 'study', 'other'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({ error: 'Categoría inválida' });
        }
        
        const validPriorities = ['low', 'medium', 'high'];
        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({ error: 'Prioridad inválida' });
        }
        
        // Construir la consulta dinámicamente
        let query = 'UPDATE tasks SET ';
        const params = [];
        const updates = [];
        
        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }
        
        if (priority !== undefined) {
            updates.push('priority = ?');
            params.push(priority);
        }
        
        if (completed !== undefined) {
            updates.push('completed = ?');
            params.push(completed ? 1 : 0);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nada que actualizar' });
        }
        
        query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
        params.push(taskId, userId);
        
        db.run(query, params, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar tarea' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }
            
            db.get(
                'SELECT * FROM tasks WHERE id = ?',
                [taskId],
                (err, task) => {
                    res.json(task);
                }
            );
        });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        
        db.run(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al eliminar tarea' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Tarea no encontrada' });
                }
                
                res.sendStatus(204);
            }
        );
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getTaskStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        db.get(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority
             FROM tasks 
             WHERE user_id = ?`,
            [userId],
            (err, stats) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al obtener estadísticas' });
                }
                
                res.json({
                    total: stats.total || 0,
                    completed: stats.completed || 0,
                    pending: stats.pending || 0,
                    highPriority: stats.high_priority || 0
                });
            }
        );
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.searchTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { query } = req.query;
        
        if (!query || query.trim().length < 3) {
            return res.status(400).json({ error: 'La búsqueda debe tener al menos 3 caracteres' });
        }
        
        db.all(
            `SELECT * FROM tasks 
             WHERE user_id = ? AND title LIKE ? 
             ORDER BY created_at DESC`,
            [userId, `%${query}%`],
            (err, tasks) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al buscar tareas' });
                }
                
                res.json(tasks);
            }
        );
    } catch (error) {
        console.error('Error al buscar tareas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};