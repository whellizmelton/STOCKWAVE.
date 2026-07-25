<?php

namespace App\Helpers;

/**
 * PaginationValidator - Helper centralizado para validação de paginação
 *
 * Centraliza a validação de parâmetros page e limit,
 * eliminando código duplicado e garantindo limites consistentes.
 */
class PaginationValidator
{
    const MIN_PAGE = 1;
    const MAX_PAGE = 100;
    const MIN_LIMIT = 1;
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 50;

    /**
     * Valida e retorna o número da página
     *
     * @param int|null $page
     * @return int
     */
    public static function validatePage(?int $page): int
    {
        if ($page === null) {
            return self::MIN_PAGE;
        }

        return max(self::MIN_PAGE, min(self::MAX_PAGE, $page));
    }

    /**
     * Valida e retorna o limite de itens por página
     *
     * @param int|null $limit
     * @return int
     */
    public static function validateLimit(?int $limit): int
    {
        if ($limit === null) {
            return self::DEFAULT_LIMIT;
        }

        return max(self::MIN_LIMIT, min(self::MAX_LIMIT, $limit));
    }

    /**
     * Calcula o offset para paginação
     *
     * @param int $page
     * @param int $limit
     * @return int
     */
    public static function calculateOffset(int $page, int $limit): int
    {
        return ($page - 1) * $limit;
    }

    /**
     * Valida page e limit a partir de $_GET e retorna [page, limit, offset]
     *
     * @return array{page: int, limit: int, offset: int}
     */
    public static function fromGet(): array
    {
        $page = self::validatePage(isset($_GET['page']) ? (int) $_GET['page'] : null);
        $limit = self::validateLimit(isset($_GET['limit']) ? (int) $_GET['limit'] : null);
        $offset = self::calculateOffset($page, $limit);

        return ['page' => $page, 'limit' => $limit, 'offset' => $offset];
    }
}
