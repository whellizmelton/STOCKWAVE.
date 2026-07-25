# Frontend — StockWave

## Duas camadas de frontend coexistindo

O projeto está em processo de modularização do frontend. Hoje existem **duas
estruturas em paralelo**:

1. **A que está de fato ligada nas páginas HTML** (`index.html`,
   `produtos.html`, `estoque.html`, `historico.html`, `configuracoes.html`):
   - `public/apiClient.js` (`window.api`, classe `StockWaveAPI`)
   - `public/appIntegration.js` (`window.appIntegration`, classe
     `StockWaveAppIntegration`)
   - `public/script.js` (toda a lógica de UI, funções `initProdutos()`,
     `initEstoque()`, `initHistorico()`, `initConfiguracoes()`, e o objeto
     `StockWaveApp` para o dashboard)
   - `public/js/authClient.js` + `public/js/authIntegration.js`

2. **Um módulo mais novo, ainda não referenciado nas páginas HTML**
   (`public/js/core/`, `public/js/components/`, `public/js/services/`,
   `public/js/main.js`). Este módulo define `AppConfig`, `Utils`,
   `ApiClient`, `EventManager`, `Toast`, `Modal`, `ProdutoService`,
   `CategoriaService`, `MovimentacaoService` — mas nenhuma página HTML atual
   inclui `<script src="js/main.js">`.

**Ao adicionar uma nova funcionalidade, decida explicitamente em qual das
duas camadas ela deve entrar** (ver seção "Como adicionar" abaixo). Misturar
as duas em uma mesma página exige cuidado, pois ambas definem conceitos
parecidos com nomes diferentes (`ApiClient` vs. `StockWaveAPI`).

## 1. Camada ativa (`script.js` + `apiClient.js` + `appIntegration.js`)

### `public/apiClient.js`
Classe `StockWaveAPI`, exposta como `window.api`. Todas as chamadas passam
por `api.php` com `baseURL = '/stockwave'`:

```js
window.api.getProdutos(params)
window.api.createProduto(data)
window.api.updateProduto(id, data)
window.api.deleteProduto(id)
window.api.getCategorias() / createCategoria(data) / deleteCategoria(id)
window.api.registrarEntrada(data) / registrarSaida(data)
window.api.getHistorico(params)
window.api.registerEmpresa(data)
```

Ela também gerencia o token CSRF automaticamente (`getCsrfToken()`) antes de
qualquer `POST/PUT/DELETE`.

### `public/appIntegration.js`
Classe `StockWaveAppIntegration`, exposta como `window.appIntegration`.
Converte o formato de dados da API (em português: `nome`, `quantidade`,
`preco`...) para o formato usado pela UI (em inglês: `name`, `quantity`,
`price`...) e vice-versa. Também contém um **fallback para `localStorage`**
caso a chamada de API falhe (`loadFromLocalStorage`/`saveToLocalStorage`),
usado apenas em caso de erro de rede.

Métodos principais: `loadProducts()`, `loadCategories()`, `loadHistory()`,
`saveProduct(product)`, `deleteProduct(id)`, `registerMovement(movement)`,
`createCategory(nome)`, `deleteCategory(nome)`.

### `public/script.js`
Arquivo único com toda a lógica de UI. Pontos de entrada por página:

| Página | Função chamada no `DOMContentLoaded` |
|---|---|
| `index.html` | `StockWaveApp.init()` |
| `produtos.html` | `initProdutos()` |
| `estoque.html` | `initEstoque()` |
| `historico.html` | `initHistorico()` |
| `configuracoes.html` | `initConfiguracoes()` |

Cada página, no seu próprio `<script>` inline, primeiro chama
`authIntegration.checkSession()`; se autenticado, chama a função `init*`
correspondente e liga o botão de logout.

### `public/js/authClient.js` / `public/js/authIntegration.js`
- `AuthClient` (`authClient`): chamadas HTTP cruas para
  `?endpoint=auth&action=...` (login, logout, me, csrf-token, reset de
  senha, troca de senha).
- `AuthIntegration` (`authIntegration`): guarda o usuário logado em
  `sessionStorage` (`stockwave_session`), expõe `hasPermission()`,
  `hasRole()`, `checkSession()`, `requireAuth()`, `logout()` (redireciona
  para `auth/login.html`).

## 2. Módulo modular (não ligado ainda)

