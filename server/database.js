const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Configurar ruta de la base de datos
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'taskmaster.db');

// Crear directorio data si no existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Crear tabla de usuarios
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    email_verification_token TEXT,
                    email_verified BOOLEAN DEFAULT 0,
                    reset_token TEXT,
                    reset_token_expiry INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Crear tabla de tareas
            db.run(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    completed BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            `);
            
            // Crear tabla de feedback
            db.run(`
                CREATE TABLE IF NOT EXISTS feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            `);
            
            // Crear índices para mejorar el rendimiento
            db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
            db.run('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
            db.run('CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)');
            
            // Crear usuario admin si no existe
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@taskmaster.com';
            db.get('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, user) => {
                if (!user) {
                    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
                    const hashedPassword = await bcrypt.hash(adminPassword, 10);
                    
                    db.run(
                        `INSERT INTO users (name, email, password, role, email_verified) 
                         VALUES (?, ?, ?, ?, ?)`,
                        ['Administrador', adminEmail, hashedPassword, 'admin', 1]
                    );
                }
                resolve();
            });
        });
    });
}

module.exports = { db, initializeDatabase };