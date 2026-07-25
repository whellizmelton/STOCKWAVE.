<?php

namespace App\Models;

use App\Core\Database;
use PDOException;

class EmpresaModel
{
    public static function buscarPorCnpj(string $cnpj): ?array
    {
        $sql = "SELECT * FROM empresas WHERE cnpj = :cnpj AND status = 'active'";
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':cnpj' => $cnpj]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public static function buscarPorId(int $id): ?array
    {
        $sql = "SELECT * FROM empresas WHERE id = :id AND status = 'active'";
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public static function criar(array $data): bool
    {
        $sql = 'INSERT INTO empresas (nome, nome_fantasia, cnpj, email, telefone, endereco)
                VALUES (:nome, :nome_fantasia, :cnpj, :email, :telefone, :endereco)';

        try {
            $stmt = Database::getInstance()->getConnection()->prepare($sql);
            return $stmt->execute([
                ':nome' => trim($data['nome']),
                ':nome_fantasia' => trim($data['nome_fantasia']),
                ':cnpj' => trim($data['cnpj']),
                ':email' => strtolower(trim($data['email'])),
                ':telefone' => trim($data['telefone'] ?? ''),
                ':endereco' => trim($data['endereco'] ?? ''),
            ]);
        } catch (PDOException $e) {
            error_log('Erro ao criar empresa: ' . $e->getMessage());
            return false;
        }
    }
}
