<?php

use App\Controllers\EmpresaController;

$controller = new EmpresaController();
$method     = $_SERVER['REQUEST_METHOD'];
$action     = $_GET['action'] ?? null;

// Registro público de nova empresa + admin
if ($method === 'POST' && $action === 'register') {
    $controller->register();
    exit;
}

// Criação simples (legado / admin interno)
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $controller->criar($data);
    exit;
}

jsonResponse(['error' => true, 'message' => 'Método não permitido'], 405);
