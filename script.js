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

function registerUser(username, email, password) {
    const users = DB.getUsers();

    // Validações
    if (!username || !email || !password) {
        return { success: false, message: 'Preencha todos os campos' };
    }

    if (username.length < 3) {
        return { success: false, message: 'Usuário deve ter no mínimo 3 caracteres' };
    }

    if (password.length < 6) {
        return { success: false, message: 'Senha deve ter no mínimo 6 caracteres' };
    }

    if (!email.includes('@')) {
        return { success: false, message: 'Email inválido' };
    }

    // Verificar duplicados
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Usuário já existe' };
    }

    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email já cadastrado' };
    }

    // Criar usuário
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
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email
        }
    };
}

function loginUser(username, password) {
    const users = DB.getUsers();

    if (!username || !password) {
        return { success: false, message: 'Preencha todos os campos' };
    }

    const user = users.find(u => u.username === username || u.email === username);

    if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
    }

    const decodedPassword = atob(user.password);
    if (password !== decodedPassword) {
        return { success: false, message: 'Senha incorreta' };
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

function checkUser(username) {
    const users = DB.getUsers();
    const user = users.find(u => u.username === username || u.email === username);
    
    if (user) {
        return {
            exists: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        };
    }
    
    return { exists: false };
}

function listUsers() {
    const users = DB.getUsers();
    return users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        created_at: u.created_at
    }));
}

// ============ UI ============

function updateUI() {
    const users = DB.getUsers();
    document.getElementById('totalUsers').textContent = users.length;
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

// Registrar
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    const result = registerUser(username, email, password);

    if (result.success) {
        showMessage('registerMessage', result.message, 'success');
        document.getElementById('registerForm').reset();
        updateUI();
    } else {
        showMessage('registerMessage', result.message, 'error');
    }
});

// Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const result = loginUser(username, password);

    if (result.success) {
        showMessage('loginMessage', result.message, 'success');
        document.getElementById('loginForm').reset();
    } else {
        showMessage('loginMessage', result.message, 'error');
    }
});

// ============ API PARA WPF ============

// Processar requisições da URL (WPF usa isso)
function handleApiRequest() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar se existe
    if (urlParams.has('check')) {
        const username = urlParams.get('check');
        const result = checkUser(username);
        document.body.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        return true;
    }
    
    // Listar todos
    if (urlParams.has('list')) {
        const users = listUsers();
        document.body.innerHTML = `<pre>${JSON.stringify(users, null, 2)}</pre>`;
        return true;
    }
    
    return false;
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', function() {
    // Se for requisição da API, não mostra a interface
    if (handleApiRequest()) {
        return;
    }
    
    updateUI();
    console.log('✅ Sistema de contas online');
    console.log('📌 WPF pode consultar: /?check=usuario');
});
