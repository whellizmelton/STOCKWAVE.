<?php

use App\Controllers\ProdutoController;
use App\Middleware\AuthMiddleware;
use App\Middleware\PermissionMiddleware;
use App\Middleware\CsrfMiddleware;

// Todas as rotas requerem autenticação
AuthMiddleware::handle();

$controller = new ProdutoController();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar produtos
        PermissionMiddleware::setRequiredPermission('produto.view');
        PermissionMiddleware::handle();
        
        if (isset($_GET['id'])) {
            $controller->buscarPorId((int) $_GET['id']);
        } elseif (isset($_GET['low_stock'])) {
            $controller->buscarBaixoEstoque();
        } else {
            $controller->listarTodos();
        }
        break;

    case 'POST':
        // Criar produto
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('produto.create');
        PermissionMiddleware::handle();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $controller->criar($data);
        break;

    case 'PUT':
        // Atualizar produto
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('produto.edit');
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
        // Deletar produto
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('produto.delete');
        PermissionMiddleware::handle();
        
        if (!isset($_GET['id'])) {
            jsonResponse(['message' => 'ID não fornecido'], 400);
        }
        $controller->deletar((int) $_GET['id']);
        break;

    default:
        jsonResponse(['message' => 'Método não permitido'], 405);
}
