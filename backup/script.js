


// Constantes y elementos del DOM
const DOM = {
    taskInput: document.getElementById('taskInput'),
    categorySelect: document.getElementById('categorySelect'),
    prioritySelect: document.getElementById('prioritySelect'),
    addButton: document.getElementById('addButton'),
    taskList: document.getElementById('taskList'),
    totalCount: document.getElementById('totalCount'),
    completedCount: document.getElementById('completedCount'),
    pendingCount: document.getElementById('pendingCount'),
    highPriorityCount: document.getElementById('highPriorityCount'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    clearBtn: document.getElementById('clearBtn'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    sortSelect: document.getElementById('sortSelect'),
    themeToggle: document.getElementById('themeToggle'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    feedbackBtn: document.getElementById('feedbackBtn'),
    feedbackModal: document.getElementById('feedbackModal'),
    closeModal: document.querySelector('.close-modal'),
    feedbackForm: document.getElementById('feedbackForm'),
    snackbar: document.getElementById('snackbar'),
    offlineStatus: document.getElementById('offlineStatus'),
    productivityChart: document.getElementById('productivityChart')
};

// ===== SISTEMA DE AUTENTICACIÓN MEJORADO =====
document.addEventListener('DOMContentLoaded', function() {
    // 1. Elementos del DOM para autenticación
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameSpan = document.getElementById('user-name');

    // 2. Mostrar notificación (usando tu función existente)
    function authSnackbar(message, isError = false) {
        if (window.showSnackbar) {
            showSnackbar(message, isError);
        } else {
            console.log(message);
        }
    }

    // 3. Base de datos de usuarios mejorada
    const userDB = {
        users: JSON.parse(localStorage.getItem('tm-users')) || [],
        
        save: function() {
            localStorage.setItem('tm-users', JSON.stringify(this.users));
        },
        
        findByEmail: function(email) {
            return this.users.find(user => user.email === email);
        },
        
        create: function(user) {
            // Validación básica
            if (!user.name || !user.email || !user.password) {
                throw new Error('Datos de usuario incompletos');
            }
            
            if (this.findByEmail(user.email)) {
                throw new Error('El email ya está registrado');
            }
            
            const newUser = {
                id: Date.now().toString(),
                name: user.name.trim(),
                email: user.email.toLowerCase().trim(),
                password: user.password, // En producción usar bcrypt
                createdAt: new Date().toISOString(),
                tasks: [] // Cada usuario tendrá sus propias tareas
            };
            
            this.users.push(newUser);
            this.save();
            return newUser;
        }
    };

    // 4. Manejo de sesión mejorado
    const auth = {
        currentUser: null,
        
        login: function(user) {
            this.currentUser = user;
            localStorage.setItem('tm-auth', JSON.stringify({
                userId: user.id,
                loggedIn: true,
                lastLogin: new Date().toISOString()
            }));
            this.showApp();
        },
        
        logout: function() {
            localStorage.removeItem('tm-auth');
            this.currentUser = null;
            this.showAuth();
        },
        
        check: function() {
            try {
                const authData = JSON.parse(localStorage.getItem('tm-auth'));
                if (authData && authData.loggedIn) {
                    const user = userDB.users.find(u => u.id === authData.userId);
                    if (user) {
                        this.currentUser = user;
                        this.showApp();
                        return true;
                    }
                }
                return false;
            } catch (e) {
                console.error('Error checking auth:', e);
                return false;
            }
        },
        
        showApp: function() {
            if (authContainer) authContainer.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
            if (userNameSpan && this.currentUser) {
                userNameSpan.textContent = this.currentUser.name;
            }
            
            // Cargar las tareas del usuario actual
            if (this.currentUser) {
                loadUserTasks(this.currentUser.id);
            }
        },
        
        showAuth: function() {
            if (authContainer) authContainer.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
            
            // Mostrar formulario de login por defecto
            if (loginTab && registerTab && loginForm && registerForm) {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.style.display = 'flex';
                registerForm.style.display = 'none';
            }
        }
    };

    // 5. Cargar tareas del usuario
    function loadUserTasks(userId) {
        const user = userDB.users.find(u => u.id === userId);
        if (user) {
            tasks = user.tasks || [];
            renderTasks();
            updateCounters();
        }
    }

    // 6. Guardar tareas del usuario
    function saveUserTasks(userId) {
        const user = userDB.users.find(u => u.id === userId);
        if (user) {
            user.tasks = tasks;
            userDB.save();
        }
    }

    // 7. Configurar event listeners con validación
    function setupAuthListeners() {
        // Tabs de login/registro
        if (loginTab && registerTab) {
            loginTab.addEventListener('click', (e) => {
                e.preventDefault();
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                if (loginForm) loginForm.style.display = 'flex';
                if (registerForm) registerForm.style.display = 'none';
            });

            registerTab.addEventListener('click', (e) => {
                e.preventDefault();
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                if (registerForm) registerForm.style.display = 'flex';
                if (loginForm) loginForm.style.display = 'none';
            });
        }

        // Formulario de login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email')?.value;
                const password = document.getElementById('login-password')?.value;

                if (!email || !password) {
                    authSnackbar('Por favor completa todos los campos', true);
                    return;
                }

                try {
                    const user = userDB.findByEmail(email);
                    if (!user || user.password !== password) {
                        authSnackbar('Credenciales incorrectas', true);
                        return;
                    }
                    
                    auth.login(user);
                    authSnackbar(`Bienvenido ${user.name}`);
                } catch (error) {
                    authSnackbar(error.message, true);
                }
            });
        }

        // Formulario de registro
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('register-name')?.value;
                const email = document.getElementById('register-email')?.value;
                const password = document.getElementById('register-password')?.value;

                try {
                    const user = userDB.create({ name, email, password });
                    auth.login(user);
                    authSnackbar(`Cuenta creada para ${user.name}`);
                } catch (error) {
                    authSnackbar(error.message, true);
                }
            });
        }

        // Botón de logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
                authSnackbar('Sesión cerrada correctamente');
            });
        }
    }

    // 8. Crear usuario de prueba si no existe
    function createTestUser() {
        if (!userDB.findByEmail('prueba@test.com')) {
            try {
                userDB.create({
                    name: 'Usuario de prueba',
                    email: 'prueba@test.com',
                    password: '123456'
                });
                console.log('Usuario de prueba creado: prueba@test.com / 123456');
            } catch (e) {
                console.error('Error creando usuario de prueba:', e);
            }
        }
    }

    // 9. Inicialización
    createTestUser();
    setupAuthListeners();
    
    if (!auth.check()) {
        auth.showAuth();
    }

    // Modificar tus funciones existentes para guardar tareas por usuario
    const originalSaveTasks = window.saveTasks;
    window.saveTasks = function() {
        if (auth.currentUser) {
            saveUserTasks(auth.currentUser.id);
        }
        if (originalSaveTasks) {
            originalSaveTasks();
        }
    };

    // Asegurar que las tareas se carguen al iniciar
    if (auth.currentUser) {
        loadUserTasks(auth.currentUser.id);
    }
});

