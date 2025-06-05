// auth.js - Gestión de autenticación de usuarios

// Simulación de base de datos de usuarios
let users = JSON.parse(localStorage.getItem('taskmaster_users')) || [
    {
        id: 1,
        name: "Usuario Demo",
        email: "demo@taskmaster.com",
        password: "demo123"
    }
];

// Usuario actual
let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

// Elementos del DOM
const authSection = document.getElementById('auth-section');
const tasksSection = document.getElementById('tasks-section');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const authButtons = document.getElementById('auth-buttons');
const userSection = document.getElementById('user-section');
const usernameDisplay = document.getElementById('username-display');

// Mostrar formulario de registro
registerBtn.addEventListener('click', () => {
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
});

// Mostrar formulario de login
loginBtn.addEventListener('click', () => {
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
});

// Registro de usuario
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // Validar si el usuario ya existe
    if (users.some(user => user.email === email)) {
        alert('El correo electrónico ya está registrado');
        return;
    }
    
    // Crear nuevo usuario
    const newUser = {
        id: Date.now(),
        name,
        email,
        password
    };
    
    users.push(newUser);
    localStorage.setItem('taskmaster_users', JSON.stringify(users));
    
    alert('Registro exitoso. Ahora puedes iniciar sesión');
    registerForm.reset();
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
});

// Inicio de sesión
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const user = users.find(user => 
        user.email === email && user.password === password
    );
    
    if (user) {
        // Guardar usuario en sesión
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        
        // Actualizar UI
        updateAuthUI();
        alert(`Bienvenido, ${user.name}`);
    } else {
        alert('Credenciales incorrectas');
    }
    
    loginForm.reset();
});

// Cerrar sesión
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    updateAuthUI();
    alert('Sesión cerrada correctamente');
});

// Actualizar la UI según el estado de autenticación
function updateAuthUI() {
    if (currentUser) {
        authSection.style.display = 'none';
        tasksSection.style.display = 'block';
        authButtons.style.display = 'none';
        userSection.style.display = 'flex';
        usernameDisplay.textContent = currentUser.name;
    } else {
        authSection.style.display = 'block';
        tasksSection.style.display = 'none';
        authButtons.style.display = 'flex';
        userSection.style.display = 'none';
        loginCard.style.display = 'block';
        registerCard.style.display = 'none';
    }
}

// Inicializar UI
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});