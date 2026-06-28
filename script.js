// ============ BANCO DE DADOS ============
const DB = {
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem('dx11_users') || '[]');
        } catch {
            return [];
        }
    },
    setUsers(users) {
        localStorage.setItem('dx11_users', JSON.stringify(users));
    }
};

// ============ FUNÇÕES ============

function loginUser(username, password) {
    const users = DB.getUsers();
    const user = users.find(u => u.username === username || u.email === username);
    
    if (!user) {
        return { success: false, message: 'Usuario nao encontrado' };
    }
    
    try {
        const decodedPassword = atob(user.password);
        if (password !== decodedPassword) {
            return { success: false, message: 'Senha incorreta' };
        }
    } catch {
        return { success: false, message: 'Erro ao verificar senha' };
    }
    
    return {
        success: true,
        message: 'Login realizado com sucesso',
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    };
}

function registerUser(username, email, password) {
    const users = DB.getUsers();

    if (!username || !email || !password) {
        return { success: false, message: 'Preencha todos os campos' };
    }

    if (username.length < 3) {
        return { success: false, message: 'Usuario deve ter no minimo 3 caracteres' };
    }

    if (password.length < 6) {
        return { success: false, message: 'Senha deve ter no minimo 6 caracteres' };
    }

    if (!email.includes('@')) {
        return { success: false, message: 'Email invalido' };
    }

    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Usuario ja existe' };
    }

    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email ja cadastrado' };
    }

    const newUser = {
        id: users.length + 1,
        username: username,
        email: email,
        password: btoa(password),
        created_at: new Date().toISOString()
    };

    users.push(newUser);
    DB.setUsers(users);

    return { 
        success: true, 
        message: 'Conta criada com sucesso!',
        user: newUser
    };
}

// ============ API ============

function handleApiRequest() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // LOGIN
    if (urlParams.has('login')) {
        const username = urlParams.get('username');
        const password = urlParams.get('password');
        const result = loginUser(username, password);
        
        // LIMPA A PÁGINA E MOSTRA SÓ O JSON
        document.body.innerHTML = '';
        document.write(JSON.stringify(result));
        document.close();
        return true;
    }
    
    // CHECK
    if (urlParams.has('check')) {
        const username = urlParams.get('check');
        const users = DB.getUsers();
        const user = users.find(u => u.username === username || u.email === username);
        
        let result;
        if (user) {
            result = {
                exists: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    created_at: user.created_at
                }
            };
        } else {
            result = { exists: false };
        }
        
        document.body.innerHTML = '';
        document.write(JSON.stringify(result));
        document.close();
        return true;
    }
    
    // LIST
    if (urlParams.has('list')) {
        const users = DB.getUsers();
        const result = users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            created_at: u.created_at
        }));
        
        document.body.innerHTML = '';
        document.write(JSON.stringify(result));
        document.close();
        return true;
    }
    
    return false;
}

// ============ UI ============

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = 'message ' + type;
    
    setTimeout(() => {
        el.className = 'message';
    }, 5000);
}

function updateUI() {
    const users = DB.getUsers();
    const totalUsers = document.getElementById('totalUsers');
    if (totalUsers) {
        totalUsers.textContent = users.length;
    }
}

// ============ EVENTOS ============

document.addEventListener('DOMContentLoaded', function() {
    // SE FOR API, MOSTRA JSON E PARA
    if (handleApiRequest()) {
        return;
    }
    
    updateUI();

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const result = registerUser(username, email, password);
            
            if (result.success) {
                showMessage('registerMessage', result.message, 'success');
                this.reset();
                updateUI();
            } else {
                showMessage('registerMessage', result.message, 'error');
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const result = loginUser(username, password);
            
            if (result.success) {
                showMessage('loginMessage', result.message, 'success');
                this.reset();
            } else {
                showMessage('loginMessage', result.message, 'error');
            }
        });
    }
});

console.log('API do DX11Loader rodando!');
console.log('Teste no navegador:');
console.log('  ?login&username=teste&password=123456');
