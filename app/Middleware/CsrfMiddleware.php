<?php

namespace App\Middleware;

use App\Auth\CsrfManager;
use App\Helpers\ResponseHelper;

/**
 * CsrfMiddleware - Middleware de proteção CSRF
 * 
 * Valida tokens CSRF em requisições que modificam dados
 */
class CsrfMiddleware
{
    /**
     * Valida o token CSRF da requisição
     * 
     * @return void
     */
    public static function handle(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Apenas valida para métodos que modificam dados
        if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            return;
        }
        
        // Valida token CSRF
        if (!CsrfManager::validateRequest()) {
            if (class_exists('App\Helpers\ResponseHelper')) {
                ResponseHelper::json([
                    'error' => true,
                    'message' => 'CSRF token inválido ou ausente'
                ], 403);
            } else {
                jsonResponse([
                    'error' => true,
                    'message' => 'CSRF token inválido ou ausente'
                ], 403);
            }
        }
    }
    
    /**
     * Adiciona token CSRF ao cabeçalho da resposta
     * 
     * @return void
     */
    public static function addTokenToHeader(): void
    {
        $token = CsrfManager::getToken();
        header('X-CSRF-Token: ' . $token);
    }
}
