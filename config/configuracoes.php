<?php

// Configurações do StockWave - Seguro para Produção

// Database Configuration
define("DB_HOST","localhost");
define("DB_USER","root");
define("DB_PASSWORD","");
define("DB_NAME","stockwave");


// Security Configuration
define("ENFORCE_HTTPS", false); // Setar true em produção
define("CSRF_TOKEN_EXPIRE", 3600); // 1 hora
define("SESSION_LIFETIME", 3600); // 1 hora
define("LOGIN_ATTEMPT_LIMIT", 5); // 5 tentativas
define("LOGIN_ATTEMPT_WINDOW", 900); // 15 minutos

// Application Configuration
define("APP_NAME", "StockWave");
define("APP_VERSION", "2.0.0");
define("APP_DEBUG", in_array($_SERVER['HTTP_HOST'] ?? 'localhost', ['localhost', '127.0.0.1', 'stockwave.local']));

// Rate Limiting Configuration
define("RATE_LIMIT_ENABLED", true);
define("RATE_LIMIT_REQUESTS", 100);
define("RATE_LIMIT_WINDOW", 3600); // 1 hora

// Email Configuration (para notificações)
define("EMAIL_FROM", "noreply@stockwave.com");
define("EMAIL_FROM_NAME", "StockWave System");

// File Upload Configuration
define("MAX_FILE_SIZE", 5 * 1024 * 1024); // 5MB
define("ALLOWED_FILE_TYPES", ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);

// Pagination Configuration
define("DEFAULT_PAGE_SIZE", 50);
define("MAX_PAGE_SIZE", 100);

// Cache Configuration
define("CACHE_ENABLED", false);
define("CACHE_TTL", 3600); // 1 hora

// API Configuration
define("API_VERSION", "v1");
define("API_RATE_LIMIT", 1000); // 1000 requests por hora por usuário

// Security Headers
if (!headers_sent()) {
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");
    
    if (ENFORCE_HTTPS) {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
    }
}

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/debug.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/error.log');
}

// Timezone
date_default_timezone_set('America/Sao_Paulo');

// Charset
mb_internal_encoding('UTF-8');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', ENFORCE_HTTPS);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_lifetime', SESSION_LIFETIME);

?>
