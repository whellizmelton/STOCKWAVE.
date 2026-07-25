<?php

namespace App\Models;

use App\Core\Database;

/**
 * LoginAttemptModel - Model de tentativas de login
 * 
 * Responsável por:
 * - Registrar tentativas de login
 * - Contar tentativas falhas
 * - Verificar bloqueio por brute force
 * - Limpar tentativas antigas
 * - Bloquear usuários após tentativas excessivas
 */
class LoginAttemptModel
{
    // Configurações de bloqueio
    private const MAX_ATTEMPTS = 5;
    private const BLOCK_DURATION_MINUTES = 15;
    private const AUTO_BLOCK_THRESHOLD = 10;
    private const AUTO_BLOCK_DURATION_HOURS = 1;
    /**
     * Registra uma tentativa de login
     * 
     * @param string $email Email utilizado
     * @param string $ip Endereço IP
     * @param string $userAgent User agent
     * @param bool $success Se a tentativa foi bem-sucedida
     * @return void
     */
    public static function register(string $email, string $ip, string $userAgent, bool $success): void
    {
        $sql = 'INSERT INTO login_attempts (email, ip_address, user_agent, success)
                VALUES (:email, :ip, :user_agent, :success)';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([
            ':email' => $email,
            ':ip' => $ip,
            ':user_agent' => $userAgent,
            ':success' => $success ? 1 : 0
        ]);
        
        // Se falhou, verifica se deve bloquear automaticamente
        if (!$success) {
            self::checkAndAutoBlock($email);
        }
    }
    
    /**
     * Verifica e bloqueia automaticamente se houver muitas tentativas
     * 
     * @param string $email Email
     * @return void
     */
    private static function checkAndAutoBlock(string $email): void
    {
        $failedCount = self::countFailedAttempts($email, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 60);
        
        if ($failedCount >= self::AUTO_BLOCK_THRESHOLD) {
            $usuario = UsuarioModel::findByEmail($email);
            if ($usuario) {
                $blockedUntil = date('Y-m-d H:i:s', strtotime('+' . self::AUTO_BLOCK_DURATION_HOURS . ' hours'));
                UsuarioModel::update($usuario['id'], $usuario['empresa_id'], [
                    'blocked_until' => $blockedUntil,
                    'status' => 'blocked'
                ], 0);
                
                // Registra no log de auditoria
                if (class_exists('App\Helpers\AuditHelper')) {
                    \App\Helpers\AuditHelper::log(
                        $usuario['empresa_id'],
                        null,
                        'AUTO_BLOCK_USER',
                        'usuarios',
                        $usuario['id'],
                        null,
                        ['blocked_until' => $blockedUntil, 'failed_attempts' => $failedCount]
                    );
                }
            }
        }
    }
    
    /**
     * Conta tentativas falhas em um período
     * 
     * @param string $email Email
     * @param string $ip Endereço IP
     * @param int $minutes Período em minutos
     * @return int Número de tentativas falhas
     */
    public static function countFailedAttempts(string $email, string $ip, int $minutes = 15): int
    {
        $sql = 'SELECT COUNT(*) FROM login_attempts
                WHERE success = 0
                AND (email = :email OR ip_address = :ip)
                AND attempt_time > DATE_SUB(NOW(), INTERVAL :minutes MINUTE)';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([
            ':email' => $email,
            ':ip' => $ip,
            ':minutes' => $minutes
        ]);
        return (int) $stmt->fetchColumn();
    }
    
    /**
     * Verifica se está bloqueado por brute force
     * 
     * @param string $email Email
     * @param string $ip Endereço IP
     * @param int $maxAttempts Máximo de tentativas permitidas (usa constante se não fornecido)
     * @param int $minutes Período em minutos (usa constante se não fornecido)
     * @return bool True se estiver bloqueado
     */
    public static function isBlocked(string $email, string $ip, ?int $maxAttempts = null, ?int $minutes = null): bool
    {
        $maxAttempts = $maxAttempts ?? self::MAX_ATTEMPTS;
        $minutes = $minutes ?? self::BLOCK_DURATION_MINUTES;
        
        // Verifica bloqueio por tentativas
        if (self::countFailedAttempts($email, $ip, $minutes) >= $maxAttempts) {
            return true;
        }
        
        // Verifica bloqueio explícito no usuário
        $usuario = UsuarioModel::findByEmail($email);
        if ($usuario && $usuario['blocked_until'] && $usuario['blocked_until'] > date('Y-m-d H:i:s')) {
            return true;
        }
        
        // Verifica se usuário está bloqueado permanentemente
        if ($usuario && $usuario['status'] === 'blocked' && !$usuario['blocked_until']) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Retorna tempo restante de bloqueio em segundos
     * 
     * @param string $email Email
     * @param string $ip Endereço IP
     * @return int Tempo restante em segundos (0 se não bloqueado)
     */
    public static function getBlockTimeRemaining(string $email, string $ip): int
    {
        // Verifica bloqueio explícito no usuário
        $usuario = UsuarioModel::findByEmail($email);
        if ($usuario && $usuario['blocked_until']) {
            $blockedUntil = strtotime($usuario['blocked_until']);
            $remaining = $blockedUntil - time();
            if ($remaining > 0) {
                return $remaining;
            }
        }
        
        return 0;
    }
    
    /**
     * Limpa tentativas antigas
     * 
     * @param int $days Dias para manter
     * @return void
     */
    public static function clearOldAttempts(int $days = 30): void
    {
        $sql = 'DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL :days DAY)';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':days' => $days]);
    }
    
    /**
     * Limpa tentativas de um email específico
     * 
     * @param string $email Email
     * @return void
     */
    public static function clearByEmail(string $email): void
    {
        $sql = 'DELETE FROM login_attempts WHERE email = :email';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':email' => $email]);
    }
    
    /**
     * Retorna estatísticas de tentativas de login
     * 
     * @param string $email Email
     * @param int $days Dias para considerar
     * @return array Estatísticas
     */
    public static function getStatistics(string $email, int $days = 30): array
    {
        $sql = 'SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
                    MAX(attempt_time) as last_attempt
                FROM login_attempts
                WHERE email = :email
                AND attempt_time > DATE_SUB(NOW(), INTERVAL :days DAY)';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':email' => $email, ':days' => $days]);
        return $stmt->fetch() ?: [];
    }
}
