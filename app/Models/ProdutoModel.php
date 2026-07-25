<?php

namespace App\Models;

use App\Core\Database;
use App\Helpers\AuditHelper;
use PDO;

class ProdutoModel
{
    public static function listarTodos(int $empresaId): array
    {
        $sql = 'SELECT p.*, c.nome AS categoria_nome
                FROM produtos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.empresa_id = :empresa_id AND p.deleted_at IS NULL
                ORDER BY p.nome';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);

        return $stmt->fetchAll();
    }

    public static function buscarPorId(int $id, int $empresaId): ?array
    {
        $sql = 'SELECT p.*, c.nome AS categoria_nome
                FROM produtos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.id = :id AND p.empresa_id = :empresa_id AND p.deleted_at IS NULL';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public static function criar(array $data, int $usuarioId): int|false
    {
        $sql = 'INSERT INTO produtos (
                    empresa_id, nome, descricao, categoria_id,
                    quantidade, quantidade_minima, preco, codigo_barras
                ) VALUES (
                    :empresa_id, :nome, :descricao, :categoria_id,
                    :quantidade, :quantidade_minima, :preco, :codigo_barras
                )';

        try {
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $ok = $stmt->execute([
                ':empresa_id' => $data['empresa_id'],
                ':nome' => trim($data['nome']),
                ':descricao' => trim($data['descricao'] ?? ''),
                ':categoria_id' => $data['categoria_id'] ?: null,
                ':quantidade' => $data['quantidade'] ?? 0,
                ':quantidade_minima' => $data['quantidade_minima'] ?? 0,
                ':preco' => $data['preco'] ?? 0,
                ':codigo_barras' => trim($data['codigo_barras'] ?? ''),
            ]);

            if (!$ok) {
                return false;
            }

            $id = (int) Database::getInstance()->lastInsertId();
            AuditHelper::log($data['empresa_id'], $usuarioId, 'CREATE', 'produtos', $id, null, $data);

            return $id;
        } catch (PDOException $e) {
            error_log('Erro ao criar produto: ' . $e->getMessage());
            return false;
        }
    }

    public static function atualizar(int $id, int $empresaId, array $data, int $usuarioId): bool
    {
        $old = self::buscarPorId($id, $empresaId);
        if (!$old) {
            return false;
        }

        $sql = 'UPDATE produtos SET
                    nome = :nome,
                    descricao = :descricao,
                    categoria_id = :categoria_id,
                    quantidade_minima = :quantidade_minima,
                    preco = :preco,
                    codigo_barras = :codigo_barras
                WHERE id = :id AND empresa_id = :empresa_id';

        try {
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            $ok = $stmt->execute([
                ':nome' => trim($data['nome']),
                ':descricao' => trim($data['descricao'] ?? ''),
                ':categoria_id' => $data['categoria_id'] ?: null,
                ':quantidade_minima' => $data['quantidade_minima'] ?? 0,
                ':preco' => $data['preco'] ?? 0,
                ':codigo_barras' => trim($data['codigo_barras'] ?? ''),
                ':id' => $id,
                ':empresa_id' => $empresaId,
            ]);

            if ($ok) {
                AuditHelper::log($empresaId, $usuarioId, 'UPDATE', 'produtos', $id, $old, $data);
            }

            return $ok;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar produto: ' . $e->getMessage());
            return false;
        }
    }

    public static function deletar(int $id, int $empresaId, int $usuarioId): bool
    {
        $old = self::buscarPorId($id, $empresaId);
        if (!$old) {
            return false;
        }

        $sql = 'UPDATE produtos SET deleted_at = NOW() WHERE id = :id AND empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $ok = $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);

        if ($ok) {
            AuditHelper::log($empresaId, $usuarioId, 'DELETE', 'produtos', $id, $old, ['deleted_at' => 'NOW()']);
        }

        return $ok;
    }

    public static function buscarBaixoEstoque(int $empresaId): array
    {
        $sql = 'SELECT p.*, c.nome AS categoria_nome
                FROM produtos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.empresa_id = :empresa_id
                  AND p.quantidade <= p.quantidade_minima
                  AND p.deleted_at IS NULL
                ORDER BY p.quantidade ASC';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);

        return $stmt->fetchAll();
    }
}
