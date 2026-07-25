<?php

namespace App\Auth;

/**
 * CsrfManager - Gerenciamento de proteção CSRF
 * 
 * Responsável por:
 * - Gerar tokens CSRF
 * - Validar tokens CSRF
 * - Regenerar tokens CSRF
 */
class CsrfManager
{
    /**
     * Nome do token CSRF na sessão
     */
    private const CSRF_TOKEN_KEY = 'csrf_token';
    
    /**
     * Nome do token CSRF nos formulários
     */
    private const CSRF_INPUT_NAME = 'csrf_token';
    
    /**
     * Tempo de vida do token CSRF em segundos (1 hora)
     */
    private const CSRF_TOKEN_LIFETIME = 3600;
    
    /**
     * Gera um novo token CSRF
     * 
     * @return string Token CSRF
     */
    public static function generate(): string
    {
        SessionManager::start();
        
        // Gera token aleatório
        $token = bin2hex(random_bytes(32));
        
        // Armazena token na sessão com timestamp
        $_SESSION[self::CSRF_TOKEN_KEY] = [
            'token' => $token,
            'created_at' => time()
        ];
        
        return $token;
    }
    
    /**
     * Retorna o token CSRF atual (gera novo se não existir ou expirado)
     * 
     * @return string Token CSRF
     */
    public static function getToken(): string
    {
        SessionManager::start();
        
        // Verifica se token existe e não expirou
        if (!isset($_SESSION[self::CSRF_TOKEN_KEY])) {
            return self::generate();
        }
        
        $tokenData = $_SESSION[self::CSRF_TOKEN_KEY];
        if (time() - $tokenData['created_at'] > self::CSRF_TOKEN_LIFETIME) {
            return self::generate();
        }
        
        return $tokenData['token'];
    }
    
    /**
     * Valida um token CSRF
     * 
     * @param string $token Token a validar
     * @return bool True se válido
     */
    public static function validate(string $token): bool
    {
        SessionManager::start();
        
        // Verifica se token existe na sessão
        if (!isset($_SESSION[self::CSRF_TOKEN_KEY])) {
            return false;
        }
        
        $tokenData = $_SESSION[self::CSRF_TOKEN_KEY];
        
        // Verifica se token expirou
        if (time() - $tokenData['created_at'] > self::CSRF_TOKEN_LIFETIME) {
            return false;
        }
        
        // Verifica se token corresponde
        return hash_equals($tokenData['token'], $token);
    }
    
    /**
     * Valida token CSRF da requisição atual (POST, PUT, DELETE, PATCH)
     * 
     * @return bool True se válido
     */
    public static function validateRequest(): bool
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Apenas valida para métodos que modificam dados
        if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            return true;
        }
        
        // Tenta obter token do POST ou header
        $token = $_POST[self::CSRF_INPUT_NAME] ?? 
                 $_SERVER['HTTP_X_CSRF_TOKEN'] ?? 
                 $_SERVER['HTTP_X-CSRF-TOKEN'] ?? '';
        
        if (empty($token)) {
            return false;
        }
        
        return self::validate($token);
    }
    
    /**
     * Regenera o token CSRF
     * 
     * @return string Novo token CSRF
     */
    public static function regenerate(): string
    {
        return self::generate();
    }
    
    /**
     * Retorna o nome do campo do input CSRF
     * 
     * @return string Nome do campo
     */
    public static function getInputName(): string
    {
        return self::CSRF_INPUT_NAME;
    }
    
    /**
     * Retorna o HTML do input CSRF para formulários
     * 
     * @return string HTML do input
     */
    public static function getHtmlInput(): string
    {
        $token = self::getToken();
        $name = self::getInputName();
        
        return sprintf(
            '<input type="hidden" name="%s" value="%s">',
            htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8')
        );
    }
    
    /**
     * Retorna o token CSRF como meta tag para AJAX
     * 
     * @return string HTML da meta tag
     */
    public static function getMetaTag(): string
    {
        $token = self::getToken();
        
        return sprintf(
            '<meta name="csrf-token" content="%s">',
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8')
        );
    }
    
    /**
     * Limpa o token CSRF da sessão
     * 
     * @return void
     */
    public static function clear(): void
    {
        SessionManager::start();
        unset($_SESSION[self::CSRF_TOKEN_KEY]);
    }
}
