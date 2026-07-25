# API — StockWave

Todas as requisições passam por `api.php?endpoint={endpoint}` (ou
`api/{endpoint}` via `.htaccess`, quando aplicável). O `Content-Type` de
resposta é sempre `application/json; charset=utf-8`.

Exceto onde indicado, **todas as rotas exigem sessão autenticada**
(`AuthMiddleware`) — comportamento desativado quando `LOCAL_MODE=true` (ver
`docs/LOCAL_MODE.md`).

Requisições `POST/PUT/DELETE/PATCH` exigem o header `X-CSRF-Token`, obtido
antecipadamente em `?endpoint=auth&action=csrf-token`.

---

## `auth` — Autenticação

### `POST /api.php?endpoint=auth&action=login`
Público (exige **ausência** de sessão — `GuestMiddleware`).

**Body:**
```json
{ "email": "admin@stockwave.local", "password": "password", "remember_me": false }
```

**Sucesso (200):**
```json
{ "error": false, "message": "Login realizado com sucesso", "redirect": "/stockwave/public/" }
```

**Erros possíveis:**
- `400` credenciais em formato inválido
- `401` credenciais incorretas
- `403` usuário inativo ou e-mail não verificado
- `429` bloqueado por brute force (`LOGIN_ATTEMPT_LIMIT` tentativas em
  `LOGIN_ATTEMPT_WINDOW` segundos — ver `config/configuracoes.php`)

### `POST /api.php?endpoint=auth&action=logout`
Exige autenticação.

**Sucesso (200):** `{ "error": false, "message": "Logout realizado com sucesso", "redirect": "/login" }`

### `GET /api.php?endpoint=auth&action=me`
Exige autenticação. Retorna dados do usuário logado, roles e permissões.

```json
{
  "error": false,
  "data": {
    "id": 1, "nome": "Administrador", "email": "admin@stockwave.local",
    "empresa_id": 1, "roles": [ ... ], "permissions": [ ... ]
  }
}
```

### `POST /api.php?endpoint=auth&action=request-password-reset`
Público. Body: `{ "email": "..." }`. Sempre responde
`{ "error": false, "message": "Se o email existir, você receberá instruções" }`
(não revela se o e-mail existe).

### `POST /api.php?endpoint=auth&action=reset-password`
Público (com token). Body: `{ "token": "...", "password": "NovaSenha123" }`.

### `POST /api.php?endpoint=auth&action=change-password`
Exige autenticação. Body:
`{ "current_password": "...", "new_password": "..." }`.

### `GET /api.php?endpoint=auth&action=csrf-token`
Público. Retorna `{ "error": false, "token": "...", "input_name": "csrf_token" }`.

---

## `empresas` — Cadastro de empresas

### `POST /api.php?endpoint=empresas&action=register`
Público. Cria a empresa **e** o usuário administrador em uma única
transação, incluindo roles padrão (`admin/gerente/operador/leitura`) e
todas as permissões vinculadas ao role `admin`.

**Body:**
```json
{
  "nome": "Minha Empresa LTDA",
  "nome_fantasia": "Minha Empresa",
  "cnpj": "12345678000190",
  "email": "contato@minhaempresa.com",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Exemplo, 123",
  "admin_nome": "Nome do Admin",
  "admin_email": "admin@minhaempresa.com",
  "admin_senha": "SenhaForte123"
}
```

**Sucesso (201):**
```json
{
  "error": false,
  "message": "Empresa e administrador criados com sucesso!",
  "data": { "empresa_id": 2, "usuario_id": 5 }
}
```

**Erros:** `400` (campos obrigatórios/CNPJ/e-mail/senha inválidos),
`409` (CNPJ ou e-mail de admin já cadastrado).

### `POST /api.php?endpoint=empresas` (sem `action`)
Criação simples/legada, sem criar usuário admin (uso interno).

---

## `produtos`

Todas exigem autenticação + permissão (`produto.view`/`create`/`edit`/
`delete`).

### `GET /api.php?endpoint=produtos`
Lista todos os produtos ativos (não deletados) da empresa.

