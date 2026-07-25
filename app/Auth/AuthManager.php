<?php

namespace App\Auth;

use App\Models\UsuarioModel;
use App\Models\RoleModel;

/**
 * AuthManager - Orquestrador de autenticação
 * 
 * Responsável por:
 * - Gerenciar estado de autenticação
 * - Carregar dados do usuário autenticado
 * - Verificar permissões e roles
 * - Fornecer helpers de autorização
 */
class AuthManager
{
    /**
     * Cache do usuário atual
     */
    private static ?array $currentUser = null;
    
    /**
     * Cache das roles do usuário atual
     */
    private static ?array $currentUserRoles = null;
    
    /**
     * Cache das permissões do usuário atual
     */
    private static ?array $currentUserPermissions = null;
    
    /**
     * Verifica se há um usuário autenticado
     * 
     * @return bool True se autenticado
     */
    public static function isAuthenticated(): bool
    {
        return SessionManager::validate();
    }
    
    /**
     * Verifica se há um usuário autenticado e retorna erro se não
     * 
     * @return void
     */
    public static function requireAuth(): void
    {
        // Em modo local, autenticação não é exigida
        if (defined('LOCAL_MODE') && LOCAL_MODE) {
            return;
        }

        if (!self::isAuthenticated()) {
            jsonResponse([
                'error' => true,
                'message' => 'Não autenticado',
                'code' => 'UNAUTHORIZED'
            ], 401);
        }
    }
    
    /**
     * Verifica se o usuário tem uma permissão específica
     * 
     * @param string $permission Nome da permissão
     * @return bool True se tiver a permissão
     */
    public static function hasPermission(string $permission): bool
    {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        $permissions = self::getCurrentUserPermissions();
        return in_array($permission, array_column($permissions, 'nome'));
    }
    
    /**
     * Verifica se o usuário tem uma permissão específica e retorna erro se não
     * 
     * @param string $permission Nome da permissão
     * @return void
     */
    public static function requirePermission(string $permission): void
    {
        // Em modo local, permissões não são exigidas
        if (defined('LOCAL_MODE') && LOCAL_MODE) {
            return;
        }

        self::requireAuth();
        
        if (!self::hasPermission($permission)) {
            jsonResponse([
                'error' => true,
                'message' => 'Permissão insuficiente',
                'code' => 'INSUFFICIENT_PERMISSION',
                'required' => $permission
            ], 403);
        }
    }
    
    /**
     * Verifica se o usuário tem uma role específica
     * 
     * @param string $role Nome da role
     * @return bool True se tiver a role
     */
    public static function hasRole(string $role): bool
    {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        $roles = self::getCurrentUserRoles();
        return in_array($role, array_column($roles, 'nome'));
    }
    
    /**
     * Verifica se o usuário tem pelo menos uma das roles
     * 
     * @param array $roles Array de nomes de roles
     * @return bool True se tiver pelo menos uma
     */
    public static function hasAnyRole(array $roles): bool
    {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        $userRoles = array_column(self::getCurrentUserRoles(), 'nome');
        return !empty(array_intersect($userRoles, $roles));
    }
    
    /**
     * Verifica se o usuário tem todas as roles
     * 
     * @param array $roles Array de nomes de roles
     * @return bool True se tiver todas
     */
    public static function hasAllRoles(array $roles): bool
    {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        $userRoles = array_column(self::getCurrentUserRoles(), 'nome');
        return empty(array_diff($roles, $userRoles));
    }
    
    /**
     * Verifica se o usuário tem uma role específica e retorna erro se não
     * 
     * @param string $role Nome da role
     * @return void
     */
    public static function requireRole(string $role): void
    {
        self::requireAuth();
        
        if (!self::hasRole($role)) {
            jsonResponse([
                'error' => true,
                'message' => 'Permissão insuficiente',
                'code' => 'INSUFFICIENT_ROLE',
                'required' => $role
            ], 403);
        }
    }
    
