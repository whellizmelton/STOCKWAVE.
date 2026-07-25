<?php

namespace App\Models;

use App\Core\Database;
use App\Helpers\AuditHelper;

class CategoriaModel
{
    public static function listarTodas(int $empresaId): array
    {
        $sql = 'SELECT * FROM categorias WHERE empresa_id = :empresa_id ORDER BY nome';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);

        return $stmt->fetchAll();
    }

    public static function buscarPorId(int $id, int $empresaId): ?array
    {
        $sql = 'SELECT * FROM categorias WHERE id = :id AND empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public static function criar(array $data, int $usuarioId): int|false
    {
        $sql = 'INSERT INTO categorias (empresa_id, nome, descricao) 
                VALUES (:empresa_id, :nome, :descricao)';
        
        try {
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $ok = $stmt->execute([
                ':empresa_id' => $data['empresa_id'],
                ':nome' => trim($data['nome']),
                ':descricao' => trim($data['descricao'] ?? '')
            ]);
            
            if (!$ok) {
                return false;
            }
            
            return (int) Database::getInstance()->lastInsertId();
        } catch (PDOException $e) {
            error_log('Erro ao criar categoria: ' . $e->getMessage());
            return false;
        }
    }

    public static function atualizar(int $id, int $empresaId, array $data, int $usuarioId): bool
    {
        $old = self::buscarPorId($id, $empresaId);
        if (!$old) {
            return false;
        }

        $sql = 'UPDATE categorias SET nome = :nome, descricao = :descricao
                WHERE id = :id AND empresa_id = :empresa_id';
        
        try {
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $ok = $stmt->execute([
                ':nome' => trim($data['nome']),
                ':descricao' => trim($data['descricao'] ?? ''),
                ':id' => $id,
                ':empresa_id' => $empresaId,
            ]);

            if ($ok) {
                AuditHelper::log($empresaId, $usuarioId, 'UPDATE', 'categorias', $id, $old, $data);
            }

            return $ok;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar categoria: ' . $e->getMessage());
            return false;
        }
    }

    public static function deletar(int $id, int $empresaId, int $usuarioId): bool
    {
        $old = self::buscarPorId($id, $empresaId);
        if (!$old) {
            return false;
        }

        $sql = 'DELETE FROM categorias WHERE id = :id AND empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $ok = $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);

        if ($ok) {
            AuditHelper::log($empresaId, $usuarioId, 'DELETE', 'categorias', $id, $old, null);
        }

        return $ok;
    }

    public static function contarProdutos(int $categoriaId, int $empresaId): int
    {
        $sql = 'SELECT COUNT(*) AS total FROM produtos
                WHERE categoria_id = :categoria_id AND empresa_id = :empresa_id AND deleted_at IS NULL';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':categoria_id' => $categoriaId, ':empresa_id' => $empresaId]);

        return (int) $stmt->fetchColumn();
    }
}
