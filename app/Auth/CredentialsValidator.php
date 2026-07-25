<?php

namespace App\Auth;

/**
 * CredentialsValidator - Validação de credenciais de autenticação
 * 
 * Responsável por:
 * - Validar formato de email
 * - Validar formato de senha
 * - Validar dados de login
 */
class CredentialsValidator
{
    /**
     * Valida as credenciais de login
     * 
     * @param array $data Dados a validar (email, password)
     * @return bool True se as credenciais forem válidas
     */
    public static function validate(array $data): bool
    {
        if (empty($data['email']) || empty($data['password'])) {
            return false;
        }
        
        if (!self::validateEmail($data['email'])) {
            return false;
        }
        
        if (!self::validatePasswordFormat($data['password'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Valida o formato de email
     * 
     * @param string $email Email a validar
     * @return bool True se o email for válido
     */
    public static function validateEmail(string $email): bool
    {
        if (empty($email)) {
            return false;
        }
        
        // Valida formato básico
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        // Valida comprimento máximo
        if (strlen($email) > 150) {
            return false;
        }
        
        // Valida que não tem espaços
        if (strpos($email, ' ') !== false) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Valida o formato da senha (não a força, apenas o formato)
     * 
     * @param string $password Senha a validar
     * @return bool True se o formato for válido
     */
    public static function validatePasswordFormat(string $password): bool
    {
        // Verifica se não está vazia
        if (empty($password)) {
            return false;
        }
        
        // Verifica comprimento mínimo
        if (strlen($password) < 1) {
            return false;
        }
        
        // Verifica comprimento máximo
        if (strlen($password) > 255) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Retorna mensagem de erro de validação
     * 
     * @param array $data Dados a validar
     * @return string|null Mensagem de erro ou null se válido
     */
    public static function getValidationError(array $data): ?string
    {
        if (empty($data['email']) && empty($data['password'])) {
            return 'Email e senha são obrigatórios';
        }
        
        if (empty($data['email'])) {
            return 'Email é obrigatório';
        }
        
        if (!self::validateEmail($data['email'])) {
            return 'Email inválido';
        }
        
        if (empty($data['password'])) {
            return 'Senha é obrigatória';
        }
        
        if (!self::validatePasswordFormat($data['password'])) {
            return 'Senha inválida';
        }
        
        return null;
    }
    
    /**
     * Sanitiza email (remove espaços, converte para minúsculas)
     * 
     * @param string $email Email a sanitizar
     * @return string Email sanitizado
     */
    public static function sanitizeEmail(string $email): string
    {
        return trim(strtolower($email));
    }
}
