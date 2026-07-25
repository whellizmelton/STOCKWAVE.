# Estrutura de Pastas — StockWave

> Este documento cobre apenas as pastas/arquivos confirmados no projeto atual.
> A pasta `versaoOLD/` contém uma versão legada (Firebase/localStorage) e
> **não faz parte** da arquitetura atual — não é referenciada aqui como parte
> ativa do sistema.

## Raiz

```
api.php               → Entry point da API (?endpoint=xxx)
bootstrap.php         → Inicialização: autoload, config, sessão, tenant
.htaccess              → RewriteRule de /stockwave/api/{endpoint} para index.php
README.md              → Guia rápido original do projeto
```

## `config/`

```
config/configuracoes.php → Constantes de banco (DB_HOST, DB_USER, DB_PASSWORD,
                             DB_NAME), segurança (CSRF, sessão, rate limit),
                             timezone, charset, headers de segurança
config/app.php            → LOCAL_MODE, CURRENT_COMPANY_ID, CURRENT_USER_ID,
                             SKIP_EMAIL_VERIFICATION
```

## `app/` (namespace `App\`)

Responsabilidade de cada subpasta:

```
App/
  Auth/         → Regras de autenticação e segurança de conta
    CredentialsValidator.php   valida formato de e-mail/senha de login
    PasswordManager.php        hash bcrypt, validação de força de senha
    SessionManager.php         sessão PHP nativa (STOCKWAVE_SESSION)
    CsrfManager.php            geração/validação de token CSRF
    AuthManager.php            orquestrador: login/logout, permissões, roles

  Controllers/  → Orquestram as requisições HTTP (sem SQL direto)
    ProdutoController.php
    CategoriaController.php
    MovimentacaoController.php
    AuthController.php
    EmpresaController.php
    UsuarioController.php

  Core/         → Infraestrutura base
    Database.php   singleton PDO + contexto de tenant + transações

  Helpers/      → Utilitários reutilizáveis
    JsonRequest.php          leitura/validação do body JSON
    ApiResponse.php           formato padronizado de resposta (success/error)
    AuditHelper.php           grava em audit_logs
    EmailHelper.php           normalização/validação de e-mail
    PaginationValidator.php   valida page/limit vindos de $_GET

  Http/         → Roteamento HTTP
    ApiRouter.php   mapeia endpoint → arquivo em routes/

  Middleware/   → Validações e definição de contexto antes do Controller
    AuthMiddleware.php
    GuestMiddleware.php
    PermissionMiddleware.php
    CsrfMiddleware.php
    TenantMiddleware.php

  Models/       → Acesso ao banco (todo SQL fica aqui)
    ProdutoModel.php
    CategoriaModel.php
    MovimentacaoModel.php
    UsuarioModel.php
    RoleModel.php
    EmpresaModel.php
    LoginAttemptModel.php
```

## `routes/`

Um arquivo por recurso da API, cada um resolvendo o método HTTP e delegando
ao Controller correspondente:

```
routes/
  produtos.php        GET/POST/PUT/DELETE → ProdutoController
  movimentacoes.php   GET/POST/DELETE      → MovimentacaoController
  categorias.php      GET/POST/PUT/DELETE  → CategoriaController
  usuarios.php        GET/POST/PUT/DELETE  → UsuarioController
  auth.php            roteamento por ?action= (login, logout, me, ...)
  empresas.php        POST (?action=register ou criação simples)
```

## `helpers/`

```
helpers/response.php   função global jsonResponse($data, $status = 200)
                        usada em TODO o backend (Controllers, Middlewares,
                        rotas) para padronizar a saída JSON + status HTTP.
```

> Note que existem **dois conceitos de "resposta"**: a função global
> `jsonResponse()` (usada em quase tudo) e a classe `App\Helpers\ApiResponse`
> (usada apenas em alguns pontos, como `JsonRequest::getValidatedBody`). Ao
> criar código novo, prefira `jsonResponse()` por ser o padrão predominante,
> a menos que o Controller já use `ApiResponse`.

## `database/`

```
database/full_setup.sql   Schema completo (DROP + CREATE DATABASE stockwave)
                           + todas as tabelas + dados de exemplo (empresa,
                           usuário admin, roles, permissions, categorias,
                           produtos)
```

