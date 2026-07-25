# StockWave — Sistema de Gerenciamento de Estoque

## Visão geral

StockWave é um sistema **multi-tenant** (multi-empresa) de gerenciamento de
estoque, com backend em **PHP puro (PSR-4)** + **MySQL/PDO** e frontend em
**HTML/CSS/JavaScript vanilla**.

Cada empresa cadastrada (`empresas`) possui seus próprios usuários, produtos,
categorias e movimentações, isolados por `empresa_id`.

### Principais funcionalidades

- Cadastro de produtos e categorias
- Entrada e saída de estoque (movimentações), com atualização automática de quantidade
- Histórico de movimentações com filtros
- Dashboard com indicadores (produtos, valor total, itens em baixo estoque, categorias)
- Autenticação por sessão PHP, com proteção CSRF e bloqueio por tentativas de login (brute force)
- Sistema de roles/permissões (RBAC) por empresa
- Auditoria de ações (`audit_logs`)
- Registro público de nova empresa + usuário administrador
- Modo de desenvolvimento local (`LOCAL_MODE`) que dispensa autenticação

## Tecnologias utilizadas

| Camada       | Tecnologia                          |
|--------------|--------------------------------------|
| Backend      | PHP 8+, PDO, autoload PSR-4 manual   |
| Banco        | MySQL 5.7+                           |
| Frontend     | HTML5, CSS3, JavaScript (vanilla)    |
| Ícones/fonte | Font Awesome 6.4 (CDN), Google Fonts (Poppins) |
| Exportação   | SheetJS/xlsx (CDN)                   |

Não há framework de frontend (React/Vue) nem framework PHP (Laravel/Symfony):
a estrutura `App/*` é uma organização própria, inspirada em MVC.

## Requisitos

- PHP 8.0+
- MySQL 5.7+ (ou MariaDB compatível)
- Apache com `mod_rewrite` habilitado (XAMPP recomendado em ambiente local)
- Navegador moderno (Chrome, Firefox, Edge)

## Como rodar localmente

```bash
# 1. Clonar/copiar o projeto para o htdocs do XAMPP
cd C:\xampp\htdocs\stockwave

# 2. Criar o banco de dados
#    Opção A - phpMyAdmin: importe database/full_setup.sql
#    Opção B - linha de comando:
mysql -u root -p < database/full_setup.sql
```

Verifique/ajuste as credenciais do banco em `config/configuracoes.php`:

```php
define("DB_HOST","localhost");
define("DB_USER","root");
define("DB_PASSWORD","");
define("DB_NAME","stockwave");
```

Confirme o modo de execução em `config/app.php` (veja `docs/LOCAL_MODE.md`):

```php
define('LOCAL_MODE', true);
define('CURRENT_COMPANY_ID', 1);
define('CURRENT_USER_ID', 1);
```

Inicie o Apache/MySQL pelo XAMPP e acesse:

```
http://localhost/stockwave/public/
```

> ⚠️ As telas em `public/*.html` chamam `authIntegration.checkSession()` no
> carregamento e redirecionam para `public/auth/login.html` se não houver
> sessão — **mesmo com `LOCAL_MODE` ativo no backend**. Para testar sem
> login, é necessário autenticar-se ao menos uma vez pela tela de login,
> pois o backend em `LOCAL_MODE` aceita a requisição de login sem exigir
> verificação de e-mail (`SKIP_EMAIL_VERIFICATION`).

### Credenciais de acesso (dados de seed)

O script `database/full_setup.sql` cria a empresa "Empresa Exemplo LTDA"
(`StockWave Demo`, id `1`) com o usuário administrador:

- **E-mail:** `admin@stockwave.local`
- **Senha:** `password`

> Existe uma divergência entre o `README.md` original do projeto (que cita
> `admin@exemplo.com` / `Admin@123`) e o seed real em
> `database/full_setup.sql` (`admin@stockwave.local` / `password`). Use
> sempre o que está no `full_setup.sql`, que é a fonte da verdade do banco.

## Estrutura resumida do projeto

```
stockwave/
├── api.php                 # Entry point único da API (?endpoint=xxx)
├── bootstrap.php           # Autoload + sessão + contexto de tenant
├── .htaccess                # Rewrite para /api/{endpoint}
├── config/
│   ├── configuracoes.php    # Config de banco, segurança, app
│   └── app.php               # LOCAL_MODE e constantes de dev
├── app/                      # Código PSR-4 (App\...)
│   ├── Auth/
│   ├── Controllers/
│   ├── Core/
│   ├── Helpers/
│   ├── Http/
│   ├── Middleware/
│   └── Models/
├── routes/                   # Um arquivo de rotas por endpoint
├── helpers/response.php      # jsonResponse() legado, usado em todo o projeto
├── database/full_setup.sql   # Schema completo + dados de exemplo
├── public/                   # Frontend
│   ├── *.html                # Páginas (index, produtos, estoque, historico, configuracoes)
│   ├── auth/                 # login.html, register.html, auth.js
│   ├── style.css             # Agrega public/css/*.css
│   ├── apiClient.js          # Cliente HTTP usado pelas páginas atuais
│   ├── appIntegration.js     # Camada de abstração API/localStorage
│   ├── script.js             # Lógica das páginas (monolítico)
│   └── js/
│       ├── core/              # config.js, utils.js, api.js, events.js (módulo em migração)
│       ├── components/        # toast.js, modal.js
│       ├── services/          # produtoService.js, categoriaService.js, movimentacaoService.js
│       └── authClient.js / authIntegration.js
└── docs/                      # Esta documentação
```

Veja `docs/ESTRUTURA_DE_PASTAS.md` para o detalhamento pasta a pasta.

## Como acessar a API

Todas as chamadas passam por `public/api.php` (ou `api.php` na raiz) com o
parâmetro `endpoint`:

```
GET  /stockwave/api.php?endpoint=produtos
POST /stockwave/api.php?endpoint=produtos
GET  /stockwave/api.php?endpoint=movimentacoes&page=1&limit=50
POST /stockwave/api.php?endpoint=auth&action=login
```

Veja a lista completa em `docs/API.md`.

## Modo de desenvolvimento (LOCAL_MODE)

Em `config/app.php`, `LOCAL_MODE=true` faz o backend:

- Ignorar a exigência de autenticação (`AuthMiddleware`, `AuthManager::requireAuth`)
- Ignorar a exigência de permissões (`PermissionMiddleware`, `AuthManager::requirePermission`)
- Usar `CURRENT_COMPANY_ID` e `CURRENT_USER_ID` como contexto fixo de tenant/usuário

Veja o detalhamento completo, incluindo cuidados para produção, em
`docs/LOCAL_MODE.md`.

## Documentação completa

| Documento | Conteúdo |
|---|---|
| `docs/ARQUITETURA.md` | Fluxo de requisição, camadas, multi-tenant, autenticação |
| `docs/ESTRUTURA_DE_PASTAS.md` | O que existe em cada pasta |
| `docs/FRONTEND.md` | Módulos JS/CSS, como adicionar página/service |
| `docs/BACKEND.md` | Como criar rota/controller/model, helpers disponíveis |
| `docs/BANCO_DE_DADOS.md` | Tabelas, relacionamentos, índices, soft delete, auditoria |
| `docs/API.md` | Todos os endpoints documentados |
| `docs/LOCAL_MODE.md` | O que o LOCAL_MODE ativa/ignora |
| `docs/GUIA_PARA_NOVOS_DEVS.md` | Onboarding e "onde mexer" |
| `docs/MAPA_RAPIDO.md` | Tabela "quero alterar X → arquivo Y" |
