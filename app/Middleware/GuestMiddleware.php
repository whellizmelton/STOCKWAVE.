<?php

namespace App\Middleware;

use App\Auth\AuthManager;

/**
 * GuestMiddleware - Middleware para rotas públicas
 * 
 * Verifica se NÃO há um usuário autenticado.
 * Se houver, retorna erro 403 (já autenticado).
 */
class GuestMiddleware
{
    /**
     * Verifica que não está autenticado
     * 
     * @return void
     */
    public static function handle(): void
    {
        if (AuthManager::isAuthenticated()) {
            jsonResponse([
                'error' => true,
                'message' => 'Já autenticado',
                'code' => 'ALREADY_AUTHENTICATED'
            ], 403);
        }
    }
}
