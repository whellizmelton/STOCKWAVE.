# Arquitetura — StockWave

## Fluxo de uma requisição de API

```
Navegador
  → public/apiClient.js (StockWaveAPI)         [fetch para api.php?endpoint=...]
    → api.php                                   [entry point]
      → bootstrap.php                           [autoload, sessão, tenant]
        → App\Http\ApiRouter::dispatch()
          → routes/{endpoint}.php               [switch por REQUEST_METHOD]
            → Middleware (Auth/Permission/Csrf)
              → App\Controllers\*Controller
                → App\Models\*Model
                  → App\Core\Database (PDO)
                    → MySQL
              ← jsonResponse() (helpers/response.php)
```

### Passo a passo

1. **`api.php`** (raiz do projeto) é o ponto único de entrada:
   ```php
   require_once __DIR__ . '/bootstrap.php';
   ApiRouter::dispatch($_GET['endpoint'] ?? null);
   ```
2. **`bootstrap.php`** faz, nessa ordem:
   - `require` de `config/configuracoes.php` (constantes de banco/segurança) e
     `config/app.php` (constantes de modo local);
   - `require` de `helpers/response.php` (função global `jsonResponse`);
   - Registra o autoload PSR-4 manual para o namespace `App\` (mapeado para a
     pasta `App/`, com o mesmo case-sensitivity do sistema de arquivos);
   - Inicializa `Database::getInstance()` (conexão PDO única);
   - Inicia a sessão PHP (`SessionManager::start()`);
   - Se há sessão válida (`AuthManager::checkSession()`), define o contexto de
     tenant a partir da empresa da sessão (`TenantMiddleware::bootstrap($empresaId)`);
   - Caso contrário, tenta usar `CURRENT_COMPANY_ID` (modo local) como fallback.
3. **`App\Http\ApiRouter::dispatch()`**:
   - Envia headers CORS e `Content-Type: application/json`;
   - Resolve o nome do endpoint (via `?endpoint=` ou via path `/api/{endpoint}`);
   - Localiza o arquivo correspondente em `routes/` através do mapa
     `ApiRouter::ROUTES` (`produtos`, `movimentacoes`, `categorias`, `empresas`,
     `auth`, `usuarios`);
   - Faz `require` do arquivo de rota e encerra a execução (`exit`).
4. **Arquivos em `routes/`** fazem um `switch ($_SERVER['REQUEST_METHOD'])`,
   aplicam os middlewares necessários (`AuthMiddleware`, `PermissionMiddleware`,
   `CsrfMiddleware`) e chamam o método correspondente do Controller.
5. **Controllers** (`App\Controllers\*`) fazem a orquestração: leem
   parâmetros, delegam a regra de negócio e persistência para os **Models**, e
   respondem com `jsonResponse()`.
6. **Models** (`App\Models\*`) concentram todo o SQL (PDO com prepared
   statements) e chamam `AuditHelper::log()` quando a operação deve ser
   auditada.

## Camadas

### `App\Core`
- `Database`: Singleton de conexão PDO (`mysql:host=...;dbname=...;charset=utf8mb4`).
  Também guarda o **contexto de tenant atual** (`setTenantContext`,
  `getTenantId`, `getTenantContext`) e expõe helpers de transação
  (`beginTransaction`, `commit`, `rollBack`, `lastInsertId`).

### `App\Middleware`
- `AuthMiddleware`: garante que existe sessão autenticada (pulado se
  `LOCAL_MODE`).
- `GuestMiddleware`: garante que **não** existe sessão (usado no login).
- `PermissionMiddleware`: exige uma permissão específica, definida via
  `setRequiredPermission()` antes de `handle()` (pulado se `LOCAL_MODE`).
- `CsrfMiddleware`: valida o token CSRF em métodos que alteram dados (POST,
  PUT, DELETE, PATCH).
- `TenantMiddleware`: expõe `getEmpresaId()` e `getUserId()` para os
  Controllers, com fallback para `CURRENT_COMPANY_ID` / `CURRENT_USER_ID`
  quando não há contexto de sessão.

### `App\Controllers`
Um controller por recurso: `ProdutoController`, `CategoriaController`,
`MovimentacaoController`, `AuthController`, `EmpresaController`,
`UsuarioController`. Não acessam o banco diretamente — sempre delegam a um
Model.

### `App\Models`
Um model por tabela principal: `ProdutoModel`, `CategoriaModel`,
`MovimentacaoModel`, `UsuarioModel`, `RoleModel`, `EmpresaModel`,
`LoginAttemptModel`. Toda query usa `Database::getInstance()->getConnection()`
com prepared statements.

### `App\Helpers`
Utilitários reaproveitáveis entre Controllers/Models/Routes:
`JsonRequest`, `ApiResponse`, `AuditHelper`, `EmailHelper`,
`PaginationValidator`. Detalhado em `docs/BACKEND.md`.

### `App\Auth`
Toda a lógica de autenticação e segurança:
`SessionManager` (sessão PHP nativa, nome `STOCKWAVE_SESSION`),
`AuthManager` (orquestrador: login/logout, permissões, roles, usuário atual),
`CsrfManager` (geração/validação de token CSRF),
`PasswordManager` (hash bcrypt, validação de força),
`CredentialsValidator` (validação de formato de e-mail/senha).

### Frontend (`public/`)
Ver `docs/FRONTEND.md` para detalhes de `core/`, `services/`, `components/`.

## Sistema multi-tenant

Cada empresa é uma linha em `empresas`. Praticamente todas as tabelas de
domínio (`usuarios`, `categorias`, `produtos`, `movimentacoes`,
`configuracoes`, `roles`) têm uma coluna `empresa_id` com `FOREIGN KEY` para
`empresas(id)` e `ON DELETE CASCADE`.

O isolamento entre empresas acontece em duas camadas:

1. **Contexto de tenant** (`Database::setTenantContext`/`getTenantId`),
   definido em `bootstrap.php` a partir da sessão do usuário (produção) ou de
   `CURRENT_COMPANY_ID` (modo local).
2. **Filtro explícito por `empresa_id`** em toda query de Model, obtido via
   `TenantMiddleware::getEmpresaId()`.

`Database::setTenantContext()` também valida que a empresa existe e está
`status = 'active'` antes de aceitar o contexto — se não existir, lança
`RuntimeException` ("Tenant not found or inactive").

## Autenticação

Mesmo com `LOCAL_MODE` ativo no backend (que dispensa a exigência de
autenticação nas rotas), o fluxo completo de autenticação existe e funciona:

- **Login** (`AuthController::login`): valida credenciais
  (`CredentialsValidator`), verifica bloqueio por brute force
  (`LoginAttemptModel::isBlocked`), verifica senha (`PasswordManager::verify`),
  registra a tentativa (`LoginAttemptModel::register`) e cria a sessão
  (`SessionManager::create`, com suporte a "lembrar-me").
- **Sessão**: armazenada em sessão PHP nativa (não JWT), com nome customizado
  `STOCKWAVE_SESSION`, tempo de vida de 2h (normal) ou 7 dias (remember me).
- **CSRF**: qualquer requisição de escrita (`POST/PUT/DELETE/PATCH`) passa por
  `CsrfMiddleware`, que exige o header `X-CSRF-Token` (obtido previamente via
  `?endpoint=auth&action=csrf-token`).
- **RBAC**: usuários têm `roles` (N:N via `usuario_roles`), roles têm
  `permissions` (N:N via `role_permissions`). `AuthManager::hasPermission()` /
  `hasRole()` consultam essas tabelas.
- **Auditoria**: login, logout, troca de senha e reset de senha são
  registrados em `audit_logs` via `AuditHelper::log()`.

No frontend, `public/js/authIntegration.js` guarda o usuário retornado por
`?endpoint=auth&action=me` em `sessionStorage` e é usado pelas páginas HTML
para checar sessão e fazer logout — **independentemente** do `LOCAL_MODE` do
backend (ver `docs/LOCAL_MODE.md` para a divergência entre os dois).
