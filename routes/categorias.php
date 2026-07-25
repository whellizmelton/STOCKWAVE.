<?php

use App\Controllers\CategoriaController;
use App\Middleware\AuthMiddleware;
use App\Middleware\PermissionMiddleware;
use App\Middleware\CsrfMiddleware;

// Todas as rotas requerem autenticação
AuthMiddleware::handle();

$controller = new CategoriaController();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar categorias
        PermissionMiddleware::setRequiredPermission('categoria.view');
        PermissionMiddleware::handle();
        
        if (isset($_GET['id'])) {
            $controller->buscarPorId((int) $_GET['id']);
        } else {
            $controller->listarTodas();
        }
        break;

    case 'POST':
        // Criar categoria
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('categoria.create');
        PermissionMiddleware::handle();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $controller->criar($data);
        break;

    case 'PUT':
        // Atualizar categoria
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('categoria.edit');
        PermissionMiddleware::handle();
        
        if (!isset($_GET['id'])) {
            jsonResponse(['message' => 'ID não fornecido'], 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $controller->atualizar((int) $_GET['id'], $data);
        break;

    case 'DELETE':
        // Deletar categoria
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('categoria.delete');
        PermissionMiddleware::handle();
        
        if (!isset($_GET['id'])) {
            jsonResponse(['message' => 'ID não fornecido'], 400);
        }
        $controller->deletar((int) $_GET['id']);
        break;

    default:
        jsonResponse(['message' => 'Método não permitido'], 405);
}
