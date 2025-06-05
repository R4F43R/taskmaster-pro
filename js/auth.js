// Configuración de la API - IMPORTANTE: CAMBIAR POR LA URL DE TU BACKEND EN RENDER
const API_BASE_URL = "https://taskmaster-backend-2cu9.onrender.com";

// Elementos del DOM
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');

// Función para mostrar snackbar (temporal)
function showSnackbar(message, type = 'success') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = `snackbar ${type}`;
    snackbar.style.display = 'block';
    
    setTimeout(() => {
        snackbar.style.display = 'none';
    }, 3000);
}

// Registrar nuevo usuario
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSnackbar('Cuenta creada con éxito. Por favor inicia sesión.');
            // Cambiar a pestaña de login
            loginTab.click();
            // Limpiar formulario
            registerForm.reset();
        } else {
            showSnackbar(data.error || 'Error al registrar', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
});

// Iniciar sesión
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar token y datos de usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Mostrar aplicación
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            userName.textContent = data.user.name;
            
            // Cargar tareas
            if (typeof loadTasks === 'function') {
                loadTasks();
            }
            
            showSnackbar(`Bienvenido, ${data.user.name}`);
        } else {
            showSnackbar(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
});

// Cerrar sesión
logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    appContainer.style.display = 'none';
    authContainer.style.display = 'block';
    loginForm.reset();
    showSnackbar('Sesión cerrada correctamente');
});

// Cambiar entre login y registro
loginTab.addEventListener('click', function() {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    registerTab.classList.remove('active');
    loginTab.classList.add('active');
});

registerTab.addEventListener('click', function() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
});

// Verificar si hay sesión activa al cargar la página
function checkSession() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.id) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        userName.textContent = user.name;
        
        if (typeof loadTasks === 'function') {
            loadTasks();
        }
    }
}

// Inicializar al cargar
checkSession();