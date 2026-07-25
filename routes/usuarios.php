<?php

use App\Controllers\UsuarioController;
use App\Middleware\AuthMiddleware;
use App\Middleware\PermissionMiddleware;

// Todas as rotas requerem autenticação
AuthMiddleware::handle();

// Extrai ID da URL se presente
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Listar usuários
        if ($id === null) {
            PermissionMiddleware::setRequiredPermission('usuario.view');
            PermissionMiddleware::handle();
            (new UsuarioController())->index();
        }
        // Exibir usuário específico
        else {
            PermissionMiddleware::setRequiredPermission('usuario.view');
            PermissionMiddleware::handle();
            (new UsuarioController())->show($id);
        }
        break;
        
    case 'POST':
        // Criar usuário
        PermissionMiddleware::setRequiredPermission('usuario.create');
        PermissionMiddleware::handle();
        (new UsuarioController())->store();
        break;
        
    case 'PUT':
    case 'PATCH':
        // Atualizar usuário
        if ($id === null) {
            jsonResponse(['error' => true, 'message' => 'ID do usuário é obrigatório'], 400);
        }
        PermissionMiddleware::setRequiredPermission('usuario.edit');
        PermissionMiddleware::handle();
        (new UsuarioController())->update($id);
        break;
        
    case 'DELETE':
        // Deletar usuário
        if ($id === null) {
            jsonResponse(['error' => true, 'message' => 'ID do usuário é obrigatório'], 400);
        }
        PermissionMiddleware::setRequiredPermission('usuario.delete');
        PermissionMiddleware::handle();
        (new UsuarioController())->destroy($id);
        break;
        
    default:
        jsonResponse([
            'error' => true,
            'message' => 'Método não permitido'
        ], 405);
}
