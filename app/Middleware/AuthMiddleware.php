<?php

namespace App\Middleware;

use App\Auth\AuthManager;

/**
 * AuthMiddleware - Middleware de autenticação
 * 
 * Verifica se há um usuário autenticado.
 * Se não, retorna erro 401.
 */
class AuthMiddleware
{
    /**
     * Verifica autenticação
     * 
     * @return void
     */
    public static function handle(): void
    {
        // Em modo local, autenticação não é exigida
        if (defined('LOCAL_MODE') && LOCAL_MODE) {
            return;
        }

        if (!AuthManager::isAuthenticated()) {
            jsonResponse([
                'error' => true,
                'message' => 'Não autenticado',
                'code' => 'UNAUTHORIZED'
            ], 401);
        }
    }
}
