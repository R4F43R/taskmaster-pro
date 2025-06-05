let tasks = [];

// Elementos del DOM
const taskList = document.getElementById('taskList');
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const prioritySelect = document.getElementById('prioritySelect');
const addButton = document.getElementById('addButton');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const pendingCount = document.getElementById('pendingCount');
const highPriorityCount = document.getElementById('highPriorityCount');

// Obtener token de autenticación
function getAuthToken() {
    return localStorage.getItem('token');
}

// Función para mostrar snackbar
function showSnackbar(message, type = 'success') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = `snackbar ${type}`;
    snackbar.style.display = 'block';
    
    setTimeout(() => {
        snackbar.style.display = 'none';
    }, 3000);
}

// Cargar tareas desde el servidor
async function loadTasks() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            tasks = await response.json();
            renderTasks();
            updateStats();
        } else {
            showSnackbar('Error al cargar tareas', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
}

// Renderizar lista de tareas
function renderTasks() {
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>¡No hay tareas todavía!</p>
                <p>Agrega tu primera tarea usando el formulario superior.</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority;
        taskItem.dataset.completed = task.completed;
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category">${getCategoryName(task.category)}</span>
                    <span class="task-priority priority-${task.priority}">${getPriorityName(task.priority)}</span>
                    <span>${new Date(task.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Eventos para los controles de la tarea
        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id, checkbox.checked));
        
        const deleteBtn = taskItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        const editBtn = taskItem.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editTask(task.id));
        
        taskList.appendChild(taskItem);
    });
}

// Obtener nombre de categoría
function getCategoryName(category) {
    const categories = {
        'personal': 'Personal',
        'work': 'Trabajo',
        'shopping': 'Compras',
        'study': 'Estudio',
        'other': 'Otro'
    };
    return categories[category] || category;
}

// Obtener nombre de prioridad
function getPriorityName(priority) {
    const priorities = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta'
    };
    return priorities[priority] || priority;
}

// Actualizar estadísticas
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(task => task.priority === 'high').length;
    
    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    highPriorityCount.textContent = highPriority;
}

// Agregar nueva tarea
addButton.addEventListener('click', async function() {
    const title = taskInput.value.trim();
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    
    if (!title) {
        showSnackbar('Por favor ingresa una tarea', 'error');
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, category, priority })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            tasks.push(data);
            renderTasks();
            updateStats();
            taskInput.value = '';
            showSnackbar('Tarea agregada correctamente');
        } else {
            showSnackbar(data.error || 'Error al agregar tarea', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
});

// Permitir añadir tarea con Enter
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addButton.click();
    }
});

// Cambiar estado de tarea
async function toggleTaskStatus(taskId, completed) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });
        
        if (response.ok) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = completed;
                updateStats();
            }
        } else {
            showSnackbar('Error al actualizar tarea', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
}

// Eliminar tarea
async function deleteTask(taskId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            tasks = tasks.filter(task => task.id !== taskId);
            renderTasks();
            updateStats();
            showSnackbar('Tarea eliminada');
        } else {
            showSnackbar('Error al eliminar tarea', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
}

// Editar tarea
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newTitle = prompt('Editar tarea:', task.title);
    if (newTitle && newTitle.trim() !== task.title) {
        updateTaskTitle(taskId, newTitle.trim());
    }
}

// Actualizar título de tarea
async function updateTaskTitle(taskId, newTitle) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle })
        });
        
        if (response.ok) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.title = newTitle;
                renderTasks();
                showSnackbar('Tarea actualizada');
            }
        } else {
            showSnackbar('Error al actualizar tarea', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión. Verifica la URL del backend.', 'error');
    }
}

// Filtros
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Actualizar botón activo
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Aplicar filtro
        const filter = this.dataset.filter;
        applyFilter(filter);
    });
});

function applyFilter(filter) {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        switch(filter) {
            case 'all':
                item.style.display = 'flex';
                break;
            case 'completed':
                item.style.display = item.dataset.completed === 'true' ? 'flex' : 'none';
                break;
            case 'pending':
                item.style.display = item.dataset.completed === 'false' ? 'flex' : 'none';
                break;
        }
    });
}

// Búsqueda
searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    
    if (query.length > 2) {
        filterTasksByQuery(query);
    } else {
        renderTasks();
    }
});

clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    renderTasks();
});

function filterTasksByQuery(query) {
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(query)
    );
    
    renderFilteredTasks(filteredTasks);
}

function renderFilteredTasks(filteredTasks) {
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron tareas</p>
                <p>Intenta con otro término de búsqueda</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = '';
    
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority;
        taskItem.dataset.completed = task.completed;
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category">${getCategoryName(task.category)}</span>
                    <span class="task-priority priority-${task.priority}">${getPriorityName(task.priority)}</span>
                    <span>${new Date(task.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id, checkbox.checked));
        
        const deleteBtn = taskItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        const editBtn = taskItem.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editTask(task.id));
        
        taskList.appendChild(taskItem);
    });
}

// Inicializar al cargar
loadTasks();