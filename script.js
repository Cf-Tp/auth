// ============ CONFIG ============
const API_URL = 'api/?action=';

// ============ FUNÇÕES ============

async function registerUser(username, email, password) {
    try {
        const response = await fetch(API_URL + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, message: 'Erro ao conectar ao servidor' };
    }
}

async function loadUsers() {
    try {
        const response = await fetch(API_URL + 'list');
        const users = await response.json();
        
        const container = document.getElementById('usersList');
        const count = document.getElementById('userCount');
        
        count.textContent = `(${users.length})`;
        
        if (users.length === 0) {
            container.innerHTML = '<div class="empty">Nenhuma conta</div>';
            return;
        }
        
        let html = '';
        users.forEach(user => {
            const date = new Date(user.created_at);
            const formatted = date.toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            
            html += `
                <div class="user-item">
                    <div>
                        <div class="username">${user.username}</div>
                        <div class="email">${user.email}</div>
                    </div>
                    <div class="date">${formatted}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function showMessage(elementId, message, type = 'success') {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = 'message ' + type;
    
    setTimeout(() => {
        el.className = 'message';
    }, 5000);
}

// ============ EVENTOS ============

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    const result = await registerUser(username, email, password);
    
    if (result.success) {
        showMessage('registerMessage', result.message, 'success');
        this.reset();
        loadUsers();
    } else {
        showMessage('registerMessage', result.message, 'error');
    }
});

// ============ INIT ============

document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
});
