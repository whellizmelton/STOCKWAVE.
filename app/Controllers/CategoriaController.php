<?php

namespace App\Controllers;

use App\Middleware\TenantMiddleware;
use App\Models\CategoriaModel;

class CategoriaController
{
    public function listarTodas(): void
    {
        jsonResponse(CategoriaModel::listarTodas(TenantMiddleware::getEmpresaId()));
    }

    public function buscarPorId(int $id): void
    {
        $categoria = CategoriaModel::buscarPorId($id, TenantMiddleware::getEmpresaId());
        if ($categoria) {
            jsonResponse($categoria);
        }

        jsonResponse(['message' => 'Categoria não encontrada'], 404);
    }

    public function criar(array $data): void
    {
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
        }
        
        $data['empresa_id'] = TenantMiddleware::getEmpresaId();
        $id = CategoriaModel::criar($data, TenantMiddleware::getUserId());

        if ($id) {
            jsonResponse(['message' => 'Categoria criada com sucesso', 'id' => $id]);
        }

        jsonResponse(['message' => 'Erro ao criar categoria'], 400);
    }

    public function atualizar(int $id, array $data): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        if (CategoriaModel::atualizar($id, $empresaId, $data, TenantMiddleware::getUserId())) {
            jsonResponse(['message' => 'Categoria atualizada com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao atualizar categoria'], 400);
    }

    public function deletar(int $id): void
    {
        $empresaId = TenantMiddleware::getEmpresaId();
        $total = CategoriaModel::contarProdutos($id, $empresaId);

        if ($total > 0) {
            jsonResponse(['message' => 'Não é possível deletar categoria com produtos vinculados'], 400);
        }

        if (CategoriaModel::deletar($id, $empresaId, TenantMiddleware::getUserId())) {
            jsonResponse(['message' => 'Categoria deletada com sucesso']);
        }

        jsonResponse(['message' => 'Erro ao deletar categoria'], 400);
    }
}