// ===== TU CÓDIGO EXISTENTE (sin cambios) =====
// [Todo el resto de tu código permanece igual]



// Variables de estado
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentSort = 'newest';
let currentSearch = '';
let productivityData = JSON.parse(localStorage.getItem('productivityData')) || {
    dates: [],
    completed: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    renderTasks();
    updateCounters();
    setupEventListeners();
    initSortable();
    initProductivityChart();
    checkOnlineStatus();
    
    // Actualizar datos de productividad
    updateProductivityData();
    
    // Verificar si es la primera visita
    if (!localStorage.getItem('firstVisit')) {
        showSnackbar('¡Bienvenido a TaskMaster Pro! Comienza agregando tu primera tarea.');
        localStorage.setItem('firstVisit', 'true');
    }
});

// Inicializar tema
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Actualizar botón de tema
function updateThemeButton(theme) {
    if (theme === 'dark') {
        DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
    } else {
        DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Agregar tarea
    DOM.addButton.addEventListener('click', addTask);
    DOM.taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    // Filtros
    DOM.filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.dataset.filter) {
                setFilter(this.dataset.filter);
            }
        });
    });
    
    // Ordenar
    DOM.sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        renderTasks();
    });
    
    // Buscar
    DOM.searchInput.addEventListener('input', function() {
        currentSearch = this.value.trim().toLowerCase();
        debouncedSearch();
    });
    
    DOM.clearSearch.addEventListener('click', function() {
        DOM.searchInput.value = '';
        currentSearch = '';
        renderTasks();
    });
    
    // Tema
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Limpiar todo
    DOM.clearBtn.addEventListener('click', clearAllTasks);
    
    // Exportar/Importar
    DOM.exportBtn.addEventListener('click', exportTasks);
    DOM.importBtn.addEventListener('click', triggerImport);
    
    // Feedback
    DOM.feedbackBtn.addEventListener('click', () => {
        DOM.feedbackModal.style.display = 'block';
    });
    
    DOM.closeModal.addEventListener('click', () => {
        DOM.feedbackModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === DOM.feedbackModal) {
            DOM.feedbackModal.style.display = 'none';
        }
    });
    
    DOM.feedbackForm.addEventListener('submit', submitFeedback);
    
    // Online/Offline
    window.addEventListener('online', () => {
        DOM.offlineStatus.textContent = 'En línea';
        DOM.offlineStatus.style.color = '#38b000';
        showSnackbar('¡Estás de vuelta en línea!');
    });
    
    window.addEventListener('offline', () => {
        DOM.offlineStatus.textContent = 'Sin conexión';
        DOM.offlineStatus.style.color = '#f72585';
        showSnackbar('Estás trabajando sin conexión. Los cambios se sincronizarán cuando vuelvas a estar en línea.');
    });
}

