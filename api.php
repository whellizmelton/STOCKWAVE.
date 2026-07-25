<?php
// Entrada única da API — query string ?endpoint=produtos

require_once __DIR__ . '/bootstrap.php';

use App\Http\ApiRouter;

ApiRouter::dispatch($_GET['endpoint'] ?? null);
