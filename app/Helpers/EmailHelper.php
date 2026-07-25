<?php

namespace App\Helpers;

/**
 * EmailHelper - Helper centralizado para normalização de emails
 *
 * Centraliza a normalização de emails, eliminando código duplicado.
 */
class EmailHelper
{
    /**
     * Normaliza um email: trim + strtolower
     *
     * @param string $email Email a normalizar
     * @return string Email normalizado
     */
    public static function normalize(string $email): string
    {
        return strtolower(trim($email));
    }

    /**
     * Valida formato de email
     *
     * @param string $email Email a validar
     * @return bool
     */
    public static function isValid(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Normaliza e valida. Se inválido, retorna erro JSON 400.
     *
     * @param string $email Email a validar
     * @return string Email normalizado
     */
    public static function validate(string $email): string
    {
        $normalized = self::normalize($email);

        if (!self::isValid($normalized)) {
            ApiResponse::error('Email inválido', 400);
        }

        return $normalized;
    }
}
