<?php

namespace App\Auth;

/**
 * SessionManager - Gerenciamento de sessão PHP
 * 
 * Responsável por:
 * - Iniciar e gerenciar sessões PHP
 * - Criar e destruir sessões de usuário
 * - Validar sessões
 * - Prevenir session fixation
 */
class SessionManager
{
    /**
     * Nome da sessão
     */
    private const SESSION_NAME = 'STOCKWAVE_SESSION';
    
    /**
     * Tempo de expiração da sessão em segundos (2 horas)
     */
    private const SESSION_LIFETIME = 7200;
    
    /**
     * Tempo de expiração da sessão com "remember me" (7 dias)
     */
    private const REMEMBER_ME_LIFETIME = 604800;
    
    /**
     * Chaves de sessão
     */
    private const KEY_USER_ID = 'user_id';
    private const KEY_EMPRESA_ID = 'empresa_id';
    private const KEY_SESSION_CREATED = 'session_created';
    private const KEY_LAST_ACTIVITY = 'last_activity';
    private const KEY_IP_ADDRESS = 'ip_address';
    private const KEY_USER_AGENT = 'user_agent';
    private const KEY_REMEMBER_ME = 'remember_me';
    private const KEY_SESSION_TYPE = 'session_type'; // 'normal' ou 'remember'
    
    /**
     * Inicia a sessão se ainda não estiver iniciada
     * 
     * @return void
     */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_name(self::SESSION_NAME);
            session_start([
                'cookie_httponly' => true,
                'cookie_secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
                'cookie_samesite' => 'Strict',
                'use_strict_mode' => true,
                'use_cookies' => true,
                'use_only_cookies' => true
            ]);
        }
    }
    
    /**
     * Cria uma nova sessão para o usuário
     * 
     * @param array $usuario Dados do usuário
     * @param int $empresaId ID da empresa
     * @param bool $rememberMe Se deve lembrar o usuário (7 dias)
     * @return void
     */
    public static function create(array $usuario, int $empresaId, bool $rememberMe = false): void
    {
        self::start();
        
        // Regenera o ID da sessão para prevenir session fixation
        session_regenerate_id(true);
        
        // Armazena dados do usuário na sessão
        $_SESSION[self::KEY_USER_ID] = $usuario['id'];
        $_SESSION[self::KEY_EMPRESA_ID] = $empresaId;
        $_SESSION[self::KEY_SESSION_CREATED] = time();
        $_SESSION[self::KEY_LAST_ACTIVITY] = time();
        $_SESSION[self::KEY_IP_ADDRESS] = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $_SESSION[self::KEY_USER_AGENT] = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $_SESSION[self::KEY_REMEMBER_ME] = $rememberMe;
        $_SESSION[self::KEY_SESSION_TYPE] = $rememberMe ? 'remember' : 'normal';
        
        // Se remember me, ajusta cookie para expirar em 7 dias
        if ($rememberMe) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                session_id(),
                time() + self::REMEMBER_ME_LIFETIME,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
    }
    
    /**
     * Destrói a sessão atual
     * 
     * @return void
     */
    public static function destroy(): void
    {
        self::start();
        
        // Limpa todos os dados da sessão
        $_SESSION = [];
        
        // Destrói o cookie de sessão
        if (isset($_COOKIE[session_name()])) {
            setcookie(
                session_name(),
                '',
                time() - 42000,
                '/',
                '',
                isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
                true
            );
        }
        
        // Destrói a sessão
        session_destroy();
    }
    
    /**
     * Valida se a sessão é válida
     * 
     * @return bool True se a sessão for válida
     */
    public static function validate(): bool
    {
        self::start();
        
        // Verifica se o usuário está na sessão
        if (!isset($_SESSION[self::KEY_USER_ID])) {
            return false;
        }
        
        // Determina o tempo de expiração baseado no tipo de sessão
        $sessionType = $_SESSION[self::KEY_SESSION_TYPE] ?? 'normal';
        $lifetime = $sessionType === 'remember' ? self::REMEMBER_ME_LIFETIME : self::SESSION_LIFETIME;
        
        // Verifica expiração da sessão
        $lastActivity = $_SESSION[self::KEY_LAST_ACTIVITY] ?? 0;
        if (time() - $lastActivity > $lifetime) {
            self::destroy();
            return false;
        }
        
        // Verifica IP (opcional, para maior segurança)
        // Comentado para permitir mudanças de IP (ex: mobile)
        /*
        $currentIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $sessionIp = $_SESSION[self::KEY_IP_ADDRESS] ?? '';
        if ($currentIp !== $sessionIp) {
            self::destroy();
            return false;
        }
        */
        
        // Atualiza última atividade
        $_SESSION[self::KEY_LAST_ACTIVITY] = time();
        
        return true;
    }
    
    /**
     * Retorna o ID do usuário na sessão
     * 
     * @return int|null ID do usuário ou null
     */
    public static function getUserId(): ?int
    {
        self::start();
        return $_SESSION[self::KEY_USER_ID] ?? null;
    }
    
    /**
     * Retorna o ID da empresa na sessão
     * 
     * @return int|null ID da empresa ou null
     */
    public static function getEmpresaId(): ?int
    {
        self::start();
        return $_SESSION[self::KEY_EMPRESA_ID] ?? null;
    }
    
    /**
     * Define o ID da empresa na sessão (para troca de empresa no SaaS)
     * 
     * @param int $empresaId ID da empresa
     * @return void
     */
    public static function setEmpresa(int $empresaId): void
    {
        self::start();
        $_SESSION[self::KEY_EMPRESA_ID] = $empresaId;
        $_SESSION[self::KEY_LAST_ACTIVITY] = time();
    }
    
    /**
     * Verifica se a sessão existe
     * 
     * @return bool True se a sessão existir
     */
    public static function exists(): bool
    {
        self::start();
        return isset($_SESSION[self::KEY_USER_ID]);
    }
    
    /**
     * Retorna o tempo restante da sessão em segundos
     * 
     * @return int Tempo restante
     */
    public static function getRemainingTime(): int
    {
        self::start();
        $sessionType = $_SESSION[self::KEY_SESSION_TYPE] ?? 'normal';
        $lifetime = $sessionType === 'remember' ? self::REMEMBER_ME_LIFETIME : self::SESSION_LIFETIME;
        $lastActivity = $_SESSION[self::KEY_LAST_ACTIVITY] ?? 0;
        $elapsed = time() - $lastActivity;
        return max(0, $lifetime - $elapsed);
    }
    
    /**
     * Renova a sessão (atualiza última atividade)
     * 
     * @return void
     */
    public static function renew(): void
    {
        self::start();
        $_SESSION[self::KEY_LAST_ACTIVITY] = time();
    }
}