## `public/` — Frontend

```
public/
  index.html             Dashboard (StockWaveApp)
  produtos.html          Gerenciamento de produtos (initProdutos)
  estoque.html           Gerenciamento de estoque/movimentações (initEstoque)
  historico.html         Histórico de movimentações (initHistorico)
  configuracoes.html     Preferências de tema/dark mode (initConfiguracoes)

  style.css              Agrega (@import) os arquivos de public/css/*

  apiClient.js           class StockWaveAPI — cliente HTTP usado pelas
                         páginas HTML atuais (window.api)
  appIntegration.js      class StockWaveAppIntegration — abstrai
                         API vs. localStorage (window.appIntegration)
  script.js              Lógica de UI de todas as páginas (monolítico;
                         funções init* por página + objeto StockWaveApp)
  split.js               Script utilitário (Node) usado para dividir o
                         antigo style.css monolítico em public/css/*.css

  auth/
    login.html            Tela de login (form + botão Google — apenas UI)
    register.html         Cadastro público de nova empresa + admin
    auth.js               Lógica de submit do login (usa authIntegration)

  js/
    authClient.js          class AuthClient — chamadas HTTP de auth
                          (login, logout, me, csrf-token, reset de senha)
    authIntegration.js     class AuthIntegration — estado de sessão no
                          frontend (sessionStorage), usado pelas páginas
                          HTML para proteger rotas e fazer logout

    core/                 Módulo "novo" de frontend (ver observação abaixo)
      config.js            AppConfig (API_BASE, chaves de storage, enums)
      utils.js              Utils (formatação de data/moeda, debounce, etc.)
      api.js                 ApiClient (wrapper fetch simples sobre AppConfig)
      events.js              EventManager (fecha modais, destaca link ativo)

    components/
      toast.js               Toast (notificações)
      modal.js                Modal (abrir/fechar/toggle)

    services/
      produtoService.js       ProdutoService (usa ApiClient de core/api.js)
      categoriaService.js     CategoriaService
      movimentacaoService.js  MovimentacaoService

    main.js                  Entry point do módulo "novo": injeta via
                             document.write todos os scripts de core/,
                             components/ e services/, e chama
                             EventManager.init()

  css/
    themes.css              Variáveis de tema (cores, dark mode, temas de cor)
    legacy.css              Cópia integral do antigo style.css monolítico
                            (mantido para não perder regras durante a
                            modularização)
    layout.css              Header/footer/waves + heranças do legacy
    tables.css              Tabelas, status badges, paginação, busca
    modals.css               Modais (genérico e de categorias)
    dashboard.css            Cards do dashboard (parcialmente duplicado)
    historico.css            Seção de histórico (parcialmente duplicado)
    base.css                 Reset + variáveis alternativas (--primary,
                            --dark, etc.) — **não é importado por style.css**
                            e usa um esquema de variáveis diferente do resto
                            do projeto (ver observação em docs/FRONTEND.md)
    estoque.css / produtos.css / configuracoes.css
                             Importados por style.css; conteúdo específico
                            de cada página (não incluído nesta revisão de
                            documentação — apenas confirmada a existência
                            via @import em public/style.css)
```

> **Observação sobre duplicação de CSS**: `public/style.css` foi gerado a
> partir de um `style.css` único (via `public/split.js`), que foi copiado
> integralmente para `css/legacy.css` e também fatiado em arquivos por
> página. Isso significa que várias regras (ex.: `.dashboard-header`,
> `.stat-card`, `.modal-content`) aparecem tanto em `legacy.css` quanto no
> arquivo específico da página. Isso é intencional (para não perder nada
> durante a modularização), mas gera peso extra de CSS. Ao alterar um
> estilo, procure primeiro no arquivo específico da página
> (`dashboard.css`, `historico.css`, etc.) — se a mudança não tiver efeito,
> a regra provavelmente também existe em `legacy.css`.

## `logs/`

Referenciada em `config/configuracoes.php` (`logs/debug.log` quando
`APP_DEBUG` é verdadeiro, `logs/error.log` caso contrário). Pasta esperada
na raiz do projeto para gravação de logs de erro/depuração do PHP.

## `docs/`

Esta pasta de documentação.
