<?php

namespace App\Controllers;

use App\Auth\AuthManager;
use App\Auth\PasswordManager;
use App\Middleware\TenantMiddleware;
use App\Models\UsuarioModel;
use App\Models\RoleModel;

/**
 * UsuarioController - Controller de usuários
 * 
 * Responsável por:
 * - CRUD de usuários
 * - Gestão de roles de usuários
 */
class UsuarioController
{
    /**
     * Lista usuários da empresa
     * 
     * @return void
     */
    public function index(): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.view');
        
        $empresaId = TenantMiddleware::getEmpresaId();
        $usuarios = UsuarioModel::listByEmpresa($empresaId);
        
        jsonResponse(['data' => $usuarios]);
    }
    
    /**
     * Exibe detalhes de um usuário
     * 
     * @param int $id ID do usuário
     * @return void
     */
    public function show(int $id): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.view');
        
        $empresaId = TenantMiddleware::getEmpresaId();
        $usuario = UsuarioModel::findById($id, $empresaId);
        
        if (!$usuario) {
            jsonResponse(['error' => true, 'message' => 'Usuário não encontrado'], 404);
        }
        
        // Inclui roles
        $usuario['roles'] = RoleModel::getByUsuario($id);
        
        // Inclui permissões
        $usuario['permissions'] = RoleModel::getUsuarioPermissions($id);
        
        jsonResponse(['data' => $usuario]);
    }
    
    /**
     * Cria um novo usuário
     * 
     * @return void
     */
    public function store(): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.create');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        // Validação
        if (empty($data['email']) || empty($data['nome']) || empty($data['senha'])) {
            jsonResponse(['error' => true, 'message' => 'Campos obrigatórios: email, nome, senha'], 400);
        }
        
        // Valida email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => true, 'message' => 'Email inválido'], 400);
        }
        
        // Valida força da senha
        if (!PasswordManager::validateStrength($data['senha'])) {
            jsonResponse([
                'error' => true, 
                'message' => PasswordManager::getValidationError($data['senha']) ?? 'Senha não atende aos requisitos'
            ], 400);
        }
        
        $empresaId = TenantMiddleware::getEmpresaId();
        $currentUserId = AuthManager::getCurrentUserId();
        
        // Verifica se email já existe
        $existing = UsuarioModel::findByEmail($data['email']);
        if ($existing && $existing['empresa_id'] == $empresaId) {
            jsonResponse(['error' => true, 'message' => 'Email já cadastrado nesta empresa'], 400);
        }
        
        // Hash da senha
        $data['senha'] = PasswordManager::hash($data['senha']);
        
        // Cria usuário
        $usuarioId = UsuarioModel::create($empresaId, $data, $currentUserId);
        
        // Atribui role padrão (operador) se fornecido
        if (!empty($data['role_id'])) {
            RoleModel::assignToUsuario($usuarioId, $data['role_id'], $currentUserId);
        }
        
        jsonResponse([
            'error' => false,
            'message' => 'Usuário criado com sucesso',
            'id' => $usuarioId
        ]);
    }
    
    /**
     * Atualiza um usuário
     * 
     * @param int $id ID do usuário
     * @return void
     */
    public function update(int $id): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.edit');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        if (empty($data)) {
            jsonResponse(['error' => true, 'message' => 'Nenhum dado enviado'], 400);
        }
        
        $empresaId = TenantMiddleware::getEmpresaId();
        $currentUserId = AuthManager::getCurrentUserId();
        
        // Verifica se usuário pertence à empresa
        $usuario = UsuarioModel::findById($id, $empresaId);
        if (!$usuario) {
            jsonResponse(['error' => true, 'message' => 'Usuário não encontrado'], 404);
        }
        
        // Se alterar email, valida e verifica duplicidade
        if (!empty($data['email']) && $data['email'] !== $usuario['email']) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                jsonResponse(['error' => true, 'message' => 'Email inválido'], 400);
            }
            
            $existing = UsuarioModel::findByEmail($data['email']);
            if ($existing && $existing['empresa_id'] == $empresaId && $existing['id'] != $id) {
                jsonResponse(['error' => true, 'message' => 'Email já cadastrado nesta empresa'], 400);
            }
        }
        
        // Se alterar senha, valida força e faz hash
        if (!empty($data['senha'])) {
            if (!PasswordManager::validateStrength($data['senha'])) {
                jsonResponse([
                    'error' => true,
                    'message' => PasswordManager::getValidationError($data['senha']) ?? 'Senha não atende aos requisitos'
                ], 400);
            }
            $data['senha'] = PasswordManager::hash($data['senha']);
        } else {
            unset($data['senha']);
        }
        
        UsuarioModel::update($id, $empresaId, $data, $currentUserId);
        
        // Atualiza roles se fornecido
        if (isset($data['role_ids'])) {
            RoleModel::syncUsuarioRoles($id, $data['role_ids'], $currentUserId);
        }
        
        jsonResponse(['error' => false, 'message' => 'Usuário atualizado']);
    }
    
    /**
     * Deleta um usuário
     * 
     * @param int $id ID do usuário
     * @return void
     */
    public function destroy(int $id): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.delete');
        
        $empresaId = TenantMiddleware::getEmpresaId();
        $currentUserId = AuthManager::getCurrentUserId();
        
        // Não pode deletar a si mesmo
        if ($id === $currentUserId) {
            jsonResponse(['error' => true, 'message' => 'Não pode deletar a si mesmo'], 400);
        }
        
        // Verifica se usuário pertence à empresa
        $usuario = UsuarioModel::findById($id, $empresaId);
        if (!$usuario) {
            jsonResponse(['error' => true, 'message' => 'Usuário não encontrado'], 404);
        }
        
        UsuarioModel::delete($id, $empresaId, $currentUserId);
        
        jsonResponse(['error' => false, 'message' => 'Usuário deletado']);
    }
    
    /**
     * Lista roles disponíveis
     * 
     * @return void
     */
    public function listRoles(): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.view');
        
        $empresaId = TenantMiddleware::getEmpresaId();
        $roles = RoleModel::listByEmpresa($empresaId);
        
        jsonResponse(['data' => $roles]);
    }
    
    /**
     * Atualiza roles de um usuário
     * 
     * @param int $id ID do usuário
     * @return void
     */
    public function updateRoles(int $id): void
    {
        AuthManager::requireAuth();
        AuthManager::requirePermission('usuario.role');
        
        $data = json_decode(file_get_contents('php://input'), true);
        $empresaId = TenantMiddleware::getEmpresaId();
        $currentUserId = AuthManager::getCurrentUserId();
        
        // Verifica se usuário pertence à empresa
        $usuario = UsuarioModel::findById($id, $empresaId);
        if (!$usuario) {
            jsonResponse(['error' => true, 'message' => 'Usuário não encontrado'], 404);
        }
        
        // Não pode remover todas as roles do próprio usuário
        if ($id === $currentUserId && (empty($data['role_ids']) || count($data['role_ids']) === 0)) {
            jsonResponse(['error' => true, 'message' => 'Não pode remover todas as suas próprias roles'], 400);
        }
        
        RoleModel::syncUsuarioRoles($id, $data['role_ids'] ?? [], $currentUserId);
        
        jsonResponse(['error' => false, 'message' => 'Roles atualizadas']);
    }
}
