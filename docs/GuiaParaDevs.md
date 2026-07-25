# Guia para Novos Devs — StockWave

## Em 5 minutos

```bash
# 1. Clonar/copiar para o htdocs do XAMPP
cd C:\xampp\htdocs\stockwave

# 2. Criar o banco (via linha de comando ou phpMyAdmin)
mysql -u root -p < database/full_setup.sql

# 3. Conferir config/configuracoes.php (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME)
#    e config/app.php (LOCAL_MODE=true para dev)

# 4. Iniciar Apache + MySQL no XAMPP

# 5. Acessar
http://localhost/stockwave/public/auth/login.html
```

Login: `admin@stockwave.local` / `password` (dados de seed em
`database/full_setup.sql`).

Depois de logar uma vez, a sessão fica em `sessionStorage`
(`stockwave_session`) e você pode navegar pelas páginas normalmente.

## Onde mexer em cada funcionalidade

### Produtos

| Camada | Arquivo |
|---|---|
| Tela | `public/produtos.html` |
| Lógica de UI | `public/script.js` → função `initProdutos()` |
| Estilo | `public/css/produtos.css` (+ regras herdadas de `legacy.css`) |
| Cliente HTTP | `public/apiClient.js` → `getProdutos/createProduto/updateProduto/deleteProduto` |
| Abstração | `public/appIntegration.js` → `loadProducts/saveProduct/deleteProduct` |
| Rota da API | `routes/produtos.php` |
| Controller | `App/Controllers/ProdutoController.php` |
| Model / SQL | `App/Models/ProdutoModel.php` |
| Tabela | `produtos` (ver `docs/BANCO_DE_DADOS.md`) |

### Categorias

| Camada | Arquivo |
|---|---|
| Tela | Modal "Gerenciar Categorias" dentro de `public/index.html` |
| Lógica de UI | `public/script.js` → `openCategoryModal/addCategory/deleteCategory` (dentro de `StockWaveApp`) |
| Cliente HTTP | `public/apiClient.js` → `getCategorias/createCategoria/deleteCategoria` |
| Rota da API | `routes/categorias.php` |
| Controller | `App/Controllers/CategoriaController.php` |
| Model / SQL | `App/Models/CategoriaModel.php` |
| Tabela | `categorias` |

### Movimentações (Entrada/Saída de estoque)

| Camada | Arquivo |
|---|---|
| Tela | `public/estoque.html` (também acionável no dashboard `index.html`) |
| Lógica de UI | `public/script.js` → `initEstoque()`, `openMovementModal()`, `saveMovement()`, `registerQuickOut()` |
| Cliente HTTP | `public/apiClient.js` → `registrarEntrada/registrarSaida/getHistorico` |
| Rota da API | `routes/movimentacoes.php` |
| Controller | `App/Controllers/MovimentacaoController.php` |
| Model / SQL | `App/Models/MovimentacaoModel.php` (transação: registra + atualiza `produtos.quantidade`) |
| Tabela | `movimentacoes` |

### Histórico

| Camada | Arquivo |
|---|---|
| Tela | `public/historico.html` |
| Lógica de UI | `public/script.js` → `initHistorico()` |
| Cliente HTTP | `public/apiClient.js` → `getHistorico()` |
| Rota / Controller / Model | mesmos de Movimentações |

### Usuários (RBAC)

| Camada | Arquivo |
|---|---|
| Tela | Não há tela dedicada nas páginas HTML atuais — API pronta, UI pendente |
| Rota da API | `routes/usuarios.php` |
| Controller | `App/Controllers/UsuarioController.php` |
| Model / SQL | `App/Models/UsuarioModel.php` + `App/Models/RoleModel.php` |
| Tabelas | `usuarios`, `roles`, `permissions`, `usuario_roles`, `role_permissions` |

### Autenticação / Login

| Camada | Arquivo |
|---|---|
| Tela | `public/auth/login.html`, `public/auth/register.html` |
| Lógica de UI | `public/auth/auth.js` (login), `register.html` (cadastro de empresa, inline `<script>`) |
| Cliente HTTP | `public/js/authClient.js` |
| Estado de sessão no frontend | `public/js/authIntegration.js` |
| Rota da API | `routes/auth.php`, `routes/empresas.php` (registro) |
| Controller | `App/Controllers/AuthController.php`, `App/Controllers/EmpresaController.php` |
| Auth core | `App/Auth/*` (`AuthManager`, `SessionManager`, `CsrfManager`, `PasswordManager`) |

