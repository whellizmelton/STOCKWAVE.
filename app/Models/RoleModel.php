<?php

namespace App\Models;

use App\Core\Database;

/**
 * RoleModel - Model de roles
 * 
 * Responsável por:
 * - CRUD de roles
 * - Gestão de permissões de roles
 * - Atribuição de roles a usuários
 */
class RoleModel
{
    /**
     * Lista roles por empresa
     * 
     * @param int $empresaId ID da empresa
     * @return array Lista de roles
     */
    public static function listByEmpresa(int $empresaId): array
    {
        $sql = 'SELECT * FROM roles WHERE empresa_id = :empresa_id ORDER BY nivel DESC';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Busca role por ID
     * 
     * @param int $id ID da role
     * @return array|null Dados da role ou null
     */
    public static function findById(int $id): ?array
    {
        $sql = 'SELECT * FROM roles WHERE id = :id LIMIT 1';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Busca roles de um usuário
     * 
     * @param int $usuarioId ID do usuário
     * @return array Lista de roles
     */
    public static function getByUsuario(int $usuarioId): array
    {
        $sql = 'SELECT r.* FROM roles r
                JOIN usuario_roles ur ON r.id = ur.role_id
                WHERE ur.usuario_id = :usuario_id
                ORDER BY r.nivel DESC';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':usuario_id' => $usuarioId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Busca permissões de uma role
     * 
     * @param int $roleId ID da role
     * @return array Lista de permissões
     */
    public static function getPermissions(int $roleId): array
    {
        $sql = 'SELECT p.* FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = :role_id
                ORDER BY p.modulo, p.nome';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':role_id' => $roleId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Busca todas as permissões de um usuário (via roles)
     * 
     * @param int $usuarioId ID do usuário
     * @return array Lista de permissões
     */
    public static function getUsuarioPermissions(int $usuarioId): array
    {
        $sql = 'SELECT DISTINCT p.* FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN usuario_roles ur ON rp.role_id = ur.role_id
                WHERE ur.usuario_id = :usuario_id
                ORDER BY p.modulo, p.nome';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':usuario_id' => $usuarioId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Cria uma nova role
     * 
     * @param int $empresaId ID da empresa
     * @param array $data Dados da role
     * @return int ID da role criada
     */
    public static function create(int $empresaId, array $data): int
    {
        $sql = 'INSERT INTO roles (empresa_id, nome, descricao, is_system, nivel)
                VALUES (:empresa_id, :nome, :descricao, :is_system, :nivel)';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([
            ':empresa_id' => $empresaId,
            ':nome' => $data['nome'],
            ':descricao' => $data['descricao'] ?? null,
            ':is_system' => $data['is_system'] ?? false,
            ':nivel' => $data['nivel'] ?? 0
        ]);
        return (int) Database::getInstance()->lastInsertId();
    }
    
    /**
     * Atualiza uma role
     * 
     * @param int $id ID da role
     * @param array $data Dados a atualizar
     * @return bool True se atualizado com sucesso
     */
    public static function update(int $id, array $data): bool
    {
        $fields = [];
        $params = [':id' => $id];
        
        foreach (['nome', 'descricao', 'nivel'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = 'UPDATE roles SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute($params);
    }
    
    /**
     * Deleta uma role
     * 
     * @param int $id ID da role
     * @return bool True se deletado com sucesso
     */
    public static function delete(int $id): bool
    {
        $role = self::findById($id);
        
        // Não permite deletar roles do sistema
        if ($role && $role['is_system']) {
            return false;
        }
        
        $sql = 'DELETE FROM roles WHERE id = :id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }
    
    /**
     * Atribui uma role a um usuário
     * 
     * @param int $usuarioId ID do usuário
     * @param int $roleId ID da role
     * @param int $assignedBy ID do usuário que atribuiu
     * @return bool True se atribuído com sucesso
     */
    public static function assignToUsuario(int $usuarioId, int $roleId, int $assignedBy): bool
    {
        $sql = 'INSERT INTO usuario_roles (usuario_id, role_id, assigned_by)
                VALUES (:usuario_id, :role_id, :assigned_by)
                ON DUPLICATE KEY UPDATE assigned_by = :assigned_by';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([
            ':usuario_id' => $usuarioId,
            ':role_id' => $roleId,
            ':assigned_by' => $assignedBy
        ]);
    }
    
    /**
     * Remove uma role de um usuário
     * 
     * @param int $usuarioId ID do usuário
     * @param int $roleId ID da role
     * @return bool True se removido com sucesso
     */
    public static function removeFromUsuario(int $usuarioId, int $roleId): bool
    {
        $sql = 'DELETE FROM usuario_roles WHERE usuario_id = :usuario_id AND role_id = :role_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([
            ':usuario_id' => $usuarioId,
            ':role_id' => $roleId
        ]);
    }
    
    /**
     * Sincroniza roles de um usuário (substitui todas)
     * 
     * @param int $usuarioId ID do usuário
     * @param array $roleIds Array de IDs de roles
     * @param int $updatedBy ID do usuário que atualizou
     * @return bool True se sincronizado com sucesso
     */
    public static function syncUsuarioRoles(int $usuarioId, array $roleIds, int $updatedBy): bool
    {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        
        try {
            $pdo->beginTransaction();
            
            // Remove todas as roles
            $sql = 'DELETE FROM usuario_roles WHERE usuario_id = :usuario_id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':usuario_id' => $usuarioId]);
            
            // Adiciona novas roles
            foreach ($roleIds as $roleId) {
                $sql = 'INSERT INTO usuario_roles (usuario_id, role_id, assigned_by)
                        VALUES (:usuario_id, :role_id, :assigned_by)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':usuario_id' => $usuarioId,
                    ':role_id' => $roleId,
                    ':assigned_by' => $updatedBy
                ]);
            }
            
            $pdo->commit();
            return true;
        } catch (\Exception $e) {
            $pdo->rollBack();
            error_log('syncUsuarioRoles: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Atribui uma permissão a uma role
     * 
     * @param int $roleId ID da role
     * @param int $permissionId ID da permissão
     * @param int $grantedBy ID do usuário que concedeu
     * @return bool True se atribuído com sucesso
     */
    public static function assignPermission(int $roleId, int $permissionId, int $grantedBy): bool
    {
        $sql = 'INSERT INTO role_permissions (role_id, permission_id, granted_by)
                VALUES (:role_id, :permission_id, :granted_by)
                ON DUPLICATE KEY UPDATE granted_by = :granted_by';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([
            ':role_id' => $roleId,
            ':permission_id' => $permissionId,
            ':granted_by' => $grantedBy
        ]);
    }
    
    /**
     * Remove uma permissão de uma role
     * 
     * @param int $roleId ID da role
     * @param int $permissionId ID da permissão
     * @return bool True se removido com sucesso
     */
    public static function removePermission(int $roleId, int $permissionId): bool
    {
        $sql = 'DELETE FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([
            ':role_id' => $roleId,
            ':permission_id' => $permissionId
        ]);
    }
    
    /**
     * Sincroniza permissões de uma role (substitui todas)
     * 
     * @param int $roleId ID da role
     * @param array $permissionIds Array de IDs de permissões
     * @param int $grantedBy ID do usuário que concedeu
     * @return bool True se sincronizado com sucesso
     */
    public static function syncRolePermissions(int $roleId, array $permissionIds, int $grantedBy): bool
    {
        $db = Database::getInstance();
        $pdo = $db->getConnection();
        
        try {
            $pdo->beginTransaction();
            
            // Remove todas as permissões
            $sql = 'DELETE FROM role_permissions WHERE role_id = :role_id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':role_id' => $roleId]);
            
            // Adiciona novas permissões
            foreach ($permissionIds as $permissionId) {
                $sql = 'INSERT INTO role_permissions (role_id, permission_id, granted_by)
                        VALUES (:role_id, :permission_id, :granted_by)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':role_id' => $roleId,
                    ':permission_id' => $permissionId,
                    ':granted_by' => $grantedBy
                ]);
            }
            
            $pdo->commit();
            return true;
        } catch (\Exception $e) {
            $pdo->rollBack();
            error_log('syncRolePermissions: ' . $e->getMessage());
            return false;
        }
    }
}
