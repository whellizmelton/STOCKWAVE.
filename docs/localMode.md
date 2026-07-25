# LOCAL_MODE — StockWave

## O que é

`LOCAL_MODE` é uma constante booleana definida em `config/app.php`:

```php
define('LOCAL_MODE', true);
define('CURRENT_COMPANY_ID', 1);
define('CURRENT_USER_ID', 1);
define('SKIP_EMAIL_VERIFICATION', true);
```

Ela existe para permitir **desenvolver e testar a API sem precisar logar a
cada requisição**, usando sempre a empresa `1` e o usuário `1` como
contexto fixo.

## Por que existe

O backend inteiro é multi-tenant e depende de saber qual `empresa_id` e
`usuario_id` usar em cada operação. Em produção, isso vem da sessão do
usuário autenticado. Em desenvolvimento, `LOCAL_MODE` evita ter que repetir
o fluxo de login em cada teste manual/curl, fixando esse contexto.

## O que ele ignora

Quando `LOCAL_MODE === true`:

- **`App\Middleware\AuthMiddleware::handle()`** retorna imediatamente, sem
  checar `AuthManager::isAuthenticated()` — ou seja, **nenhuma rota exige
  sessão**.
- **`App\Middleware\PermissionMiddleware::handle()`** retorna
  imediatamente, sem checar a permissão configurada — ou seja, **nenhuma
  rota exige permissão específica**.
- **`App\Auth\AuthManager::requireAuth()`** e
  **`App\Auth\AuthManager::requirePermission()`** também retornam
  imediatamente pelo mesmo motivo (usados internamente por
  `UsuarioController`).

`SKIP_EMAIL_VERIFICATION=true` faz `AuthController::login()` não exigir
`email_verified = true` para efetuar login.

## O que continua funcionando

- **CSRF** (`CsrfMiddleware`) continua sendo exigido em POST/PUT/DELETE/
  PATCH, independentemente de `LOCAL_MODE`. O frontend (`apiClient.js`)
  já busca o token automaticamente antes de cada escrita.
- **Login/logout/sessão** continuam funcionando normalmente — `LOCAL_MODE`
  não impede o fluxo de autenticação, apenas o torna **opcional** para
  acessar as demais rotas.
- **Brute force / rate limiting de login** (`LoginAttemptModel`) continua
  ativo.
- **`bootstrap.php`** ainda tenta usar o contexto da sessão real, se
  existir (`AuthManager::checkSession()`); só recorre a
  `CURRENT_COMPANY_ID` quando **não há** sessão válida.
- **`TenantMiddleware::getUserId()`** usa `AuthManager::getCurrentUserId()`
  quando disponível, e só cai para `CURRENT_USER_ID` como último recurso.

## ⚠️ Divergência conhecida entre frontend e backend

As páginas HTML (`index.html`, `produtos.html`, etc.) continuam chamando
`authIntegration.checkSession()` no carregamento e **redirecionam para
`auth/login.html` se não houver sessão**, mesmo com `LOCAL_MODE=true` no
backend. Ou seja:

- Via **API direta** (Postman/curl), `LOCAL_MODE` de fato dispensa login.
- Via **navegador/UI**, o login continua sendo exigido pelo frontend, que
  não tem conhecimento de `LOCAL_MODE` (essa constante só existe no PHP).

Isso é esperado no estado atual do projeto, mas deve ser levado em conta ao
testar: **é preciso logar ao menos uma vez pela tela de login** para
acessar as telas, mesmo em ambiente local.

## Como desligar (produção)

Em `config/app.php`:

```php
define('LOCAL_MODE', false);
define('SKIP_EMAIL_VERIFICATION', false);
```

Remova ou ignore `CURRENT_COMPANY_ID`/`CURRENT_USER_ID` — elas só são usadas
como fallback quando não há sessão, mas com `LOCAL_MODE=false` as rotas
protegidas voltarão a exigir `AuthMiddleware`/`PermissionMiddleware`
normalmente, então o fallback de tenant só se aplica a rotas
verdadeiramente públicas (`auth`, `empresas&action=register`).

## Cuidados para produção

- **Nunca** suba `LOCAL_MODE=true` em produção — isso desativa
  completamente autenticação e RBAC em toda a API.
- Revise `config/configuracoes.php`: `ENFORCE_HTTPS` deve ser `true`,
  `APP_DEBUG` deve resultar em `false` (depende do `HTTP_HOST` não estar em
  `['localhost', '127.0.0.1', 'stockwave.local']`).
- Confirme que `DB_PASSWORD` não está em branco.
- Gere senhas fortes para os usuários administradores (não reutilize a
  senha de seed `password`/`Admin@123`).