    /**
     * Retorna o ID do usuário autenticado
     * 
     * @return int|null ID do usuário ou null
     */
    public static function getCurrentUserId(): ?int
    {
        return SessionManager::getUserId();
    }
    
    /**
     * Retorna o ID da empresa do usuário autenticado
     * 
     * @return int|null ID da empresa ou null
     */
    public static function getCurrentTenantId(): ?int
    {
        return SessionManager::getEmpresaId();
    }
    
    /**
     * Retorna os dados do usuário autenticado
     * 
     * @return array|null Dados do usuário ou null
     */
    public static function getCurrentUser(): ?array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }
        
        if (!self::isAuthenticated()) {
            return null;
        }
        
        $userId = self::getCurrentUserId();
        if (!$userId) {
            return null;
        }
        
        $usuario = UsuarioModel::findById($userId);
        
        if (!$usuario) {
            // Usuário não existe mais, faz logout
            self::logout();
            return null;
        }
        
        // Remove senha do retorno
        unset($usuario['senha']);
        unset($usuario['password_reset_token']);
        unset($usuario['two_factor_secret']);
        
        self::$currentUser = $usuario;
        return self::$currentUser;
    }
    
    /**
     * Retorna as roles do usuário autenticado
     * 
     * @return array Lista de roles
     */
    public static function getCurrentUserRoles(): array
    {
        if (self::$currentUserRoles !== null) {
            return self::$currentUserRoles;
        }
        
        if (!self::isAuthenticated()) {
            return [];
        }
        
        $userId = self::getCurrentUserId();
        if (!$userId) {
            return [];
        }
        
        self::$currentUserRoles = RoleModel::getByUsuario($userId);
        return self::$currentUserRoles;
    }
    
    /**
     * Retorna as permissões do usuário autenticado
     * 
     * @return array Lista de permissões
     */
    public static function getCurrentUserPermissions(): array
    {
        if (self::$currentUserPermissions !== null) {
            return self::$currentUserPermissions;
        }
        
        if (!self::isAuthenticated()) {
            return [];
        }
        
        $userId = self::getCurrentUserId();
        if (!$userId) {
            return [];
        }
        
        self::$currentUserPermissions = RoleModel::getUsuarioPermissions($userId);
        return self::$currentUserPermissions;
    }
    
    /**
     * Verifica a sessão e carrega o usuário
     * 
     * @return bool True se a sessão for válida
     */
    public static function checkSession(): bool
    {
        if (!SessionManager::validate()) {
            return false;
        }
        
        // Carrega usuário para validar que ainda existe
        $usuario = self::getCurrentUser();
        
        if (!$usuario) {
            return false;
        }
        
        // Verifica se usuário está ativo
        if ($usuario['status'] !== 'active') {
            self::logout();
            return false;
        }
        
        return true;
    }
    
    /**
     * Faz login do usuário
     * 
     * @param array $usuario Dados do usuário
     * @return void
     */
    public static function login(array $usuario): void
    {
        SessionManager::create($usuario, $usuario['empresa_id']);
        
        // Limpa cache
        self::$currentUser = null;
        self::$currentUserRoles = null;
        self::$currentUserPermissions = null;
    }
    
    /**
     * Faz logout do usuário
     * 
     * @return void
     */
    public static function logout(): void
    {
        SessionManager::destroy();
        
        // Limpa cache
        self::$currentUser = null;
        self::$currentUserRoles = null;
        self::$currentUserPermissions = null;
    }
    
    /**
     * Limpa o contexto de autenticação (sem destruir sessão)
     * 
     * @return void
     */
    public static function clearContext(): void
    {
        self::$currentUser = null;
        self::$currentUserRoles = null;
        self::$currentUserPermissions = null;
    }
    
    /**
     * Recarrega os dados do usuário do banco
     * 
     * @return void
     */
    public static function refresh(): void
    {
        self::$currentUser = null;
        self::$currentUserRoles = null;
        self::$currentUserPermissions = null;
        
        self::getCurrentUser();
        self::getCurrentUserRoles();
        self::getCurrentUserPermissions();
    }
}
