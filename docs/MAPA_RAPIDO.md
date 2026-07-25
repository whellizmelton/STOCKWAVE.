# Mapa Rápido — "Quero alterar X"

| Quero alterar | Arquivo |
|---|---|
| Tela do dashboard | `public/index.html` + `public/script.js` (`StockWaveApp`) |
| Tela de produtos | `public/produtos.html` + `public/script.js` (`initProdutos`) |
| Tela de estoque (entrada/saída) | `public/estoque.html` + `public/script.js` (`initEstoque`) |
| Tela de histórico | `public/historico.html` + `public/script.js` (`initHistorico`) |
| Tela de configurações/tema | `public/configuracoes.html` + `public/script.js` (`initConfiguracoesPage`) |
| Tela de login | `public/auth/login.html` + `public/auth/auth.js` |
| Tela de cadastro de empresa | `public/auth/register.html` |
| Validação de produto (regra de negócio) | `App/Controllers/ProdutoController.php` |
| Query de produtos | `App/Models/ProdutoModel.php` |
| Validação de categoria | `App/Controllers/CategoriaController.php` |
| Query de categorias | `App/Models/CategoriaModel.php` |
| Regra de entrada/saída de estoque | `App/Models/MovimentacaoModel.php` |
| Normalização de "motivo" da movimentação | `App/Models/MovimentacaoModel.php::normalizeMotivo` |
| Permissões/roles de um usuário | `App/Models/RoleModel.php` |
| CRUD de usuários | `App/Controllers/UsuarioController.php` / `App/Models/UsuarioModel.php` |
| Regras de login/sessão | `App/Auth/AuthManager.php`, `App/Auth/SessionManager.php` |
| Força/hash de senha | `App/Auth/PasswordManager.php` |
| Token CSRF | `App/Auth/CsrfManager.php`, `App/Middleware/CsrfMiddleware.php` |
| Bloqueio por tentativas de login | `App/Models/LoginAttemptModel.php` |
| Contexto de empresa (tenant) | `App/Middleware/TenantMiddleware.php`, `App/Core/Database.php` |
| Registro de auditoria | `App/Helpers/AuditHelper.php` |
| Formato de resposta JSON | `helpers/response.php` (`jsonResponse`) / `App/Helpers/ApiResponse.php` |
| Validação de paginação | `App/Helpers/PaginationValidator.php` |
| Leitura/validação de JSON do body | `App/Helpers/JsonRequest.php` |
| Adicionar novo endpoint | `App/Http/ApiRouter.php` (mapa `ROUTES`) + novo arquivo em `routes/` |
| Config de banco/segurança | `config/configuracoes.php` |
| Modo local / dev sem login | `config/app.php` |
| Schema/dados do banco | `database/full_setup.sql` |
| Estilo geral / variáveis de tema | `public/css/themes.css` |
| Estilo do dashboard (cards) | `public/css/dashboard.css` |
| Estilo de tabelas/paginação | `public/css/tables.css` |
| Estilo de modais | `public/css/modals.css` |
| Estilo do histórico | `public/css/historico.css` |
| Header/footer/menu mobile | `public/css/layout.css` |
| Toasts (notificações) | `public/js/components/toast.js` *(módulo novo, não conectado)* ou `showToast()` dentro de `public/script.js` *(em uso)* |
| Abrir/fechar modal (novo módulo) | `public/js/components/modal.js` *(não conectado ainda)* |
| Cliente HTTP em uso pelas páginas | `public/apiClient.js` (`window.api`) |
| Abstração API ↔ formato de UI | `public/appIntegration.js` |
| Estado de sessão no frontend | `public/js/authIntegration.js` |
| Chamadas HTTP de autenticação | `public/js/authClient.js` |
| Novo service (módulo modular, não conectado) | `public/js/services/*.js` + registrar em `public/js/main.js` |
