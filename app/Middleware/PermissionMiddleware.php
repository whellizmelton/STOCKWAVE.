<?php

namespace App\Middleware;

use App\Auth\AuthManager;

/**
 * PermissionMiddleware - Middleware de permissões
 * 
 * Verifica se o usuário tem uma permissão específica.
 * Se não tiver, retorna erro 403.
 */
class PermissionMiddleware
{
    /**
     * Permissão requerida
     */
    private static ?string $requiredPermission = null;
    
    /**
     * Define a permissão requerida
     * 
     * @param string $permission Nome da permissão
     * @return void
     */
    public static function setRequiredPermission(string $permission): void
    {
        self::$requiredPermission = $permission;
    }
    
    /**
     * Verifica a permissão
     * 
     * @return void
     */
    public static function handle(): void
    {
        // Em modo local, permissões não são exigidas
        if (defined('LOCAL_MODE') && LOCAL_MODE) {
            return;
        }

        if (self::$requiredPermission === null) {
            return; // Sem restrição de permissão
        }
        
        if (!AuthManager::hasPermission(self::$requiredPermission)) {
            jsonResponse([
                'error' => true,
                'message' => 'Permissão insuficiente',
                'code' => 'INSUFFICIENT_PERMISSION',
                'required' => self::$requiredPermission
            ], 403);
        }
    }
    
    /**
     * Limpa a permissão requerida
     * 
     * @return void
     */
    public static function clear(): void
    {
        self::$requiredPermission = null;
    }
}
