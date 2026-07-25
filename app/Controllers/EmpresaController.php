<?php

namespace App\Controllers;

use App\Models\EmpresaModel;
use App\Auth\PasswordManager;
use App\Core\Database;
use PDOException;
use RuntimeException;

class EmpresaController
{
    /**
     * Cria uma nova empresa (utilizado internamente / admin)
     */
    public function criar(array $data): void
    {
        if (!is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'Dados inválidos'], 400);
        }

        if (empty($data['nome']) || empty($data['nome_fantasia']) || empty($data['cnpj']) || empty($data['email'])) {
            jsonResponse(['error' => true, 'message' => 'Preencha todos os campos obrigatorios'], 400);
        }

        $data['nome']          = trim($data['nome']);
        $data['nome_fantasia'] = trim($data['nome_fantasia']);
        $data['cnpj']          = trim($data['cnpj']);
        $data['email']         = trim($data['email']);
        $data['telefone']      = trim($data['telefone'] ?? '');
        $data['endereco']      = trim($data['endereco'] ?? '');

        if (EmpresaModel::buscarPorCnpj($data['cnpj'])) {
            jsonResponse(['error' => true, 'message' => 'CNPJ ja cadastrado'], 400);
        }

        if (EmpresaModel::criar($data)) {
            jsonResponse(['message' => 'Empresa criada com sucesso']);
        }

        jsonResponse(['error' => true, 'message' => 'Erro ao criar empresa'], 500);
    }

    /**
     * Registro público: cria empresa + usuário administrador em uma transação
     * Endpoint: POST /api.php?endpoint=empresas&action=register
     */
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }

        // Validação dos campos obrigatórios
        $required = ['nome', 'nome_fantasia', 'cnpj', 'email', 'admin_nome', 'admin_email', 'admin_senha'];
        foreach ($required as $field) {
            if (empty(trim($data[$field] ?? ''))) {
                jsonResponse(['error' => true, 'message' => "Campo obrigatório ausente: {$field}"], 400);
            }
        }

        // Sanitização
        $nome          = trim($data['nome']);
        $nomeFantasia  = trim($data['nome_fantasia']);
        $cnpj          = trim($data['cnpj']);
        $emailEmpresa  = strtolower(trim($data['email']));
        $telefone      = trim($data['telefone'] ?? '');
        $endereco      = trim($data['endereco'] ?? '');
        $adminNome     = trim($data['admin_nome']);
        $adminEmail    = strtolower(trim($data['admin_email']));
        $adminSenha    = $data['admin_senha'];

        // Validações específicas
        $cnpjDigits = preg_replace('/\D/', '', $cnpj);
        if (strlen($cnpjDigits) !== 14) {
            jsonResponse(['error' => true, 'message' => 'CNPJ inválido'], 400);
        }

        if (!filter_var($emailEmpresa, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => true, 'message' => 'Email da empresa inválido'], 400);
        }

        if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => true, 'message' => 'Email do administrador inválido'], 400);
        }

        if (strlen($adminSenha) < 8) {
            jsonResponse(['error' => true, 'message' => 'A senha deve ter pelo menos 8 caracteres'], 400);
        }

        // Verifica CNPJ duplicado
        if (EmpresaModel::buscarPorCnpj($cnpj)) {
            jsonResponse(['error' => true, 'message' => 'CNPJ já cadastrado no sistema'], 409);
        }

        // Verifica email de admin duplicado
        $db = Database::getInstance()->getConnection();
        $stmtCheck = $db->prepare('SELECT id FROM usuarios WHERE email = :email LIMIT 1');
        $stmtCheck->execute([':email' => $adminEmail]);
        if ($stmtCheck->fetch()) {
            jsonResponse(['error' => true, 'message' => 'Email do administrador já está em uso'], 409);
        }

        // Inicia transação
        $dbInstance = Database::getInstance();
        $dbInstance->beginTransaction();

        try {
            // 1. Cria a empresa
            $sqlEmpresa = 'INSERT INTO empresas (nome, nome_fantasia, cnpj, email, telefone, endereco, status)
                           VALUES (:nome, :nome_fantasia, :cnpj, :email, :telefone, :endereco, :status)';
            $stmtEmpresa = $db->prepare($sqlEmpresa);
            $stmtEmpresa->execute([
                ':nome'          => $nome,
                ':nome_fantasia' => $nomeFantasia,
                ':cnpj'          => $cnpj,
                ':email'         => $emailEmpresa,
                ':telefone'      => $telefone,
                ':endereco'      => $endereco,
                ':status'        => 'active',
            ]);
            $empresaId = (int) $dbInstance->lastInsertId();

            // 2. Cria o usuário administrador
            $senhaHash = PasswordManager::hash($adminSenha);
            $sqlUsuario = 'INSERT INTO usuarios (empresa_id, nome, email, senha, cargo, status, email_verified, created_by)
                           VALUES (:empresa_id, :nome, :email, :senha, :cargo, :status, :email_verified, :created_by)';
            $stmtUsuario = $db->prepare($sqlUsuario);
            $stmtUsuario->execute([
                ':empresa_id'     => $empresaId,
                ':nome'           => $adminNome,
                ':email'          => $adminEmail,
                ':senha'          => $senhaHash,
                ':cargo'          => 'admin',
                ':status'         => 'active',
                ':email_verified' => true,
                ':created_by'     => null,
            ]);
            $usuarioId = (int) $dbInstance->lastInsertId();

            // Atualiza created_by para o próprio usuário
            $db->prepare('UPDATE usuarios SET created_by = :created_by WHERE id = :id')
               ->execute([':created_by' => $usuarioId, ':id' => $usuarioId]);

            // 3. Cria role admin para a empresa
            $sqlRole = 'INSERT INTO roles (empresa_id, nome, descricao, is_system, nivel)
                        VALUES (:empresa_id, :nome, :descricao, :is_system, :nivel)';
            $rolesData = [
                ['admin',    'Administrador do sistema', true,  100],
                ['gerente',  'Gerente de estoque',       true,  50],
                ['operador', 'Operador de estoque',      true,  10],
                ['leitura',  'Acesso somente leitura',   true,  0],
            ];
            $stmtRole = $db->prepare($sqlRole);
            $adminRoleId = null;
            foreach ($rolesData as [$roleName, $roleDesc, $isSystem, $nivel]) {
                $stmtRole->execute([
                    ':empresa_id' => $empresaId,
                    ':nome'       => $roleName,
                    ':descricao'  => $roleDesc,
                    ':is_system'  => $isSystem ? 1 : 0,
                    ':nivel'      => $nivel,
                ]);
                if ($roleName === 'admin') {
                    $adminRoleId = (int) $dbInstance->lastInsertId();
                }
            }

            // 4. Atribui role admin ao usuário
            if ($adminRoleId) {
                $db->prepare('INSERT INTO usuario_roles (usuario_id, role_id, assigned_by) VALUES (:uid, :rid, :ab)')
                   ->execute([':uid' => $usuarioId, ':rid' => $adminRoleId, ':ab' => $usuarioId]);

                // 5. Atribui todas as permissões ao role admin
                $db->prepare('INSERT INTO role_permissions (role_id, permission_id)
                              SELECT :role_id, id FROM permissions')
                   ->execute([':role_id' => $adminRoleId]);
            }

            // 6. Cria configurações iniciais da empresa
            $sqlConfig = 'INSERT INTO configuracoes (empresa_id, chave, valor) VALUES (:eid, :chave, :valor)';
            $stmtConfig = $db->prepare($sqlConfig);
            foreach ([
                ['nome_empresa',           $nome],
                ['alerta_estoque_baixo',   'true'],
                ['limite_produtos_pagina',  '50'],
                ['mostrar_codigos_barras',  'true'],
            ] as [$chave, $valor]) {
                $stmtConfig->execute([':eid' => $empresaId, ':chave' => $chave, ':valor' => $valor]);
            }

            $dbInstance->commit();

            jsonResponse([
                'error'   => false,
                'message' => 'Empresa e administrador criados com sucesso!',
                'data'    => [
                    'empresa_id' => $empresaId,
                    'usuario_id' => $usuarioId,
                ]
            ], 201);

        } catch (PDOException | RuntimeException $e) {
            $dbInstance->rollBack();
            error_log('Erro ao registrar empresa: ' . $e->getMessage());
            jsonResponse(['error' => true, 'message' => 'Erro interno ao criar conta. Tente novamente.'], 500);
        }
    }
}