// Inicializar SortableJS para drag and drop
function initSortable() {
    new Sortable(DOM.taskList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
    });
}

// Inicializar gráfico de productividad
function initProductivityChart() {
    const ctx = DOM.productivityChart.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: productivityData.dates.slice(-7),
            datasets: [{
                label: 'Tareas Completadas',
                data: productivityData.completed.slice(-7),
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Actualizar datos de productividad
function updateProductivityData() {
    const today = new Date().toLocaleDateString('es-ES');
    
    if (!productivityData.dates.includes(today)) {
        productivityData.dates.push(today);
        productivityData.completed.push(0);
    }
    
    // Actualizar contador de hoy
    const todayIndex = productivityData.dates.indexOf(today);
    productivityData.completed[todayIndex] = tasks.filter(t => {
        const taskDate = new Date(t.completedAt || t.createdAt).toLocaleDateString('es-ES');
        return taskDate === today && t.completed;
    }).length;
    
    localStorage.setItem('productivityData', JSON.stringify(productivityData));
}

// Verificar estado de conexión
function checkOnlineStatus() {
    if (navigator.onLine) {
        DOM.offlineStatus.textContent = 'En línea';
        DOM.offlineStatus.style.color = '#38b000';
    } else {
        DOM.offlineStatus.textContent = 'Sin conexión';
        DOM.offlineStatus.style.color = '#f72585';
    }
}

// Mostrar notificación
function showSnackbar(message) {
    DOM.snackbar.textContent = message;
    DOM.snackbar.className = 'snackbar show';
    
    setTimeout(() => {
        DOM.snackbar.className = DOM.snackbar.className.replace('show', '');
    }, 3000);
}

// Alternar tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

// Agregar tarea
function addTask() {
    const taskText = DOM.taskInput.value.trim();
    const category = DOM.categorySelect.value;
    const priority = DOM.prioritySelect.value;
    
    if (taskText !== '') {
        const newTask = {
            id: Date.now(),
            text: sanitizeInput(taskText),
            category,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateCounters();
        
        // Resetear el input
        DOM.taskInput.value = '';
        DOM.taskInput.focus();
        
        // Mostrar notificación
        showSnackbar('Tarea agregada correctamente');
        
        // Animación de scroll
        DOM.taskList.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showSnackbar('Por favor ingresa un texto para la tarea');
    }
}

// Sanitizar entrada de texto
function sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderizar tareas
function renderTasks() {
    // Filtrar tareas según el filtro y búsqueda
    let filteredTasks = tasks.filter(task => {
        const matchesFilter = currentFilter === 'all' || 
                            (currentFilter === 'completed' && task.completed) || 
                            (currentFilter === 'pending' && !task.completed);
        
        const matchesSearch = currentSearch === '' || 
                           task.text.toLowerCase().includes(currentSearch) || 
                           getCategoryName(task.category).toLowerCase().includes(currentSearch);
        
        return matchesFilter && matchesSearch;
    });
    
    // Ordenar tareas
    filteredTasks = sortTasks(filteredTasks);
    
    // Actualizar la lista de tareas
    if (filteredTasks.length > 0) {
        DOM.taskList.innerHTML = filteredTasks.map(task => createTaskElement(task)).join('');
    } else {
        DOM.taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>¡No hay tareas ${getFilterMessage()}!</p>
                <p>${getFilterSuggestion()}</p>
            </div>
        `;
    }
    
    // Agregar event listeners a los elementos recién creados
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', toggleTaskStatus);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteTask);
    });
    
    document.querySelectorAll('.task-text').forEach(textElement => {
        textElement.addEventListener('dblclick', enableInlineEdit);
    });
}

// Crear elemento HTML para una tarea
function createTaskElement(task) {
    return `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="priority priority-${task.priority}"></div>
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span class="task-category category-${task.category}">
                        ${getCategoryName(task.category)}
                    </span>
                    <span><i class="far fa-calendar"></i> ${formatDate(task.createdAt)}</span>
                    <span><i class="fas fa-flag"></i> ${getPriorityName(task.priority)}</span>
                </div>
            </div>
            <div class="task-actions">
                <div class="delete-btn">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
        </li>
    `;
}

// Ordenar tareas
function sortTasks(tasks) {
    switch (currentSort) {
        case 'oldest':
            return [...tasks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return [...tasks].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        default: // newest
            return [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

// Función para obtener nombre de categoría
function getCategoryName(category) {
    const categories = {
        'personal': 'Personal',
        'work': 'Trabajo',
        'shopping': 'Compras',
        'study': 'Estudio',
        'other': 'Otro'
    };
    return categories[category] || 'Otro';
}

// Función para obtener nombre de prioridad
function getPriorityName(priority) {
    const priorities = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta'
    };
    return priorities[priority] || 'Media';
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Función para obtener mensaje de filtro
function getFilterMessage() {
    return currentFilter === 'all' ? '' : 
           currentFilter === 'completed' ? 'completadas' : 'pendientes';
}

// Función para obtener sugerencia de filtro
function getFilterSuggestion() {
    if (tasks.length === 0) return 'Agrega tu primera tarea usando el formulario superior.';
    
    if (currentFilter === 'completed' && tasks.some(t => !t.completed)) {
        return 'Prueba cambiando al filtro "Pendientes" para ver tus tareas activas.';
    }
    
    if (currentFilter === 'pending' && tasks.some(t => t.completed)) {
        return 'Prueba cambiando al filtro "Completadas" para ver tus logros.';
    }
    
    return currentSearch ? 'Prueba con otros términos de búsqueda.' : 'Prueba cambiando al filtro "Todas" para ver todas tus tareas.';
}

// Cambiar estado de tarea
function toggleTaskStatus(e) {
    const taskItem = e.target.closest('.task-item');
    const taskId = parseInt(taskItem.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        task.completed = e.target.checked;
        task.updatedAt = new Date().toISOString();
        
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }
        
        saveTasks();
        updateCounters();
        updateProductivityData();
        
        // Aplicar clase para transición
        taskItem.classList.toggle('completed', task.completed);
        
        // Mostrar notificación
        showSnackbar(`Tarea marcada como ${task.completed ? 'completada' : 'pendiente'}`);
        
        // Si estamos en un filtro específico, eliminar la tarea de la vista
        if ((currentFilter === 'completed' && !task.completed) || 
            (currentFilter === 'pending' && task.completed)) {
            taskItem.classList.add('slide-out');
            setTimeout(() => {
                renderTasks();
            }, 400);
        }
    }
}

// Eliminar tarea
function deleteTask(e) {
    const taskItem = e.target.closest('.task-item');
    const taskId = parseInt(taskItem.dataset.id);
    
    // Animación de eliminación
    taskItem.classList.add('slide-out');
    
    setTimeout(() => {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateCounters();
        updateProductivityData();
        showSnackbar('Tarea eliminada');
    }, 400);
}

// Edición en línea
function enableInlineEdit(e) {
    const textElement = e.target;
    const taskItem = textElement.closest('.task-item');
    const taskId = parseInt(taskItem.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    const originalText = textElement.textContent;
    
    textElement.contentEditable = true;
    textElement.focus();
    
    const saveEdit = () => {
        textElement.contentEditable = false;
        const newText = textElement.textContent.trim();
        
        if (newText && newText !== originalText) {
            task.text = sanitizeInput(newText);
            task.updatedAt = new Date().toISOString();
            saveTasks();
            showSnackbar('Tarea actualizada');
        } else {
            textElement.textContent = originalText;
        }
    };
    
    textElement.addEventListener('blur', saveEdit);
    textElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            textElement.textContent = originalText;
            textElement.contentEditable = false;
        }
    });
}

// Actualizar contadores
function updateCounters() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    
    DOM.totalCount.textContent = total;
    DOM.completedCount.textContent = completed;
    DOM.pendingCount.textContent = pending;
    DOM.highPriorityCount.textContent = highPriority;
}

// Guardar tareas en localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Establecer filtro
function setFilter(filter) {
    currentFilter = filter;
    
    // Actualizar botones activos
    DOM.filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTasks();
}

// Búsqueda con debounce
const debouncedSearch = debounce(() => {
    renderTasks();
}, 300);

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Limpiar todas las tareas
function clearAllTasks() {
    if (tasks.length > 0 && confirm('¿Estás seguro de que deseas eliminar todas las tareas? Esta acción no se puede deshacer.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateCounters();
        updateProductivityData();
        showSnackbar('Todas las tareas han sido eliminadas');
    }
}

// Exportar tareas
function exportTasks() {
    if (tasks.length === 0) {
        showSnackbar('No hay tareas para exportar');
        return;
    }
    
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `taskmaster-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSnackbar('Tareas exportadas correctamente');
}

// Importar tareas
function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const importedTasks = JSON.parse(event.target.result);
                
                if (Array.isArray(importedTasks)) {
                    if (confirm(`¿Deseas importar ${importedTasks.length} tareas?`)) {
                        tasks = [...importedTasks, ...tasks];
                        saveTasks();
                        renderTasks();
                        updateCounters();
                        updateProductivityData();
                        showSnackbar(`${importedTasks.length} tareas importadas correctamente`);
                    }
                } else {
                    showSnackbar('El archivo no contiene una lista válida de tareas');
                }
            } catch (error) {
                showSnackbar('Error al leer el archivo: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Enviar feedback
function submitFeedback(e) {
    e.preventDefault();
    
    const type = DOM.feedbackType.value;
    const message = DOM.feedbackMessage.value.trim();
    
    if (message) {
        // En una aplicación real, aquí enviarías los datos a un servidor
        console.log('Feedback enviado:', { type, message });
        
        // Simular envío
        setTimeout(() => {
            DOM.feedbackModal.style.display = 'none';
            DOM.feedbackForm.reset();
            showSnackbar('¡Gracias por tus comentarios!');
        }, 1000);
    }
}