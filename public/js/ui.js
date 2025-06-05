// Mostrar snackbar
function showSnackbar(message, type = 'success') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = `snackbar ${type}`;
    snackbar.style.display = 'block';
    
    setTimeout(() => {
        snackbar.style.display = 'none';
    }, 3000);
}

// Cambiar tema
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const icon = newTheme === 'light' ? 'fa-moon' : 'fa-sun';
    themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
    
    localStorage.setItem('theme', newTheme);
});

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = savedTheme === 'light' ? 'fa-moon' : 'fa-sun';
    themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
}

// Modal de feedback
const feedbackBtn = document.getElementById('feedbackBtn');
const feedbackModal = document.getElementById('feedbackModal');
const closeModal = document.querySelector('.close-modal');
const feedbackForm = document.getElementById('feedbackForm');

feedbackBtn.addEventListener('click', function() {
    feedbackModal.style.display = 'flex';
});

closeModal.addEventListener('click', function() {
    feedbackModal.style.display = 'none';
});

window.addEventListener('click', function(e) {
    if (e.target === feedbackModal) {
        feedbackModal.style.display = 'none';
    }
});

feedbackForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const type = document.getElementById('feedbackType').value;
    const message = document.getElementById('feedbackMessage').value;
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, message })
        });
        
        if (response.ok) {
            showSnackbar('¡Gracias por tu feedback!');
            feedbackModal.style.display = 'none';
            this.reset();
        } else {
            showSnackbar('Error al enviar feedback', 'error');
        }
    } catch (error) {
        showSnackbar('Error de conexión', 'error');
    }
});

// Inicializar tema al cargar
loadSavedTheme();