# Banco de Dados — StockWave

Fonte da verdade do schema: `database/full_setup.sql`. Esse script **apaga e
recria** o banco `stockwave` (`DROP DATABASE IF EXISTS stockwave;`), portanto
deve ser usado apenas em ambiente novo/de desenvolvimento.

## Tabelas principais

### `empresas` (tenants)
```
id, nome, nome_fantasia, cnpj (UNIQUE), email, telefone, endereco,
status ENUM('active','inactive','suspended'), created_at, updated_at
```
Todas as demais tabelas de domínio referenciam `empresas.id` via
`empresa_id`, com `ON DELETE CASCADE`.

### `usuarios`
```
id, empresa_id (FK), nome, email, senha (hash bcrypt), cargo
ENUM('admin','manager','operator'), status ENUM('active','inactive','blocked'),
email_verified, email_verified_at, last_login, last_login_ip,
login_attempts, blocked_until, password_changed_at, password_reset_token,
password_reset_expires_at, two_factor_enabled, two_factor_secret,
created_by (FK usuarios), updated_by (FK usuarios), created_at, updated_at
```
`UNIQUE KEY unique_email_empresa (email, empresa_id)` — o mesmo e-mail pode
existir em empresas diferentes, mas não duas vezes na mesma empresa.

### `categorias`
```
id, empresa_id (FK), nome, descricao, created_at, updated_at
```

### `produtos`
```
id, empresa_id (FK), categoria_id (FK categorias, ON DELETE SET NULL),
nome, descricao, quantidade DECIMAL(12,3), quantidade_minima DECIMAL(12,3),
preco DECIMAL(12,2), codigo_barras, status ENUM('active','inactive'),
created_at, updated_at, deleted_at
```
`deleted_at` implementa **soft delete** — toda leitura de produto filtra
`deleted_at IS NULL` (ver `ProdutoModel::listarTodos`/`buscarPorId`).

### `movimentacoes`
```
id, empresa_id (FK), produto_id (FK produtos, ON DELETE RESTRICT),
tipo ENUM('entrada','saida'),
quantidade DECIMAL(12,3),
motivo ENUM('reestoque','devolucao','ajuste','outros','venda','perda','vencimento'),
observacoes, usuario_id (FK usuarios, ON DELETE RESTRICT), data_hora
```
Cada movimentação **atualiza a quantidade do produto** dentro da mesma
transação (`MovimentacaoModel::registrarEntrada`/`registrarSaida`, com
`beginTransaction`/`commit`/`rollBack`). Saídas fazem `SELECT ... FOR UPDATE`
na linha do produto antes de validar estoque suficiente (proteção contra
concorrência).

`MovimentacaoModel::normalizeMotivo()` normaliza o texto do motivo vindo do
frontend (ex.: "Perda de produto" → `perda`) e restringe os valores
possíveis conforme o tipo (`entrada` aceita `reestoque/devolucao/ajuste/
outros`; `saida` aceita `venda/perda/vencimento/ajuste/outros`).

### `configuracoes`
```
id, empresa_id (FK), chave, valor, created_at, updated_at
UNIQUE KEY unique_config_empresa (chave, empresa_id)
```
Armazena preferências por empresa (ex.: `alerta_estoque_baixo`,
`limite_produtos_pagina`).

### `login_attempts`
```
id, email, ip_address, user_agent, attempt_time, success
```
Sem `empresa_id` — é global, usado por `LoginAttemptModel` para brute force
(`countFailedAttempts`, `isBlocked`, `getBlockTimeRemaining`,
`clearOldAttempts`).

### `audit_logs`
```
id, empresa_id (FK), usuario_id (FK usuarios, ON DELETE SET NULL), action,
table_name, record_id, old_values JSON, new_values JSON, ip_address,
user_agent, created_at
```
Alimentada por `App\Helpers\AuditHelper::log()` a partir dos Models/
Controllers em operações de criação, atualização, exclusão, login, logout e
troca/reset de senha.

## RBAC (Roles e Permissões)

```
roles              id, empresa_id (FK), nome, descricao, is_system, nivel
                   UNIQUE (empresa_id, nome)

permissions        id, nome (UNIQUE), descricao, modulo

usuario_roles      usuario_id (FK) × role_id (FK)   [N:N]
                   UNIQUE (usuario_id, role_id)

role_permissions   role_id (FK) × permission_id (FK)  [N:N]
                   UNIQUE (role_id, permission_id)
```

Roles padrão criadas por empresa (tanto no seed quanto no registro público
via `EmpresaController::register`): `admin` (nível 100, todas as
permissões), `gerente` (nível 50, módulos produtos/categorias/
movimentacoes/relatorios), `operador` (nível 10, permissões pontuais de
visualização + criação de movimentação), `leitura` (nível 0, apenas
permissões `*.view`).

Permissões cadastradas no seed cobrem os módulos: `produtos`, `categorias`,
`movimentacoes`, `relatorios`, `usuarios`, `configuracoes` (ex.:
`produto.view`, `produto.create`, `produto.edit`, `produto.delete`,
`usuario.role`, `configuracao.edit`, etc.).

## Relacionamentos (resumo)

```
empresas 1──N usuarios
empresas 1──N categorias
empresas 1──N produtos
empresas 1──N movimentacoes
empresas 1──N configuracoes
empresas 1──N roles
empresas 1──N audit_logs

categorias 1──N produtos          (categoria_id nullable, SET NULL on delete)
produtos   1──N movimentacoes     (RESTRICT on delete)
usuarios   1──N movimentacoes     (RESTRICT on delete)

usuarios N──N roles                (via usuario_roles)
roles     N──N permissions         (via role_permissions)
```

## Índices importantes

- `empresas`: `cnpj`, `status`, `created_at`
- `usuarios`: `empresa_id`, `email`, `status`, `password_reset_token`
- `produtos`: `empresa_id`, `categoria_id`, `deleted_at`, `status`,
  `codigo_barras`
- `movimentacoes`: `empresa_id`, `produto_id`, `usuario_id`, `data_hora`,
  `tipo`
- `audit_logs`: `empresa_id`, `usuario_id`, `action`, `created_at`
- `login_attempts`: `email`, `ip_address`, `attempt_time`

## Soft delete

Implementado **apenas em `produtos`** (`deleted_at`). Categorias e
movimentações são removidas com `DELETE` físico
(`CategoriaModel::deletar`, `MovimentacaoModel::deletar`). Ao excluir uma
categoria, `CategoriaController::deletar` primeiro verifica
`CategoriaModel::contarProdutos()` e bloqueia a exclusão se houver produtos
vinculados.

## Auditoria

Toda tabela de domínio relevante é auditada via `audit_logs` nas operações
de escrita (ver seção acima). Os valores antigos/novos são serializados em
JSON (`JSON_UNESCAPED_UNICODE`), permitindo reconstruir o histórico de
alterações por registro.

## Dados de seed (`full_setup.sql`)

- Empresa: **Empresa Exemplo LTDA** / "StockWave Demo" (`id = 1`,
  CNPJ `12.345.678/0001-90`)
- Usuário admin: `admin@stockwave.local` / senha `password` (hash bcrypt
  fixo no script)
- 4 categorias: Alimentos, Bebidas, Limpeza, Eletrônicos
- 4 produtos de exemplo (Arroz, Refrigerante, Detergente, Mouse USB)
- Roles `admin/gerente/operador/leitura` + todas as `permissions` com o
  devido mapeamento em `role_permissions`
