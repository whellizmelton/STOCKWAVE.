<?php

namespace App\Controllers;

use App\Middleware\TenantMiddleware;
use App\Models\ProdutoModel;

class ProdutoController
{
    public function listarTodos(): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        jsonResponse(ProdutoModel::listarTodos($empresaId));
    }

    public function buscarPorId(int $id): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $produto = ProdutoModel::buscarPorId($id, $empresaId);

        if ($produto) {
            jsonResponse($produto);
        }

        jsonResponse(['message' => 'Produto nao encontrado'], 404);
    }

    public function buscarBaixoEstoque(): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        jsonResponse(ProdutoModel::buscarBaixoEstoque($empresaId));
    }

    public function criar(array $data): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $userId = TenantMiddleware::getUserId();
        $data['empresa_id'] = $empresaId;

        $id = ProdutoModel::criar($data, $userId);
        if ($id) {
            jsonResponse(['message' => 'Produto criado com sucesso', 'id' => $id]);
        }

        jsonResponse(['message' => 'Erro ao criar produto'], 400);
    }

    public function atualizar(int $id, array $data): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $userId = TenantMiddleware::getUserId();

        if (ProdutoModel::atualizar($id, $empresaId, $data, $userId)) {
            jsonResponse(['message' => 'Produto atualizado com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao atualizar produto'], 400);
    }

    public function deletar(int $id): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $userId = TenantMiddleware::getUserId();

        if (ProdutoModel::deletar($id, $empresaId, $userId)) {
            jsonResponse(['message' => 'Produto deletado com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao deletar produto'], 400);
    }
}
