<?php

namespace App\Http;

class ApiRouter
{
    private const ROUTES = [
        'produtos' => 'produtos.php',
        'movimentacoes' => 'movimentacoes.php',
        'categorias' => 'categorias.php',
        'empresas' => 'empresas.php',
        'auth' => 'auth.php',
        'usuarios' => 'usuarios.php',
    ];

    public static function sendCorsHeaders(): void
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Content-Type: application/json; charset=UTF-8');
    }

    public static function resolveEndpoint(?string $explicit = null): ?string
    {
        if ($explicit !== null && $explicit !== '') {
            $explicit = urldecode($explicit);
            // Extrai apenas o endpoint antes de possíveis query params
            $explicit = explode('?', $explicit)[0];
            return $explicit !== '' ? $explicit : null;
        }

        $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
        $path = str_replace('\\', '/', $path);
        $path = preg_replace('#^/stockwave/#', '', $path);
        $path = preg_replace('#^api/#', '', $path);
        $path = trim($path, '/');

        if ($path === '' || $path === 'api.php' || $path === 'index.php') {
            return null;
        }

        $segment = explode('/', $path)[0];
        $segment = urldecode($segment);
        $segment = explode('?', $segment)[0];

        return $segment !== '' ? $segment : null;
    }

    public static function dispatch(?string $endpoint = null): void
    {
        self::sendCorsHeaders();

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $endpoint = self::resolveEndpoint($endpoint);

        if ($endpoint === null || !isset(self::ROUTES[$endpoint])) {
            jsonResponse([
                'error' => true,
                'message' => 'Endpoint not found',
                'available' => array_keys(self::ROUTES),
            ], 404);
        }

        $routeFile = __DIR__ . '/../../routes/' . self::ROUTES[$endpoint];

        if (!is_file($routeFile)) {
            jsonResponse([
                'error' => true,
                'message' => 'Route file not found',
            ], 500);
        }

        require $routeFile;
        exit;
    }
}
