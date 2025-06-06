const { db } = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (user) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            
            db.run(
                `INSERT INTO users (name, email, password, email_verification_token, email_verified) 
                 VALUES (?, ?, ?, ?, ?)`,
                [name, email, hashedPassword, emailVerificationToken, false],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al crear usuario' });
                    }
                    
                    res.status(201).json({ 
                        message: 'Usuario registrado. Por favor verifica tu email.',
                        userId: this.lastID 
                    });
                }
            );
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            if (!user.email_verified) {
                return res.status(403).json({ error: 'Por favor verifica tu email primero' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({ 
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        db.get('SELECT * FROM users WHERE email_verification_token = ?', [token], (err, user) => {
            if (!user) {
                return res.status(400).json({ error: 'Token inválido o expirado' });
            }

            db.run(
                'UPDATE users SET email_verified = ?, email_verification_token = ? WHERE id = ?',
                [true, null, user.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al verificar email' });
                    }
                    
                    res.json({ message: 'Email verificado con éxito' });
                }
            );
        });
    } catch (error) {
        console.error('Error en verificación de email:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hora
            
            db.run(
                'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
                [resetToken, resetTokenExpiry, user.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al generar token' });
                    }
                    
                    res.json({ message: 'Email de recuperación enviado' });
                }
            );
        });
    } catch (error) {
        console.error('Error en olvidó contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        db.get('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?', 
            [token, Date.now()], 
            async (err, user) => {
                if (!user) {
                    return res.status(400).json({ error: 'Token inválido o expirado' });
                }
                
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                
                db.run(
                    `UPDATE users 
                     SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
                     WHERE id = ?`,
                    [hashedPassword, user.id],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Error al actualizar contraseña' });
                        }
                        
                        res.json({ message: 'Contraseña actualizada con éxito' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error en restablecer contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                console.error('DB error:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            // userId puede ser string o number, aseguramos comparación correcta
            if (String(user.id) !== String(userId)) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            res.json(user);
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, currentPassword, newPassword } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Nombre es requerido' });
        }

        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            // Si se está intentando cambiar la contraseña
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({ error: 'Contraseña actual requerida' });
                }
                
                const validPassword = await bcrypt.compare(currentPassword, user.password);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
                }
                
                if (newPassword.length < 8) {
                    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
                }
                
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                
                db.run(
                    'UPDATE users SET name = ?, password = ? WHERE id = ?',
                    [name, hashedPassword, userId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Error al actualizar perfil' });
                        }
                        
                        res.json({ message: 'Perfil y contraseña actualizados' });
                    }
                );
            } else {
                // Solo actualizar nombre
                db.run(
                    'UPDATE users SET name = ? WHERE id = ?',
                    [name, userId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Error al actualizar perfil' });
                        }
                        
                        res.json({ message: 'Perfil actualizado' });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};