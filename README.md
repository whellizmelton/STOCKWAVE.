# StockWave - Sistema de Gerenciamento de Estoque v2.0.0

Sistema multi-tenant de gerenciamento de estoque com backend PHP e frontend JavaScript vanilla.

## 📋 Pré-requisitos

- XAMPP (Apache + MySQL + PHP)
- PHP 8.0 ou superior
- MySQL 5.7 ou superior
- Navegador moderno (Chrome, Firefox, Edge)

## Inicialização do Projeto

### 1. Configurar o Banco de Dados

#### Opção A: Via phpMyAdmin
1. Acesse `http://localhost/phpmyadmin`
2. Clique na aba "Importar"
3. Selecione o arquivo `full_setup.sql`
4. Clique em "Executar"

#### Opção B: Via linha de comando (MySQL)
```bash
# No Windows, via prompt do XAMPP:
cd C:\xampp\mysql\bin
mysql -u root -p < c:\xampp\htdocs\stockwave\full_setup.sql
```

### 2. Verificar Configurações

Edite o arquivo `config/configuracoes.php` se necessário:
```php
define("DB_HOST","localhost");
define("DB_USER","root");
define("DB_PASSWORD","");  // Altere se tiver senha
define("DB_NAME","stockwave");
```

### 3. Instalar Dependências PHP

O projeto usa Firebase JWT via Composer. Execute no terminal:
```bash
cd c:\xampp\htdocs\stockwave
composer install
```

Se não tiver Composer:
```bash
# Baixe o Composer
# Ou use o instalador: https://getcomposer.org/download/
```

### 4. Configurar Apache

O `.htaccess` já está configurado. Verifique se:
- O módulo `mod_rewrite` está habilitado no Apache
- O `AllowOverride` está configurado como `All` no httpd.conf

### 5. Acessar o Sistema

Abra o navegador:
```
http://localhost/stockwave/public/
```

## Criar uma Nova Empresa

### Via Interface (Recomendado)

1. Acesse `http://localhost/stockwave/public/login.html`
2. Clique em "Criar nova empresa"
3. Preencha os dados:
   - **Nome da Empresa**: Razão social
   - **Nome Fantasia**: Nome comercial
   - **CNPJ**: 14 dígitos numéricos
   - **Email**: E-mail de contato
   - **Telefone**: (opcional)
   - **Endereço**: (opcional)
4. Clique em "Registrar"

O sistema criará automaticamente:
- A empresa no banco de dados
- Um usuário administrador com credenciais padrão

### Credenciais Padrão da Nova Empresa

Após criar a empresa, você receberá:
- **Email do Admin**: `admin@nomedaempresa.com`
- **Senha Padrão**: `Admin@123`

**⚠️ IMPORTANTE:** Altere a senha no primeiro login!

### Via API (Programático)

```bash
curl -X POST "http://localhost/stockwave/api.php?endpoint=empresas&action=register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Minha Empresa LTDA",
    "nome_fantasia": "Minha Empresa",
    "cnpj": "12345678000190",
    "email": "contato@minhaempresa.com",
    "telefone": "(11) 99999-9999",
    "endereco": "Rua Exemplo, 123",
    "admin_nome": "Nome do Admin",
    "admin_email": "admin@minhaempresa.com",
    "admin_senha": "SenhaForte123"
  }'
```

## Login no Sistema

1. Acesse `http://localhost/stockwave/public/login.html`
2. Entre com as credenciais:
   - Email do admin da empresa
   - Senha
3. O sistema gerará um token JWT e redirecionará para o dashboard

## Estrutura do Projeto

```
stockwave/
├── app/                    # Nova arquitetura (PSR-4)
│   ├── Controllers/        # Controllers modernos
│   ├── Core/              # Database singleton
│   └── Middleware/        # Auth & CSRF
├── config/                # Configurações
│   ├── configuracoes.php   # Configurações gerais
│   └── database.php       # Conexão MySQL
├── controllers/           # Controllers legados
├── models/                # Models de dados
├── routes/                # Rotas da API
├── helpers/               # Helpers (JWT, Audit, etc.)
├── public/                # Frontend
│   ├── index.html         # Dashboard
│   ├── login.html         # Login
│   ├── produtos.html      # Produtos
│   ├── estoque.html       # Estoque
│   ├── historico.html     # Histórico
│   ├── configuracoes.html # Configurações
│   ├── script.js          # Lógica frontend
│   ├── apiClient.js       # Cliente HTTP
│   └── style.css          # Estilos
├── create_database.sql    # Schema do banco
└── index.php              # Entry point da API
```

