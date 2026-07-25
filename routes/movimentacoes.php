<?php

use App\Controllers\MovimentacaoController;
use App\Middleware\AuthMiddleware;
use App\Middleware\PermissionMiddleware;
use App\Middleware\CsrfMiddleware;

// Todas as rotas requerem autenticação
AuthMiddleware::handle();

$controller = new MovimentacaoController();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar movimentações
        PermissionMiddleware::setRequiredPermission('movimentacao.view');
        PermissionMiddleware::handle();
        
        if (isset($_GET['id'])) {
            $controller->buscarPorId((int) $_GET['id']);
        } elseif (isset($_GET['produto_id'])) {
            $controller->buscarPorProduto((int) $_GET['produto_id']);
        } else {
            $controller->listarTodas();
        }
        break;

    case 'POST':
        // Criar movimentação
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('movimentacao.create');
        PermissionMiddleware::handle();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $type = $_GET['type'] ?? '';
        $allowedTypes = ['entrada', 'saida'];
        
        if (!in_array($type, $allowedTypes)) {
            jsonResponse(['message' => 'Tipo de movimentação não especificado ou inválido'], 400);
        }
        
        if ($type === 'entrada') {
            $controller->registrarEntrada($data);
        } else {
            $controller->registrarSaida($data);
        }
        break;

    case 'DELETE':
        // Deletar movimentação
        CsrfMiddleware::handle();
        PermissionMiddleware::setRequiredPermission('movimentacao.delete');
        PermissionMiddleware::handle();
        
        if (!isset($_GET['id'])) {
            jsonResponse(['message' => 'ID não fornecido'], 400);
        }
        $controller->deletar((int) $_GET['id']);
        break;

    default:
        jsonResponse(['message' => 'Método não permitido'], 405);
}
