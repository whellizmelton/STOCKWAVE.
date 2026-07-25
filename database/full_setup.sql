-- ============================================
-- StockWave - Script Completo de Setup do Banco
-- Este script apaga e recria todo o banco de dados
-- ============================================

-- Apaga o banco existente (CUIDADO!)
DROP DATABASE IF EXISTS stockwave;

-- Cria o banco
CREATE DATABASE stockwave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stockwave;

-- ============================================
-- Tabelas Principais
-- ============================================

-- Tabela de Empresas (Tenants)
CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefone VARCHAR(25),
    endereco TEXT,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_empresas_cnpj (cnpj),
    INDEX idx_empresas_status (status),
    INDEX idx_empresas_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Usuários (com tenant_id e campos de autenticação)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cargo ENUM('admin', 'manager', 'operator') DEFAULT 'operator',
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(45) NULL,
    login_attempts INT DEFAULT 0,
    blocked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    password_reset_token VARCHAR(64) NULL,
    password_reset_expires_at TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_email_empresa (email, empresa_id),
    INDEX idx_usuarios_empresa (empresa_id),
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_status (status),
    INDEX idx_usuarios_password_reset (password_reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Categorias (com tenant_id)
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_categorias_empresa (empresa_id),
    INDEX idx_categorias_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Produtos (com tenant_id)
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    categoria_id INT,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    quantidade DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    quantidade_minima DECIMAL(12,3) NOT NULL DEFAULT 10.000,
    preco DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    codigo_barras VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_produtos_empresa (empresa_id),
    INDEX idx_produtos_categoria (categoria_id),
    INDEX idx_produtos_deleted_at (deleted_at),
    INDEX idx_produtos_status (status),
    INDEX idx_produtos_codigo_barras (codigo_barras)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Movimentações (com tenant_id)
CREATE TABLE movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    produto_id INT NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL,
    motivo ENUM('reestoque', 'devolucao', 'ajuste', 'outros', 'venda', 'perda', 'vencimento') NOT NULL,
    observacoes TEXT,
    usuario_id INT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_movimentacoes_empresa (empresa_id),
    INDEX idx_movimentacoes_produto (produto_id),
    INDEX idx_movimentacoes_usuario (usuario_id),
    INDEX idx_movimentacoes_data_hora (data_hora),
    INDEX idx_movimentacoes_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Configurações (por empresa)
CREATE TABLE configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_config_empresa (chave, empresa_id),
    INDEX idx_configuracoes_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tentativas de Login (para Rate Limiting)
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    
    INDEX idx_login_attempts_email (email),
    INDEX idx_login_attempts_ip (ip_address),
    INDEX idx_login_attempts_time (attempt_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Logs de Auditoria
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    usuario_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_empresa (empresa_id),
    INDEX idx_audit_logs_usuario (usuario_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabelas de Autenticação (Roles e Permissões)
-- ============================================

-- Tabela roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    nivel INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_roles_empresa_nome (empresa_id, nome),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_roles_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela permissions
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    modulo VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_permissions_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela usuario_roles (M:N)
CREATE TABLE usuario_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL,
    
    UNIQUE KEY uk_usuario_roles_usuario_role (usuario_id, role_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_usuario_roles_usuario (usuario_id),
    INDEX idx_usuario_roles_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela role_permissions (M:N)
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT NULL,
    
    UNIQUE KEY uk_role_permissions_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_role_permissions_role (role_id),
    INDEX idx_role_permissions_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Dados Iniciais
-- ============================================

-- Empresa de exemplo
INSERT INTO empresas (nome, nome_fantasia, cnpj, email, telefone, endereco) VALUES 
('Empresa Exemplo LTDA', 'StockWave Demo', '12.345.678/0001-90', 'contato@exemplo.com', '(11) 99999-9999', 'Rua Demo, 123 - Centro, São Paulo/SP');

-- Usuário admin da empresa (senha: password)
-- Hash bcrypt de "password" (cost 10)
INSERT INTO usuarios (empresa_id, nome, email, senha, cargo, status, email_verified) VALUES 
(1, 'Administrador', 'admin@stockwave.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', TRUE);

-- Roles do sistema
INSERT INTO roles (empresa_id, nome, descricao, is_system, nivel) VALUES
(1, 'admin', 'Administrador do sistema', TRUE, 100),
(1, 'gerente', 'Gerente de estoque', TRUE, 50),
(1, 'operador', 'Operador de estoque', TRUE, 10),
(1, 'leitura', 'Acesso somente leitura', TRUE, 0);

-- Permissões do sistema
INSERT INTO permissions (nome, descricao, modulo) VALUES
-- Produtos
('produto.view', 'Visualizar produtos', 'produtos'),
('produto.create', 'Criar produtos', 'produtos'),
('produto.edit', 'Editar produtos', 'produtos'),
('produto.delete', 'Deletar produtos', 'produtos'),
-- Categorias
('categoria.view', 'Visualizar categorias', 'categorias'),
('categoria.create', 'Criar categorias', 'categorias'),
('categoria.edit', 'Editar categorias', 'categorias'),
('categoria.delete', 'Deletar categorias', 'categorias'),
-- Movimentações
('movimentacao.view', 'Visualizar movimentações', 'movimentacoes'),
('movimentacao.create', 'Criar movimentações', 'movimentacoes'),
('movimentacao.delete', 'Deletar movimentações', 'movimentacoes'),
-- Relatórios
('relatorio.view', 'Visualizar relatórios', 'relatorios'),
('relatorio.export', 'Exportar relatórios', 'relatorios'),
-- Usuários
('usuario.view', 'Visualizar usuários', 'usuarios'),
('usuario.create', 'Criar usuários', 'usuarios'),
('usuario.edit', 'Editar usuários', 'usuarios'),
('usuario.delete', 'Deletar usuários', 'usuarios'),
('usuario.role', 'Gerenciar roles', 'usuarios'),
-- Configurações
('configuracao.view', 'Visualizar configurações', 'configuracoes'),
('configuracao.edit', 'Editar configurações', 'configuracoes');

-- Atribuir role admin ao usuário admin
INSERT INTO usuario_roles (usuario_id, role_id, assigned_by)
SELECT u.id, r.id, u.id FROM usuarios u CROSS JOIN roles r
WHERE u.email = 'admin@stockwave.local' AND r.nome = 'admin' AND r.empresa_id = 1;

-- Mapeamento Role → Permissões (admin tem todas)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.nome = 'admin' AND r.empresa_id = 1;

-- Mapeamento Role → Permissões (gerente)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.nome = 'gerente' AND r.empresa_id = 1
AND p.modulo IN ('produtos', 'categorias', 'movimentacoes', 'relatorios');

-- Mapeamento Role → Permissões (operador)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.nome = 'operador' AND r.empresa_id = 1
AND p.nome IN ('produto.view', 'categoria.view', 'movimentacao.view', 'movimentacao.create');

-- Mapeamento Role → Permissões (leitura)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.nome = 'leitura' AND r.empresa_id = 1
AND p.nome LIKE '%.view';

-- Categorias da empresa de exemplo
INSERT INTO categorias (empresa_id, nome, descricao) VALUES 
(1, 'Alimentos', 'Produtos alimentícios em geral'),
(1, 'Bebidas', 'Refrigerantes, sucos, águas e outras bebidas'),
(1, 'Limpeza', 'Produtos de limpeza e higiene'),
(1, 'Eletrônicos', 'Aparelhos eletrônicos e acessórios');

-- Produtos da empresa de exemplo
INSERT INTO produtos (empresa_id, categoria_id, nome, descricao, quantidade, quantidade_minima, preco, codigo_barras) VALUES 
(1, 1, 'Arroz Tipo 1', 'Arroz branco tipo 1 premium', 50.000, 20.000, 25.50, '7891234567890'),
(1, 2, 'Refrigerante Cola 2L', 'Refrigerante de cola 2 litros', 30.000, 10.000, 8.90, '7891234567891'),
(1, 3, 'Detergente Líquido 1L', 'Detergente líquido para louças', 25.000, 5.000, 3.45, '7891234567892'),
(1, 4, 'Mouse USB', 'Mouse óptico USB', 15.000, 5.000, 35.90, '7891234567893');

-- Configurações iniciais
INSERT INTO configuracoes (empresa_id, chave, valor) VALUES 
(1, 'nome_empresa', 'Empresa Exemplo LTDA'),
(1, 'alerta_estoque_baixo', 'true'),
(1, 'limite_produtos_pagina', '50'),
(1, 'mostrar_codigos_barras', 'true');

-- ============================================
-- Setup Concluído
-- ============================================

-- Credenciais de Acesso:
-- Email: admin@stockwave.local
-- Senha: password
-- IMPORTANTE: Altere a senha no primeiro acesso!
