<?php

namespace App\Models;

use App\Core\Database;
use App\Helpers\AuditHelper;
use Exception;

class MovimentacaoModel
{
    public static function listarTodas(int $empresaId, int $limit = 50, int $offset = 0): array
    {
        $sql = 'SELECT m.*, p.nome AS produto_nome, c.nome AS categoria_nome
                FROM movimentacoes m
                JOIN produtos p ON m.produto_id = p.id
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE m.empresa_id = :empresa_id
                ORDER BY m.data_hora DESC
                LIMIT :limit OFFSET :offset';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->bindValue(':empresa_id', $empresaId, \PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function buscarPorId(int $id, int $empresaId): ?array
    {
        $sql = 'SELECT m.*, p.nome AS produto_nome, c.nome AS categoria_nome
                FROM movimentacoes m
                JOIN produtos p ON m.produto_id = p.id
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE m.id = :id AND m.empresa_id = :empresa_id';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public static function registrarEntrada(array $data, int $usuarioId): bool
    {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        try {
            $pdo->beginTransaction();

            $sql = 'INSERT INTO movimentacoes (
                        empresa_id, produto_id, tipo, quantidade, motivo, observacoes, usuario_id, data_hora
                    ) VALUES (
                        :empresa_id, :produto_id, \'entrada\', :quantidade, :motivo, :observacoes, :usuario_id, :data_hora
                    )';

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':empresa_id' => $data['empresa_id'],
                ':produto_id' => $data['produto_id'],
                ':quantidade' => $data['quantidade'],
                ':motivo' => self::normalizeMotivo($data['motivo'] ?? 'outros', 'entrada'),
                ':observacoes' => $data['observacoes'] ?? '',
                ':usuario_id' => $usuarioId,
                ':data_hora' => $data['data_hora'],
            ]);

            $movId = (int) $db->lastInsertId();

            $sqlUpdate = 'UPDATE produtos SET quantidade = quantidade + :quantidade
                          WHERE id = :produto_id AND empresa_id = :empresa_id';
            $stmtUpdate = $pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([
                ':quantidade' => $data['quantidade'],
                ':produto_id' => $data['produto_id'],
                ':empresa_id' => $data['empresa_id'],
            ]);

            AuditHelper::log($data['empresa_id'], $usuarioId, 'CREATE_ENTRADA', 'movimentacoes', $movId, null, $data);

            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $db->rollBack();
            error_log('registrarEntrada: ' . $e->getMessage());
            return false;
        }
    }

    public static function registrarSaida(array $data, int $usuarioId): bool
    {
        $db = Database::getInstance();
        $pdo = $db->getConnection();

        try {
            $pdo->beginTransaction();

            $sqlCheck = 'SELECT quantidade FROM produtos
                         WHERE id = :produto_id AND empresa_id = :empresa_id FOR UPDATE';
            $stmtCheck = $pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':produto_id' => $data['produto_id'],
                ':empresa_id' => $data['empresa_id'],
            ]);
            $produto = $stmtCheck->fetch();

            if (!$produto || (float) $produto['quantidade'] < (float) $data['quantidade']) {
                $pdo->rollBack();
                return false;
            }

            $sql = 'INSERT INTO movimentacoes (
                        empresa_id, produto_id, tipo, quantidade, motivo, observacoes, usuario_id, data_hora
                    ) VALUES (
                        :empresa_id, :produto_id, \'saida\', :quantidade, :motivo, :observacoes, :usuario_id, :data_hora
                    )';

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':empresa_id' => $data['empresa_id'],
                ':produto_id' => $data['produto_id'],
                ':quantidade' => $data['quantidade'],
                ':motivo' => self::normalizeMotivo($data['motivo'] ?? 'outros', 'saida'),
                ':observacoes' => $data['observacoes'] ?? '',
                ':usuario_id' => $usuarioId,
                ':data_hora' => $data['data_hora'],
            ]);

            $movId = (int) $db->lastInsertId();

            $sqlUpdate = 'UPDATE produtos SET quantidade = quantidade - :quantidade
                          WHERE id = :produto_id AND empresa_id = :empresa_id';
            $stmtUpdate = $pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([
                ':quantidade' => $data['quantidade'],
                ':produto_id' => $data['produto_id'],
                ':empresa_id' => $data['empresa_id'],
            ]);

            AuditHelper::log($data['empresa_id'], $usuarioId, 'CREATE_SAIDA', 'movimentacoes', $movId, null, $data);

            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $db->rollBack();
            error_log('registrarSaida: ' . $e->getMessage());
            return false;
        }
    }

    public static function contarTotal(int $empresaId): int
    {
        $sql = 'SELECT COUNT(*) FROM movimentacoes WHERE empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);

        return (int) $stmt->fetchColumn();
    }

    public static function buscarPorProduto(int $produtoId, int $empresaId, int $limit = 20): array
    {
        $sql = 'SELECT m.*, p.nome AS produto_nome
                FROM movimentacoes m
                JOIN produtos p ON m.produto_id = p.id
                WHERE m.produto_id = :produto_id AND m.empresa_id = :empresa_id
                ORDER BY m.data_hora DESC
                LIMIT :limit';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->bindValue(':produto_id', $produtoId, \PDO::PARAM_INT);
        $stmt->bindValue(':empresa_id', $empresaId, \PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function deletar(int $id, int $empresaId): bool
    {
        $sql = 'DELETE FROM movimentacoes WHERE id = :id AND empresa_id = :empresa_id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        return $stmt->execute([':id' => $id, ':empresa_id' => $empresaId]);
    }

    private static function normalizeMotivo(string $motivo, string $tipo): string
    {
        $value = strtolower(trim($motivo));
        $map = [
            'reestoque' => 'reestoque',
            'devolução' => 'devolucao',
            'devolucao' => 'devolucao',
            'ajuste' => 'ajuste',
            'outros' => 'outros',
            'venda' => 'venda',
            'perda' => 'perda',
            'vencimento' => 'vencimento',
            'perda de produto' => 'perda',
        ];

        if (isset($map[$value])) {
            return $map[$value];
        }

        $allowedEntrada = ['reestoque', 'devolucao', 'ajuste', 'outros'];
        $allowedSaida = ['venda', 'perda', 'vencimento', 'ajuste', 'outros'];

        if ($tipo === 'entrada' && in_array($value, $allowedEntrada, true)) {
            return $value;
        }

        if ($tipo === 'saida' && in_array($value, $allowedSaida, true)) {
            return $value;
        }

        return $tipo === 'entrada' ? 'reestoque' : 'venda';
    }
}
