<?php

namespace App\Controllers;

use App\Auth\AuthManager;
use App\Auth\CredentialsValidator;
use App\Auth\PasswordManager;
use App\Auth\SessionManager;
use App\Auth\CsrfManager;
use App\Models\UsuarioModel;
use App\Models\LoginAttemptModel;
use App\Helpers\AuditHelper;

/**
 * AuthController - Controller de autenticação
 * 
 * Responsável por:
 * - Login e logout
 * - Recuperação de dados do usuário autenticado
 * - Recuperação de senha
 * - Alteração de senha
 */
class AuthController
{
    /**
     * Exibe formulário de login
     * 
     * @return void
     */
    public function showLoginForm(): void
    {
        // Se já autenticado, redireciona para dashboard
        if (AuthManager::isAuthenticated()) {
            header('Location: /stockwave/public/');
            exit;
        }
        
        // Renderiza view de login
        require __DIR__ . '/../../public/auth/login.html';
    }
    
    /**
     * Processa login
     * 
     * @return void
     */
    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        // Valida formato das credenciais
        if (!CredentialsValidator::validate($data)) {
            jsonResponse([
                'error' => true,
                'message' => CredentialsValidator::getValidationError($data) ?? 'Credenciais inválidas'
            ], 400);
        }
        
        $email = CredentialsValidator::sanitizeEmail($data['email']);
        $password = $data['password'];
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        
        // Verifica bloqueio por brute force
        if (LoginAttemptModel::isBlocked($email, $ip)) {
            $remaining = LoginAttemptModel::getBlockTimeRemaining($email, $ip);
            jsonResponse([
                'error' => true,
                'message' => 'Muitas tentativas. Tente novamente em ' . ceil($remaining / 60) . ' minutos.',
                'blocked' => true,
                'remaining_seconds' => $remaining
            ], 429);
        }
        
        // Busca usuário
        $usuario = UsuarioModel::findByEmail($email);
        
        // Registra tentativa
        $success = false;
        if ($usuario) {
            $success = PasswordManager::verify($password, $usuario['senha']);
        }
        
        LoginAttemptModel::register($email, $ip, $userAgent, $success);
        
        if (!$success || !$usuario) {
            jsonResponse([
                'error' => true,
                'message' => 'Credenciais inválidas'
            ], 401);
        }
        
        // Verifica status do usuário
        if ($usuario['status'] !== 'active') {
            jsonResponse([
                'error' => true,
                'message' => 'Usuário não está ativo'
            ], 403);
        }
        
        // Verifica verificação de email (opcional no modo local)
        if (!$usuario['email_verified'] && (!defined('SKIP_EMAIL_VERIFICATION') || !SKIP_EMAIL_VERIFICATION)) {
            jsonResponse([
                'error' => true,
                'message' => 'Email não verificado'
            ], 403);
        }
        
        // Cria sessão
        $rememberMe = $data['remember_me'] ?? false;
        SessionManager::create($usuario, $usuario['empresa_id'], $rememberMe);
        
        // Atualiza last_login
        UsuarioModel::updateLastLogin($usuario['id'], $ip);
        
        // Registra auditoria
        AuditHelper::log($usuario['empresa_id'], $usuario['id'], 'LOGIN', 'auth', null, null, [
            'ip' => $ip,
            'user_agent' => $userAgent
        ]);
        
