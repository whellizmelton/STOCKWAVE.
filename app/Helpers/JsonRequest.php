<?php

namespace App\Helpers;

/**
 * JsonRequest - Helper centralizado para leitura e validação de JSON
 *
 * Centraliza a leitura do body da requisição e validação de JSON,
 * eliminando código duplicado em Controllers e Routes.
 */
class JsonRequest
{
    /**
     * Lê e decodifica o body da requisição como JSON
     *
     * @return array|null Dados decodificados ou null se inválido
     */
    public static function getBody(): ?array
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return null;
        }

        return $data;
    }

    /**
     * Lê o body e valida. Se inválido, retorna erro JSON 400.
     *
     * @return array Dados válidos
     */
    public static function getValidatedBody(): array
    {
        $data = self::getBody();

        if ($data === null) {
            ApiResponse::error('JSON inválido', 400);
        }

        return $data;
    }

    /**
     * Lê o body e valida. Se inválido, retorna erro JSON 400.
     * Usado em routes que já fazem ?? [] no getBody.
     *
     * @return array
     */
    public static function getBodyOrDefault(): array
    {
        return self::getBody() ?? [];
    }
}