## MIGRAÇÃO DE CONTROLLERS E INTEGRAÇÃO COM API

### Controllers Migrados
- ✅ Rotas atualizadas para usar `config/database.php` e `helpers/response.php`
- ✅ Criado `helpers/PasswordController.php` para hash de senhas
- ✅ Senha do usuário admin atualizada para funcionar com password_verify
- ✅ AuthController: Login usa controller legado, outros endpoints usam nova estrutura
- ✅ ProdutoController, MovimentacaoController, CategoriaController funcionais
- ✅ EmpresaController funcional

### Integração Frontend ↔ Backend
- ✅ Criado `public/apiClient.js` - Cliente HTTP com suporte a api.php direto
- ✅ Criado `public/appIntegration.js` - Camada de abstração entre localStorage e API
- ✅ Criado `public/api.php` - Router direto sem depender do .htaccess
- ✅ Criado `public/script-api-migration-guide.js` - Guia de migração
- ✅ apiClient.js atualizado para usar api.php (useDirectAPI = true)
- ✅ Todos os arquivos HTML incluem apiClient.js e appIntegration.js

### Banco de Dados
- ✅ Banco `stockwave` criado
- ✅ 9 tabelas criadas com sucesso
- ✅ Dados de exemplo inseridos
- ✅ Senha do usuário admin atualizada para funcionar

### Como Usar a Integração no script.js
1. Substituir chamadas de `localStorage.getItem()` por `await appIntegration.loadProducts()`
2. Substituir chamadas de `localStorage.setItem()` por `await appIntegration.saveProduct()`
3. Tornar funções assíncronas com `async/await`
4. Usar try/catch para tratar erros de API
5. Recarregar dados após operações de escrita

**Exemplo:**
```javascript
// Antes:
products = JSON.parse(localStorage.getItem('stockwave_products')) || [];

// Depois:
products = await appIntegration.loadProducts();
```

Veja `script-api-migration-guide.js` para exemplos completos de migração.

### Próximos Passos para Integração Completa
1. Modificar `script.js` para usar `appIntegration` em vez de localStorage
2. Testar todas as operações CRUD com a API
3. Remover dependência de localStorage após validação completa
4. Migrar completamente para controllers em `app/Controllers/`

### Credenciais de Acesso
- **Email:** admin@exemplo.com
- **Senha:** Admin@123
- **Empresa:** StockWave Demo (ID: 1)

## �🔧 Solução de Problemas

### Banco de dados não conecta
- Verifique se o MySQL está rodando no XAMPP
- Confirme as credenciais em `config/configuracoes.php`
- Teste a conexão via phpMyAdmin

### Erro 404 nas rotas da API
- Verifique se o `mod_rewrite` está habilitado no Apache
- Confirme se o `.htaccess` está sendo lido
- Verifique o `AllowOverride All` no httpd.conf

### Erro 500 no login
- Verifique os logs em `logs/debug.log` ou `logs/error.log`
- Confirme se a tabela `usuarios` existe
- Verifique se a dependência Firebase JWT foi instalada

### Frontend não carrega
- Verifique se o caminho no navegador está correto
- Confirme se os arquivos CSS/JS estão sendo carregados
- Verifique o console do navegador para erros

## Dados de Exemplo

O banco de dados já vem com dados de exemplo:
- **Empresa**: Empresa Exemplo LTDA
- **Usuário Admin**: admin@exemplo.com / Admin@123
- **Categorias**: Alimentos, Bebidas, Limpeza, Eletrônicos
- **Produtos**: 4 produtos de exemplo

## Segurança

- Tokens JWT com expiração de 1 hora
- Proteção CSRF em requisições de escrita
- Rate limiting no login (5 tentativas em 15 min)
- Isolamento multi-tenant obrigatório
- Auditoria completa de ações
- Soft delete em produtos
