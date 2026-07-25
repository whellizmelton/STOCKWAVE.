# Backend — StockWave

## Como criar uma nova rota

1. Crie `routes/meurecurso.php`, seguindo o padrão de `routes/categorias.php`:
   ```php
   <?php

   use App\Controllers\MeuRecursoController;
   use App\Middleware\AuthMiddleware;
   use App\Middleware\PermissionMiddleware;
   use App\Middleware\CsrfMiddleware;

   AuthMiddleware::handle();

   $controller = new MeuRecursoController();
   $method = $_SERVER['REQUEST_METHOD'];

   switch ($method) {
       case 'GET':
           PermissionMiddleware::setRequiredPermission('meurecurso.view');
           PermissionMiddleware::handle();
           $controller->listarTodos();
           break;

       case 'POST':
           CsrfMiddleware::handle();
           PermissionMiddleware::setRequiredPermission('meurecurso.create');
           PermissionMiddleware::handle();

           $data = json_decode(file_get_contents('php://input'), true) ?? [];
           if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
               jsonResponse(['error' => true, 'message' => 'JSON inválido'], 400);
           }
           $controller->criar($data);
           break;

       default:
           jsonResponse(['message' => 'Método não permitido'], 405);
   }
   ```
2. Registre o endpoint em `App\Http\ApiRouter::ROUTES`:
   ```php
   private const ROUTES = [
       'produtos' => 'produtos.php',
       // ...
       'meurecurso' => 'meurecurso.php',
   ];
   ```
3. Se o recurso exigir permissões novas, adicione-as na tabela `permissions`
   (veja `docs/BANCO_DE_DADOS.md`) e associe-as às roles pertinentes.

> Dica: em vez de repetir manualmente o `json_decode` + validação em cada
> rota, prefira usar `App\Helpers\JsonRequest::getValidatedBody()` (ver
> abaixo), que já centraliza essa lógica.

## Como criar um novo Controller

Local: `App/Controllers/MeuRecursoController.php`, namespace
`App\Controllers`. Padrão observado em `CategoriaController` e
`ProdutoController`:

```php
<?php

namespace App\Controllers;

use App\Middleware\TenantMiddleware;
use App\Models\MeuRecursoModel;

class MeuRecursoController
{
    public function listarTodos(): void
    {
        jsonResponse(MeuRecursoModel::listarTodas(TenantMiddleware::getEmpresaId()));
    }

    public function criar(array $data): void
    {
        $data['empresa_id'] = TenantMiddleware::getEmpresaId();
        $id = MeuRecursoModel::criar($data, TenantMiddleware::getUserId());

        if ($id) {
            jsonResponse(['message' => 'Criado com sucesso', 'id' => $id]);
        }

        jsonResponse(['message' => 'Erro ao criar'], 400);
    }
}
```

Regras observadas em todos os Controllers existentes:

- Nunca executam SQL diretamente — sempre delegam ao Model.
- Sempre obtêm `empresa_id`/`usuario_id` via `TenantMiddleware`, nunca de
  `$_SESSION` diretamente.
- Sempre respondem via `jsonResponse()` (função global de
  `helpers/response.php`), que já faz `exit` depois de emitir o JSON.

## Como criar um novo Model

Local: `App/Models/MeuRecursoModel.php`, namespace `App\Models`. Padrão
observado em `CategoriaModel`:

```php
<?php

namespace App\Models;

use App\Core\Database;
use App\Helpers\AuditHelper;

class MeuRecursoModel
{
    public static function listarTodas(int $empresaId): array
    {
        $sql = 'SELECT * FROM meu_recurso WHERE empresa_id = :empresa_id ORDER BY id';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $stmt->execute([':empresa_id' => $empresaId]);
        return $stmt->fetchAll();
    }

    public static function criar(array $data, int $usuarioId): int|false
    {
        $sql = 'INSERT INTO meu_recurso (empresa_id, nome) VALUES (:empresa_id, :nome)';
        $stmt = Database::getInstance()->getConnection()->prepare($sql);
        $ok = $stmt->execute([
            ':empresa_id' => $data['empresa_id'],
            ':nome' => trim($data['nome']),
        ]);

        if (!$ok) {
            return false;
        }

        $id = (int) Database::getInstance()->lastInsertId();
        AuditHelper::log($data['empresa_id'], $usuarioId, 'CREATE', 'meu_recurso', $id, null, $data);

        return $id;
    }
}
```

