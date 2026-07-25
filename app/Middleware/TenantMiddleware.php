<?php

namespace App\Middleware;

use App\Core\Database;
use RuntimeException;

class TenantMiddleware
{
    public static function bootstrap(?int $empresaId = null): void
    {
        if ($empresaId !== null) {
            Database::getInstance()->setTenantContext($empresaId);
            return;
        }

        if (!defined('CURRENT_COMPANY_ID')) {
            throw new RuntimeException('CURRENT_COMPANY_ID is not defined');
        }

        Database::getInstance()->setTenantContext((int) CURRENT_COMPANY_ID);
    }

    public static function getEmpresaId(): int
    {
        try {
            return Database::getInstance()->getTenantId();
        } catch (\RuntimeException $e) {
            // Fallback para constante local se não houver contexto
            if (defined('CURRENT_COMPANY_ID')) {
                return (int) CURRENT_COMPANY_ID;
            }
            return 1;
        }
    }

    public static function getUserId(): int
    {
        // Se estiver autenticado, usa AuthManager
        if (class_exists('App\Auth\AuthManager')) {
            $userId = \App\Auth\AuthManager::getCurrentUserId();
            if ($userId !== null) {
                return $userId;
            }
        }
        
        // Fallback para CURRENT_USER_ID ou 1
        return defined('CURRENT_USER_ID') ? (int) CURRENT_USER_ID : 1;
    }
}