### `GET /api.php?endpoint=produtos&id={id}`
Busca um produto específico. `404` se não encontrado.

### `GET /api.php?endpoint=produtos&low_stock=1`
Lista produtos com `quantidade <= quantidade_minima`.

### `POST /api.php?endpoint=produtos`
CSRF obrigatório. **Body:**
```json
{
  "nome": "Produto X", "descricao": "...", "categoria_id": 1,
  "quantidade": 10, "quantidade_minima": 5, "preco": 19.9,
  "codigo_barras": "789..."
}
```
**Sucesso:** `{ "message": "Produto criado com sucesso", "id": 10 }`

### `PUT /api.php?endpoint=produtos&id={id}`
CSRF obrigatório. Mesmo body do POST (nome, descricao, categoria_id,
quantidade_minima, preco, codigo_barras). **Não altera `quantidade`** — isso
é feito via `movimentacoes`.

### `DELETE /api.php?endpoint=produtos&id={id}`
CSRF obrigatório. Soft delete (`deleted_at = NOW()`).

---

## `categorias`

Todas exigem autenticação + permissão (`categoria.view`/`create`/`edit`/
`delete`).

### `GET /api.php?endpoint=categorias`
### `GET /api.php?endpoint=categorias&id={id}`
### `POST /api.php?endpoint=categorias`
Body: `{ "nome": "...", "descricao": "..." }`
### `PUT /api.php?endpoint=categorias&id={id}`
### `DELETE /api.php?endpoint=categorias&id={id}`
Bloqueado (`400`) se houver produtos vinculados
(`CategoriaModel::contarProdutos`).

---

## `movimentacoes`

Todas exigem autenticação + permissão (`movimentacao.view`/`create`/
`delete`).

### `GET /api.php?endpoint=movimentacoes&page={p}&limit={l}`
Lista paginada (`page` 1–100, `limit` 1–100, default 50).
```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 50, "total": 120, "pages": 3 }
}
```

### `GET /api.php?endpoint=movimentacoes&id={id}`
### `GET /api.php?endpoint=movimentacoes&produto_id={id}`
Últimas movimentações de um produto (`limit` opcional, default 20).

### `POST /api.php?endpoint=movimentacoes&type=entrada`
### `POST /api.php?endpoint=movimentacoes&type=saida`
`type` é obrigatório e deve ser `entrada` ou `saida` (400 caso contrário).
CSRF obrigatório. **Body:**
```json
{
  "produto_id": 4, "quantidade": 5, "motivo": "reestoque",
  "observacoes": "Compra mensal", "data_hora": "2025-01-01 10:00:00"
}
```
`saida` valida estoque suficiente (retorna `400` "Erro ao registrar saída ou
estoque insuficiente" caso contrário).

### `DELETE /api.php?endpoint=movimentacoes&id={id}`
CSRF obrigatório. **Atenção:** remove o registro de movimentação, mas **não
reverte** a quantidade do produto (comportamento do `MovimentacaoModel::deletar`
atual — ver pendência em `docs/GUIA_PARA_NOVOS_DEVS.md`).

---

## `usuarios`

Todas exigem autenticação + permissão (`usuario.view`/`create`/`edit`/
`delete`/`role`).

### `GET /api.php?endpoint=usuarios`
Lista usuários da empresa (sem senha).

### `GET /api.php?endpoint=usuarios&id={id}`
Detalhe de um usuário, incluindo `roles` e `permissions`.

### `POST /api.php?endpoint=usuarios`
Body: `{ "nome": "...", "email": "...", "senha": "...", "role_id": 2 }`.
Valida força de senha (`PasswordManager::validateStrength`).

### `PUT /api.php?endpoint=usuarios&id={id}`
Body parcial (`nome`, `email`, `senha`, `role_ids: [...]`).

### `DELETE /api.php?endpoint=usuarios&id={id}`
Não permite que o usuário delete a si mesmo (`400`).

---

## Formato padrão de erro

A maioria dos endpoints segue o padrão:
```json
{ "error": true, "message": "Descrição do erro" }
```
com o `http_response_code` correspondente (`400`, `401`, `403`, `404`,
`405`, `409`, `429`).