### Configurações (tema/dark mode)

| Camada | Arquivo |
|---|---|
| Tela | `public/configuracoes.html` |
| Lógica de UI | `public/script.js` → `initConfiguracoesPage()`, `applySavedTheme()` |
| Estilo | `public/css/configuracoes.css`, variáveis em `public/css/themes.css` |
| Persistência | `localStorage` (`darkModeEnabled`, `selectedTheme`) — **não** usa a API/tabela `configuracoes` |

## Fluxo completo: "Criar produto"

1. Usuário clica em **"Novo Produto"** em `index.html` ou `produtos.html`
   → `openAddProductModal()` (em `script.js`) abre o modal `#productModal`.
2. Usuário preenche o formulário e clica em **"Salvar"**
   → listener em `#saveProductBtn` chama `saveProduct(e)`.
3. `saveProduct()` monta o objeto `productData` (campos em inglês: `name`,
   `category`, `code`, `quantity`, `price`, `minStock`, `dailyConsumption`,
   `description`) e chama `appIntegration.saveProduct(productData)`.
4. `StockWaveAppIntegration.saveProduct()` traduz para o formato da API
   (`nome`, `categoria_id`, `quantidade`, `quantidade_minima`, `preco`,
   `codigo_barras`) e chama `window.api.createProduto(data)`.
5. `StockWaveAPI.createProduto()` faz `POST /stockwave/api.php?endpoint=produtos`,
   incluindo o header `X-CSRF-Token` (obtido via `getCsrfToken()`).
6. `api.php` → `bootstrap.php` → `ApiRouter::dispatch('produtos')` →
   `require routes/produtos.php`.
7. `routes/produtos.php`: `AuthMiddleware::handle()` (pulado se
   `LOCAL_MODE`) → `CsrfMiddleware::handle()` → `PermissionMiddleware`
   (`produto.create`) → decodifica o body → `ProdutoController::criar($data)`.
8. `ProdutoController::criar()` adiciona `empresa_id` (via
   `TenantMiddleware::getEmpresaId()`) e chama
   `ProdutoModel::criar($data, $usuarioId)`.
9. `ProdutoModel::criar()` executa o `INSERT INTO produtos (...)`, obtém o
   `lastInsertId()` e chama `AuditHelper::log()` (ação `CREATE`, tabela
   `produtos`).
10. Controller responde `jsonResponse(['message' => 'Produto criado com
    sucesso', 'id' => $id])`.
11. De volta no frontend, `saveProduct()` recarrega os dados
    (`loadData()`), atualiza a tabela (`renderProductsTable()`), fecha o
    modal e mostra um toast de sucesso.

## Pendências / inconsistências encontradas (para conhecimento da equipe)

- **Frontend duplo**: `public/js/core/`, `public/js/components/`,
  `public/js/services/` e `public/js/main.js` formam um segundo sistema de
  frontend que **não está conectado** a nenhuma página HTML atual (ver
  `docs/FRONTEND.md`).
- **CSS duplicado**: `public/css/legacy.css` contém cópia integral de um
  `style.css` antigo, com regras repetidas nos arquivos por página
  (`dashboard.css`, `historico.css`, etc.).
- **`public/css/base.css`** define variáveis de tema (`--primary`, `--dark`,
  `--gray`...) num esquema diferente do resto do projeto e **não é
  importado** por `public/style.css` — parece não estar em uso.
- **`DELETE /api.php?endpoint=movimentacoes&id=...`** remove o registro de
  movimentação mas **não reverte** a quantidade em `produtos` — atenção ao
  usar esse endpoint em ambientes onde a consistência de estoque importa.
- **Divergência LOCAL_MODE vs. frontend**: ver seção específica em
  `docs/LOCAL_MODE.md` — o backend dispensa autenticação em `LOCAL_MODE`,
  mas o frontend continua exigindo login via `authIntegration.checkSession()`.
- **`.htaccess`** reescreve `/stockwave/api/{endpoint}` para `index.php`,
  mas o entry point documentado e usado pelo frontend é `api.php`
  (`?endpoint=`). O arquivo `index.php` referenciado pelo `.htaccess` não
  fez parte do material analisado nesta documentação — confirme sua
  existência/comportamento antes de depender de URLs no formato
  `/api/{endpoint}`.
- Não há tela de frontend dedicada para gestão de **usuários/roles**,
  apesar da API (`routes/usuarios.php`) estar completa.