```
public/js/core/config.js    → AppConfig (API_BASE='/stockwave/api.php',
                               chaves de localStorage, enums de status)
public/js/core/utils.js     → Utils (formatDateTime, formatDate,
                               formatCurrency, normalizeText, debounce,
                               uniqueId)
public/js/core/api.js       → ApiClient (wrapper fetch simples: get/post/
                               put/delete usando AppConfig.API_BASE)
public/js/core/events.js    → EventManager (fecha modal ao clicar fora/✕,
                               destaca link ativo no menu)
public/js/components/toast.js → Toast (show/success/error/warning/info,
                               busca #toast no DOM)
public/js/components/modal.js → Modal (open/close/closeAll/toggle por
                               seletor CSS)
public/js/services/produtoService.js       → ProdutoService (CRUD produtos)
public/js/services/categoriaService.js     → CategoriaService (CRUD categorias)
public/js/services/movimentacaoService.js  → MovimentacaoService (listar/
                               registrar entrada/saída/deletar)
public/js/main.js            → document.write de todos os scripts acima
                               + EventManager.init() no DOMContentLoaded
```

Para **ativar** esse módulo em uma página, seria necessário substituir os
`<script>` atuais por `<script src="js/main.js"></script>` e reescrever a
lógica da página usando `ProdutoService`/`CategoriaService`/
`MovimentacaoService` + `Toast` + `Modal` em vez de `script.js`.

## CSS

`public/style.css` importa, nesta ordem:

```css
@import url('css/themes.css');
@import url('css/legacy.css');
@import url('css/layout.css');
@import url('css/tables.css');
@import url('css/modals.css');
@import url('css/dashboard.css');
@import url('css/historico.css');
@import url('css/estoque.css');
@import url('css/produtos.css');
@import url('css/configuracoes.css');
```

Todas as variáveis de cor/tema (`--primary-blue`, `--background-color`,
`--dark-mode`, temas `theme-green`, `theme-purple`, etc.) são definidas em
`css/themes.css`. **Não use** `css/base.css` como referência de variáveis —
ele define um conjunto próprio (`--primary`, `--dark`, `--gray`...) que não é
importado por `style.css` e não é usado pelo restante do projeto.

## Dark mode e temas de cor

Controlados via classes no `<body>`:

- `body.dark-mode` — ativa o modo escuro (variáveis redefinidas em
  `themes.css`)
- `body.theme-green` / `theme-purple` / `theme-red` / `theme-pink` /
  `theme-yellow` / `theme-orange` / `theme-black` / `theme-gray` — trocam
  `--primary-blue`/`--primary-hover`/`--background-color`

A página `configuracoes.html` lê/grava essas preferências em `localStorage`
(`darkModeEnabled`, `selectedTheme`) através de `applySavedTheme()` e
`initConfiguracoesPage()` em `script.js`, chamadas por
`applyThemeOnLoad()` no `DOMContentLoaded` de **todas** as páginas.

## Como adicionar uma nova página

1. Copie a estrutura de header/footer de uma página existente (ex.:
   `produtos.html`), mantendo os `<link>` de `style.css` e Font Awesome.
2. Inclua, na ordem: `apiClient.js`, `appIntegration.js`,
   `js/authClient.js`, `js/authIntegration.js`, `script.js`.
3. No `<script>` inline final, replique o padrão de verificação de sessão
   (`authIntegration.checkSession()`) usado nas demais páginas.
4. Adicione a função `initSuaPagina()` em `script.js` e chame-a no bloco
   inline, análogo a `initProdutos`/`initEstoque`.
5. Crie o CSS específico em `public/css/suapagina.css` e adicione o
   `@import` correspondente em `public/style.css`.

## Como adicionar um novo service (módulo modular)

1. Crie `public/js/services/xyzService.js` seguindo o padrão de
   `produtoService.js` (objeto com métodos `async` que chamam `ApiClient`
   de `core/api.js`).
2. Registre o `document.write` do novo arquivo em `public/js/main.js`,
   dentro da seção "Services".
3. Lembre-se de que esse `ApiClient` é diferente do `apiClient.js` da raiz
   de `public/` — não misture os dois em uma mesma página sem necessidade.

## Como fazer chamadas para a API (camada ativa)

Prefira sempre passar por `window.appIntegration` (que já trata o
mapeamento de campos PT/EN e fallback de erro) em vez de chamar
`window.api` diretamente, a não ser que precise de um endpoint que
`appIntegration` ainda não expõe.
