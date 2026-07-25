<?php

namespace App\Auth;

/**
 * PasswordManager - Gerenciamento de senhas
 * 
 * Responsável por:
 * - Hash de senhas usando password_hash
 * - Verificação de senhas usando password_verify
 * - Validação de força de senha
 */
class PasswordManager
{
    /**
     * Custo do algoritmo bcrypt (recomendado: 10-12)
     */
    private const BCRYPT_COST = 10;
    
    /**
     * Requisitos mínimos de senha
     */
    private const MIN_LENGTH = 8;
    private const REQUIRE_UPPERCASE = true;
    private const REQUIRE_LOWERCASE = true;
    private const REQUIRE_NUMBER = true;
    private const REQUIRE_SPECIAL = false;
    
    /**
     * Cria hash de senha
     * 
     * @param string $password Senha em texto plano
     * @return string Hash da senha
     */
    public static function hash(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, [
            'cost' => self::BCRYPT_COST
        ]);
    }
    
    /**
     * Verifica se a senha corresponde ao hash
     * 
     * @param string $password Senha em texto plano
     * @param string $hash Hash armazenado
     * @return bool True se a senha estiver correta
     */
    public static function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
    
    /**
     * Verifica se o hash precisa ser refeito (algoritmo alterado)
     * 
     * @param string $hash Hash armazenado
     * @return bool True se o hash precisa ser atualizado
     */
    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, [
            'cost' => self::BCRYPT_COST
        ]);
    }
    
    /**
     * Valida a força da senha
     * 
     * @param string $password Senha a validar
     * @return bool True se a senha atende aos requisitos
     */
    public static function validateStrength(string $password): bool
    {
        // Verifica comprimento mínimo
        if (strlen($password) < self::MIN_LENGTH) {
            return false;
        }
        
        // Verifica letras maiúsculas
        if (self::REQUIRE_UPPERCASE && !preg_match('/[A-Z]/', $password)) {
            return false;
        }
        
        // Verifica letras minúsculas
        if (self::REQUIRE_LOWERCASE && !preg_match('/[a-z]/', $password)) {
            return false;
        }
        
        // Verifica números
        if (self::REQUIRE_NUMBER && !preg_match('/[0-9]/', $password)) {
            return false;
        }
        
        // Verifica caracteres especiais
        if (self::REQUIRE_SPECIAL && !preg_match('/[^a-zA-Z0-9]/', $password)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Retorna mensagem de erro de validação de senha
     * 
     * @param string $password Senha a validar
     * @return string|null Mensagem de erro ou null se válida
     */
    public static function getValidationError(string $password): ?string
    {
        if (strlen($password) < self::MIN_LENGTH) {
            return sprintf('A senha deve ter pelo menos %d caracteres', self::MIN_LENGTH);
        }
        
        if (self::REQUIRE_UPPERCASE && !preg_match('/[A-Z]/', $password)) {
            return 'A senha deve conter pelo menos uma letra maiúscula';
        }
        
        if (self::REQUIRE_LOWERCASE && !preg_match('/[a-z]/', $password)) {
            return 'A senha deve conter pelo menos uma letra minúscula';
        }
        
        if (self::REQUIRE_NUMBER && !preg_match('/[0-9]/', $password)) {
            return 'A senha deve conter pelo menos um número';
        }
        
        if (self::REQUIRE_SPECIAL && !preg_match('/[^a-zA-Z0-9]/', $password)) {
            return 'A senha deve conter pelo menos um caractere especial';
        }
        
        return null;
    }
    
    /**
     * Gera uma senha aleatória forte
     * 
     * @param int $length Comprimento da senha
     * @return string Senha gerada
     */
    public static function generateRandom(int $length = 12): string
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        
        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }
        
        return $password;
    }
}