        jsonResponse([
            'error' => false,
            'message' => 'Login realizado com sucesso',
            'redirect' => '/stockwave/public/'
        ]);
    }
    
    /**
     * Processa logout
     * 
     * @return void
     */
    public function logout(): void
    {
        $userId = AuthManager::getCurrentUserId();
        $empresaId = AuthManager::getCurrentTenantId();
        
        // Registra auditoria
        if ($userId && $empresaId) {
            AuditHelper::log($empresaId, $userId, 'LOGOUT', 'auth', null, null, [
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'
            ]);
        }
        
        SessionManager::destroy();
        
        jsonResponse([
            'error' => false,
            'message' => 'Logout realizado com sucesso',
            'redirect' => '/login'
        ]);
    }
    
    /**
     * Retorna dados do usuário autenticado
     * 
     * @return void
     */
    public function me(): void
    {
        if (!AuthManager::isAuthenticated()) {
            jsonResponse([
                'error' => true,
                'message' => 'Não autenticado'
            ], 401);
        }
        
        $usuario = AuthManager::getCurrentUser();
        
        if (!$usuario) {
            jsonResponse([
                'error' => true,
                'message' => 'Usuário não encontrado'
            ], 404);
        }
        
        jsonResponse([
            'error' => false,
            'data' => [
                'id' => $usuario['id'],
                'nome' => $usuario['nome'],
                'email' => $usuario['email'],
                'empresa_id' => $usuario['empresa_id'],
                'roles' => AuthManager::getCurrentUserRoles(),
                'permissions' => AuthManager::getCurrentUserPermissions()
            ]
        ]);
    }
    
    /**
     * Solicita recuperação de senha
     * 
     * @return void
     */
    public function requestPasswordReset(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $email = CredentialsValidator::sanitizeEmail($data['email'] ?? '');
        
        if (!CredentialsValidator::validateEmail($email)) {
            jsonResponse([
                'error' => true,
                'message' => 'Email inválido'
            ], 400);
        }
        
        $usuario = UsuarioModel::findByEmail($email);
        
        if (!$usuario) {
            // Não revela se email existe
            jsonResponse([
                'error' => false,
                'message' => 'Se o email existir, você receberá instruções'
            ]);
        }
        
        // Gera token de reset
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        UsuarioModel::setPasswordResetToken($usuario['id'], $token, $expiresAt);
        
        // Registra auditoria
        AuditHelper::log($usuario['empresa_id'], $usuario['id'], 'PASSWORD_RESET_REQUEST', 'auth', null, null, [
            'email' => $email
        ]);
        
        // Envia email (implementação futura)
        // EmailService::sendPasswordReset($usuario['email'], $token);
        
        jsonResponse([
            'error' => false,
            'message' => 'Se o email existir, você receberá instruções'
        ]);
    }
    
    /**
     * Reseta senha com token
     * 
     * @return void
     */
    public function resetPassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $token = $data['token'] ?? '';
        $password = $data['password'] ?? '';
        
        $usuario = UsuarioModel::findByPasswordResetToken($token);
        
        if (!$usuario) {
            jsonResponse([
                'error' => true,
                'message' => 'Token inválido ou expirado'
            ], 400);
        }
        
        // Valida força da senha
        if (!PasswordManager::validateStrength($password)) {
            jsonResponse([
                'error' => true,
                'message' => PasswordManager::getValidationError($password) ?? 'Senha não atende aos requisitos mínimos'
            ], 400);
        }
        
        // Atualiza senha
        $hash = PasswordManager::hash($password);
        UsuarioModel::updatePassword($usuario['id'], $hash);
        UsuarioModel::clearPasswordResetToken($usuario['id']);
        
        // Registra auditoria
        AuditHelper::log($usuario['empresa_id'], $usuario['id'], 'PASSWORD_RESET', 'auth', null, null, [
            'email' => $usuario['email']
        ]);
        
        jsonResponse([
            'error' => false,
            'message' => 'Senha alterada com sucesso'
        ]);
    }
    
    /**
     * Altera senha do usuário autenticado
     * 
     * @return void
     */
    public function changePassword(): void
    {
        if (!AuthManager::isAuthenticated()) {
            jsonResponse([
                'error' => true,
                'message' => 'Não autenticado'
            ], 401);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        $usuario = AuthManager::getCurrentUser();
        
        // Verifica senha atual
        if (!PasswordManager::verify($currentPassword, $usuario['senha'])) {
            jsonResponse([
                'error' => true,
                'message' => 'Senha atual incorreta'
            ], 400);
        }
        
        // Valida força da nova senha
        if (!PasswordManager::validateStrength($newPassword)) {
            jsonResponse([
                'error' => true,
                'message' => PasswordManager::getValidationError($newPassword) ?? 'Nova senha não atende aos requisitos'
            ], 400);
        }
        
        // Atualiza senha
        $hash = PasswordManager::hash($newPassword);
        UsuarioModel::updatePassword($usuario['id'], $hash);
        
        // Registra auditoria
        AuditHelper::log($usuario['empresa_id'], $usuario['id'], 'PASSWORD_CHANGE', 'auth', null, null);
        
        jsonResponse([
            'error' => false,
            'message' => 'Senha alterada com sucesso'
        ]);
    }
    
    /**
     * Retorna token CSRF para o frontend
     * 
     * @return void
     */
    public function getCsrfToken(): void
    {
        $token = CsrfManager::getToken();
        
        jsonResponse([
            'error' => false,
            'token' => $token,
            'input_name' => CsrfManager::getInputName()
        ]);
    }
}
