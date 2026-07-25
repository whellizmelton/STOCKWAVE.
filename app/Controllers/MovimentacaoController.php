<?php

namespace App\Controllers;

use App\Middleware\TenantMiddleware;
use App\Models\MovimentacaoModel;

class MovimentacaoController
{
    public function listarTodas(): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $page = isset($_GET['page']) ? max(1, min(100, (int) $_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, (int) $_GET['limit'])) : 50;
        $offset = ($page - 1) * $limit;

        $movimentacoes = MovimentacaoModel::listarTodas($empresaId, $limit, $offset);
        $total = MovimentacaoModel::contarTotal($empresaId);

        jsonResponse([
            'data' => $movimentacoes,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $limit > 0 ? (int) ceil($total / $limit) : 0,
            ],
        ]);
    }

    public function buscarPorId(int $id): void
    {
        $mov = MovimentacaoModel::buscarPorId($id, TenantMiddleware::getEmpresaId());
        if ($mov) {
            jsonResponse($mov);
        }

        jsonResponse(['message' => 'Movimentação não encontrada'], 404);
    }

    public function buscarPorProduto(int $produtoId): void
    {
        $limit = isset($_GET['limit']) ? max(1, (int) $_GET['limit']) : 20;
        jsonResponse(MovimentacaoModel::buscarPorProduto($produtoId, TenantMiddleware::getEmpresaId(), $limit));
    }

    public function registrarEntrada(array $data): void
    {
        $data['empresa_id'] = TenantMiddleware::getEmpresaId();
        $data['data_hora'] = $data['data_hora'] ?? date('Y-m-d H:i:s');

        if (MovimentacaoModel::registrarEntrada($data, TenantMiddleware::getUserId())) {
            jsonResponse(['message' => 'Entrada registrada com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao registrar entrada'], 400);
    }

    public function registrarSaida(array $data): void
    {
        $data['empresa_id'] = TenantMiddleware::getEmpresaId();
        $data['data_hora'] = $data['data_hora'] ?? date('Y-m-d H:i:s');

        if (MovimentacaoModel::registrarSaida($data, TenantMiddleware::getUserId())) {
            jsonResponse(['message' => 'Saída registrada com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao registrar saída ou estoque insuficiente'], 400);
    }

    public function deletar(int $id): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $mov = MovimentacaoModel::buscarPorId($id, $empresaId);

        if (!$mov) {
        jsonResponse(['message' => 'Movimentação não encontrada'], 404);
        }

        if (MovimentacaoModel::deletar($id, $empresaId)) {
            jsonResponse(['message' => 'Movimentação deletada com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao deletar movimentação'], 400);
    }
}
