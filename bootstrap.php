<?php
// Ponto único de inicialização da API StockWave.

require_once __DIR__ . '/config/configuracoes.php';
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/response.php';

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/App/';

    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relative) . '.php';

    if (is_file($file)) {
        require_once $file;
    }
});

use App\Core\Database;
use App\Middleware\TenantMiddleware;
use App\Auth\SessionManager;
use App\Auth\AuthManager;

try {
    Database::getInstance();
    
    // Inicia sessão
    SessionManager::start();
    
    // Verifica autenticação e carrega contexto
    if (AuthManager::checkSession()) {
        // Usuário autenticado: usa empresa_id da sessão
        $empresaId = AuthManager::getCurrentTenantId();
        if ($empresaId) {
            try {
                TenantMiddleware::bootstrap($empresaId);
            } catch (Throwable $te) {
                // Empresa da sessão não encontrada — sessão inválida
                SessionManager::destroy();
            }
        }
    } else {
        // Usuário não autenticado: usa CURRENT_COMPANY_ID como fallback (modo local)
        if (defined('CURRENT_COMPANY_ID')) {
            try {
                TenantMiddleware::bootstrap((int) CURRENT_COMPANY_ID);
            } catch (Throwable $te) {
                // Empresa padrão não existe ainda — endpoints públicos ainda funcionam
            }
        }
    }
} catch (Throwable $e) {
    if (defined('APP_DEBUG') && APP_DEBUG) {
        jsonResponse([
            'error' => true,
            'message' => 'Bootstrap failed',
            'debug' => $e->getMessage(),
        ], 500);
    }

    jsonResponse([
        'error' => true,
        'message' => 'Internal server error',
    ], 500);
}
