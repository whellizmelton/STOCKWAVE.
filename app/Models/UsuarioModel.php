<?php

namespace App\Models;

use App\Core\Database;
use App\Helpers\AuditHelper;
use PDOException;
use RuntimeException;

/**
 * UsuarioModel - Model de usuários
 * 
 * Responsável por:
 * - CRUD de usuários
 * - Busca por email
 * - Gerenciamento de senha
 * - Gerenciamento de reset de senha
 */
class UsuarioModel
{
    /**
     * Busca usuário por email
     * 
     * @param string $email Email do usuário
     * @return array|null Dados do usuário ou null
     */
    public static function findByEmail(string $email): ?array
    {
        $sql = 'SELECT * FROM usuarios WHERE email = :email LIMIT 1';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':email' => $email]);
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Busca usuário por ID
     * 
     * @param int $id ID do usuário
     * @param int|null $empresaId ID da empresa (opcional, para isolamento)
     * @return array|null Dados do usuário ou null
     */
    public static function findById(int $id, ?int $empresaId = null): ?array
    {
        if ($empresaId !== null) {
            $sql = 'SELECT * FROM usuarios WHERE id = :id AND empresa_id = :empresa_id LIMIT 1';
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);
        } else {
            $sql = 'SELECT * FROM usuarios WHERE id = :id LIMIT 1';
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $stmt->execute([':id' => $id]);
        }
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Lista usuários por empresa
     * 
     * @param int $empresaId ID da empresa
     * @return array Lista de usuários
     */
    public static function listByEmpresa(int $empresaId): array
    {
        $sql = 'SELECT id, nome, email, status, email_verified, created_at, last_login
                FROM usuarios 
                WHERE empresa_id = :empresa_id
                ORDER BY nome';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Cria um novo usuário
     * 
     * @param int $empresaId ID da empresa
     * @param array $data Dados do usuário
     * @param int $createdBy ID do usuário que criou
     * @return int ID do usuário criado
     */
    public static function create(int $empresaId, array $data, int $createdBy): int
    {
        $sql = 'INSERT INTO usuarios (empresa_id, nome, email, senha, status, created_by)
                VALUES (:empresa_id, :nome, :email, :senha, :status, :created_by)';
        
        try {
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $stmt->execute([
                ':empresa_id' => $empresaId,
                ':nome' => $data['nome'],
                ':email' => strtolower(trim($data['email'])),
                ':senha' => $data['senha'],
                ':status' => $data['status'] ?? 'pending',
                ':created_by' => $createdBy
            ]);
            
            $usuarioId = (int) Database::getInstance()->lastInsertId();
        } catch (PDOException $e) {
            error_log('Erro ao criar usuário: ' . $e->getMessage());
            throw new RuntimeException('Erro ao criar usuário');
        }
        
        AuditHelper::log($empresaId, $createdBy, 'CREATE', 'usuarios', $usuarioId, null, $data);
        
        return $usuarioId;
    }
    
    /**
     * Atualiza um usuário
     * 
     * @param int $id ID do usuário
     * @param int $empresaId ID da empresa
     * @param array $data Dados a atualizar
     * @param int $updatedBy ID do usuário que atualizou
     * @return bool True se atualizado com sucesso
     */
    public static function update(int $id, int $empresaId, array $data, int $updatedBy): bool
    {
        $oldValues = self::findById($id, $empresaId);
        if (!$oldValues) {
            return false;
        }
        
        $fields = [];
        $params = [':id' => $id, ':empresa_id' => $empresaId, ':updated_by' => $updatedBy];
        
        foreach (['nome', 'email', 'senha', 'status', 'email_verified'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $fields[] = 'updated_by = :updated_by';
        
        $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = :id AND empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            AuditHelper::log($empresaId, $updatedBy, 'UPDATE', 'usuarios', $id, $oldValues, $data);
        }
        
        return $result;
    }
    
    /**
     * Deleta um usuário
     * 
     * @param int $id ID do usuário
     * @param int $empresaId ID da empresa
     * @param int $deletedBy ID do usuário que deletou
     * @return bool True se deletado com sucesso
     */
    public static function delete(int $id, int $empresaId, int $deletedBy): bool
    {
        $oldValues = self::findById($id, $empresaId);
        if (!$oldValues) {
            return false;
        }
        
        $sql = 'DELETE FROM usuarios WHERE id = :id AND empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $result = $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);
        
        if ($result) {
            AuditHelper::log($empresaId, $deletedBy, 'DELETE', 'usuarios', $id, $oldValues, null);
        }
        
        return $result;
    }
    
    /**
     * Atualiza último login
     * 
     * @param int $id ID do usuário
     * @param string $ip Endereço IP
     * @return bool True se atualizado com sucesso
     */
    public static function updateLastLogin(int $id, string $ip): bool
    {
        $sql = 'UPDATE usuarios SET last_login = NOW(), last_login_ip = :ip, login_attempts = 0
                WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':id' => $id, ':ip' => $ip]);
    }
    
    /**
     * Incrementa tentativas de login
     * 
     * @param string $email Email do usuário
     * @return bool True se incrementado com sucesso
     */
    public static function incrementLoginAttempts(string $email): bool
    {
        $sql = 'UPDATE usuarios SET login_attempts = login_attempts + 1 WHERE email = :email';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':email' => $email]);
    }
    
    /**
     * Bloqueia usuário até uma data
     * 
     * @param string $email Email do usuário
     * @param string $until Data de bloqueio
     * @return bool True se bloqueado com sucesso
     */
    public static function blockUntil(string $email, string $until): bool
    {
        $sql = 'UPDATE usuarios SET blocked_until = :until WHERE email = :email';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':email' => $email, ':until' => $until]);
    }
    
    /**
     * Define token de reset de senha
     * 
     * @param int $id ID do usuário
     * @param string $token Token de reset
     * @param string $expiresAt Data de expiração
     * @return bool True se definido com sucesso
     */
    public static function setPasswordResetToken(int $id, string $token, string $expiresAt): bool
    {
        $sql = 'UPDATE usuarios SET password_reset_token = :token, password_reset_expires_at = :expires
                WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([
            ':id' => $id,
            ':token' => $token,
            ':expires' => $expiresAt
        ]);
    }
    
    /**
     * Busca usuário por token de reset de senha
     * 
     * @param string $token Token de reset
     * @return array|null Dados do usuário ou null
     */
    public static function findByPasswordResetToken(string $token): ?array
    {
        $sql = 'SELECT * FROM usuarios 
                WHERE password_reset_token = :token 
                AND password_reset_expires_at > NOW()
                LIMIT 1';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':token' => $token]);
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Limpa token de reset de senha
     * 
     * @param int $id ID do usuário
     * @return bool True se limpo com sucesso
     */
    public static function clearPasswordResetToken(int $id): bool
    {
        $sql = 'UPDATE usuarios SET password_reset_token = NULL, password_reset_expires_at = NULL
                WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }
    
    /**
     * Atualiza senha do usuário
     * 
     * @param int $id ID do usuário
     * @param string $hash Hash da nova senha
     * @return bool True se atualizado com sucesso
     */
    public static function updatePassword(int $id, string $hash): bool
    {
        $sql = 'UPDATE usuarios SET senha = :hash, password_changed_at = NOW(), login_attempts = 0
                WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':id' => $id, ':hash' => $hash]);
    }
    
    /**
     * Marca email como verificado
     * 
     * @param int $id ID do usuário
     * @return bool True se marcado com sucesso
     */
    public static function markEmailAsVerified(int $id): bool
    {
        $sql = 'UPDATE usuarios SET email_verified = TRUE, email_verified_at = NOW() WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }
}
