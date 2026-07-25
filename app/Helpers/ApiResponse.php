<?php

namespace App\Helpers;

/**
 * ApiResponse - Helper centralizado para respostas JSON
 *
 * Centraliza o formato de resposta da API, garantindo consistência
 * e eliminando código duplicado.
 */
class ApiResponse
{
    /**
     * Retorna resposta de sucesso
     *
     * @param mixed $data Dados a retornar
     * @param string $message Mensagem de sucesso
     * @param int $code Código HTTP
     * @return void
     */
    public static function success($data = null, string $message = '', int $code = 200): void
    {
        $response = ['error' => false];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if ($message !== '') {
            $response['message'] = $message;
        }

        jsonResponse($response, $code);
    }

    /**
     * Retorna resposta de erro
     *
     * @param string $message Mensagem de erro
     * @param int $code Código HTTP
     * @return void
     */
    public static function error(string $message, int $code = 400): void
    {
        jsonResponse(['error' => true, 'message' => $message], $code);
    }

    /**
     * Retorna resposta de sucesso com dados e mensagem
     *
     * @param mixed $data Dados a retornar
     * @param string $message Mensagem
     * @param int $code Código HTTP
     * @return void
     */
    public static function ok($data, string $message, int $code = 200): void
    {
        jsonResponse(['error' => false, 'message' => $message, 'data' => $data], $code);
    }

    /**
     * Retorna resposta de não encontrado
     *
     * @param string $message Mensagem
     * @return void
     */
    public static function notFound(string $message = 'Não encontrado'): void
    {
        jsonResponse(['error' => true, 'message' => $message], 404);
    }
}
