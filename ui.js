// ui.js - Funciones auxiliares de interfaz de usuario

// Actualizar fecha mínima en el campo de fecha
document.getElementById('task-due').min = new Date().toISOString().split('T')[0];

// Alternar visibilidad de secciones
document.getElementById('tasks-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        authSection.style.display = 'none';
        tasksSection.style.display = 'block';
    } else {
        alert('Debes iniciar sesión para ver tus tareas');
    }
});

// Mostrar notificaciones
function showNotification(message, type = 'success') {
    // Eliminar notificaciones previas
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Desvanecer después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar estilos para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateY(-100%);
        transition: all 0.3s ease;
        z-index: 1000;
    }
    
    .success {
        background-color: #4CAF50;
    }
    
    .error {
        background-color: #F44336;
    }
    
    .warning {
        background-color: #FF9800;
    }
`;
document.head.appendChild(notificationStyles);