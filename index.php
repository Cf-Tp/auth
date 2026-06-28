<?php
// ============ CONFIGURAÇÃO ============
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// ============ BANCO DE DADOS ============
$host = 'localhost';
$dbname = 'loader_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Criar tabela se não existir
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Erro no banco: ' . $e->getMessage()]));
}

// ============ FUNÇÕES ============

function registerUser($pdo, $username, $email, $password) {
    // Validações
    if (strlen($username) < 3) {
        return ['success' => false, 'message' => 'Usuário deve ter no mínimo 3 caracteres'];
    }
    
    if (strlen($password) < 6) {
        return ['success' => false, 'message' => 'Senha deve ter no mínimo 6 caracteres'];
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Email inválido'];
    }
    
    // Verificar duplicados
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    
    if ($stmt->rowCount() > 0) {
        return ['success' => false, 'message' => 'Usuário ou email já existe'];
    }
    
    // Criar usuário
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    
    if ($stmt->execute([$username, $email, $hashedPassword])) {
        return [
            'success' => true,
            'message' => 'Conta criada com sucesso!',
            'user' => [
                'id' => $pdo->lastInsertId(),
                'username' => $username,
                'email' => $email
            ]
        ];
    }
    
    return ['success' => false, 'message' => 'Erro ao criar conta'];
}

function loginUser($pdo, $username, $password) {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        return ['success' => false, 'message' => 'Usuário não encontrado'];
    }
    
    if (!password_verify($password, $user['password'])) {
        return ['success' => false, 'message' => 'Senha incorreta'];
    }
    
    return [
        'success' => true,
        'message' => 'Login realizado com sucesso',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email']
        ]
    ];
}

function checkUser($pdo, $username) {
    $stmt = $pdo->prepare("SELECT id, username, email, created_at FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        return [
            'exists' => true,
            'user' => $user
        ];
    }
    
    return ['exists' => false];
}

function listUsers($pdo) {
    $stmt = $pdo->query("SELECT id, username, email, created_at FROM users ORDER BY created_at DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ============ ROTAS ============

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Rota: Verificar usuário (GET)
if ($action === 'check' && $method === 'GET') {
    $username = $_GET['username'] ?? '';
    echo json_encode(checkUser($pdo, $username));
    exit;
}

// Rota: Listar usuários (GET)
if ($action === 'list' && $method === 'GET') {
    echo json_encode(listUsers($pdo));
    exit;
}

// Rota: Registrar (POST)
if ($action === 'register' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    echo json_encode(registerUser($pdo, $username, $email, $password));
    exit;
}

// Rota: Login (POST)
if ($action === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    echo json_encode(loginUser($pdo, $username, $password));
    exit;
}

// Rota padrão
echo json_encode([
    'success' => false,
    'message' => 'Rota não encontrada',
    'routes' => [
        'GET /api/check?username=admin',
        'GET /api/list',
        'POST /api/register',
        'POST /api/login'
    ]
]);
?>