<?php

use App\Controllers\AuthController;
use App\Middleware\AuthMiddleware;
use App\Middleware\GuestMiddleware;

// Login (público)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    GuestMiddleware::handle();
    (new AuthController())->login();
    exit;
}

// Logout (requer auth)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    AuthMiddleware::handle();
    (new AuthController())->logout();
    exit;
}

// Me (requer auth)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'me') {
    AuthMiddleware::handle();
    (new AuthController())->me();
    exit;
}

// Request password reset (público)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'request-password-reset') {
    GuestMiddleware::handle();
    (new AuthController())->requestPasswordReset();
    exit;
}

// Reset password (público com token)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'reset-password') {
    (new AuthController())->resetPassword();
    exit;
}

// Change password (requer auth)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'change-password') {
    AuthMiddleware::handle();
    (new AuthController())->changePassword();
    exit;
}

// Get CSRF token (público)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'csrf-token') {
    (new AuthController())->getCsrfToken();
    exit;
}

// Rota não encontrada
jsonResponse([
    'error' => true,
    'message' => 'Ação não encontrada',
    'available_actions' => ['login', 'logout', 'me', 'request-password-reset', 'reset-password', 'change-password', 'csrf-token']
], 404);