Regras observadas em todos os Models existentes:

- Todo SQL usa **prepared statements** com parâmetros nomeados (`:campo`).
- Toda query de leitura/escrita filtra por `empresa_id` (multi-tenant).
- Operações de criação/atualização/exclusão chamam `AuditHelper::log()`.
- Métodos são `static` (não há instância de Model).

## Helpers disponíveis (`App\Helpers`)

### `JsonRequest`
```php
JsonRequest::getBody(): ?array          // lê php://input, retorna null se JSON inválido
JsonRequest::getValidatedBody(): array  // como acima, mas já responde 400 se inválido
JsonRequest::getBodyOrDefault(): array  // como getBody(), mas retorna [] em vez de null
```

### `ApiResponse`
```php
ApiResponse::success($data = null, string $message = '', int $code = 200)
ApiResponse::error(string $message, int $code = 400)
ApiResponse::ok($data, string $message, int $code = 200)
ApiResponse::notFound(string $message = 'Não encontrado')
```
Todos internamente chamam a função global `jsonResponse()`.

### `AuditHelper`
```php
AuditHelper::log(
    int $empresaId, ?int $usuarioId, string $action, string $tableName,
    ?int $recordId = null, ?array $oldValues = null, ?array $newValues = null
): bool
```
Grava em `audit_logs` (ação, tabela, registro, valores antigos/novos em
JSON, IP e user agent).

### `EmailHelper`
```php
EmailHelper::normalize(string $email): string   // trim + strtolower
EmailHelper::isValid(string $email): bool       // FILTER_VALIDATE_EMAIL
EmailHelper::validate(string $email): string    // normaliza; se inválido, responde 400
```

### `PaginationValidator`
```php
PaginationValidator::validatePage(?int $page): int   // limita entre 1 e 100
PaginationValidator::validateLimit(?int $limit): int  // limita entre 1 e 100 (default 50)
PaginationValidator::calculateOffset(int $page, int $limit): int
PaginationValidator::fromGet(): array  // ['page' => ..., 'limit' => ..., 'offset' => ...]
```

## Função global `jsonResponse()` (`helpers/response.php`)

```php
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
```

Usada em praticamente todo o backend. **Sempre encerra a execução** — não
escreva código após uma chamada a `jsonResponse()` esperando que ele rode.

## Middlewares disponíveis (`App\Middleware`)

| Middleware | Uso |
|---|---|
| `AuthMiddleware::handle()` | Exige sessão autenticada (401 se ausente). Pulado em `LOCAL_MODE`. |
| `GuestMiddleware::handle()` | Exige que **não** haja sessão (403 se já autenticado). Usado no login. |
| `PermissionMiddleware::setRequiredPermission($nome)` + `handle()` | Exige permissão específica (403 se ausente). Pulado em `LOCAL_MODE`. |
| `CsrfMiddleware::handle()` | Valida token CSRF em POST/PUT/DELETE/PATCH (403 se inválido). |
| `TenantMiddleware::getEmpresaId()` / `getUserId()` | Contexto de tenant/usuário atual para os Controllers. |

## Auth (`App\Auth`)

| Classe | Responsabilidade |
|---|---|
| `SessionManager` | Sessão PHP nativa (`STOCKWAVE_SESSION`), 2h (normal) / 7 dias (remember me) |
| `AuthManager` | Orquestra login/logout, `isAuthenticated()`, `hasPermission()`, `hasRole()`, `getCurrentUser()` |
| `CsrfManager` | Gera/valida token CSRF (1h de validade), integra com `CsrfMiddleware` |
| `PasswordManager` | `hash()`, `verify()`, `validateStrength()` (mín. 8 caracteres, maiúscula, minúscula, número) |
| `CredentialsValidator` | Valida formato de e-mail/senha antes de consultar o banco |
