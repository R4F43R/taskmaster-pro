// tasks.js - Gestión de tareas

let tasks = JSON.parse(localStorage.getItem('taskmaster_tasks')) || [];
let currentTaskId = null;

// Elementos del DOM
const addTaskBtn = document.getElementById('add-task-btn');
const taskForm = document.getElementById('task-form');
const taskFormElements = document.getElementById('task-form-elements');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const saveTaskBtn = document.getElementById('save-task-btn');
const tasksContainer = document.getElementById('tasks-container');
const filterSelect = document.getElementById('filter-select');
const searchInput = document.getElementById('search-input');
const formTitle = document.getElementById('form-title');

// Mostrar formulario para nueva tarea
addTaskBtn.addEventListener('click', () => {
    currentTaskId = null;
    taskForm.style.display = 'block';
    taskFormElements.reset();
    formTitle.textContent = 'Nueva Tarea';
});

// Cancelar formulario
cancelTaskBtn.addEventListener('click', () => {
    taskForm.style.display = 'none';
    taskFormElements.reset();
});

// Guardar tarea
taskFormElements.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const dueDate = document.getElementById('task-due').value;
    const priority = document.getElementById('task-priority').value;
    
    const taskData = {
        id: currentTaskId || Date.now(),
        userId: currentUser.id,
        title,
        description,
        dueDate,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    if (currentTaskId) {
        // Editar tarea existente
        const index = tasks.findIndex(task => task.id === currentTaskId);
        if (index !== -1) {
            tasks[index] = taskData;
        }
    } else {
        // Crear nueva tarea
        tasks.push(taskData);
    }
    
    localStorage.setItem('taskmaster_tasks', JSON.stringify(tasks));
    renderTasks();
    
    taskForm.style.display = 'none';
    taskFormElements.reset();
});

// Filtrar y buscar tareas
filterSelect.addEventListener('change', renderTasks);
searchInput.addEventListener('input', renderTasks);

// Renderizar tareas
function renderTasks() {
    if (!currentUser) return;
    
    const filter = filterSelect.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    // Filtrar tareas del usuario actual
    let filteredTasks = tasks.filter(task => 
        task.userId === currentUser.id
    );
    
    // Aplicar filtro de estado
    if (filter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // Aplicar búsqueda
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) || 
            task.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Generar HTML de tareas
    tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = '<p class="no-tasks">No se encontraron tareas</p>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <span class="task-priority priority-${task.priority}">
                    ${task.priority === 'high' ? 'Alta' : 
                      task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
            </div>
            <p>${task.description || 'Sin descripción'}</p>
            <div class="task-due">
                <i class="far fa-calendar-alt"></i>
                ${task.dueDate ? 'Vence: ' + new Date(task.dueDate).toLocaleDateString() : 'Sin fecha límite'}
            </div>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleTaskComplete(${task.id})">
                    ${task.completed ? 'Reabrir' : 'Completar'}
                </button>
                <button class="edit-btn" onclick="editTask(${task.id})">Editar</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Eliminar</button>
            </div>
        `;
        tasksContainer.appendChild(taskElement);
    });
}

// Editar tarea
window.editTask = function(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        currentTaskId = taskId;
        taskForm.style.display = 'block';
        formTitle.textContent = 'Editar Tarea';
        
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-due').value = task.dueDate || '';
        document.getElementById('task-priority').value = task.priority;
    }
};

// Eliminar tarea
window.deleteTask = function(taskId) {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('taskmaster_tasks', JSON.stringify(tasks));
        renderTasks();
    }
};

// Alternar estado de completado
window.toggleTaskComplete = function(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('taskmaster_tasks', JSON.stringify(tasks));
        renderTasks();
    }
};

// Inicializar tareas
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        renderTasks();
    }
});