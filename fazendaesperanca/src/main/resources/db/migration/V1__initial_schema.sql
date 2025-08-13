-- Schema inicial: usuários, acolhidas, saídas médicas, transações, anexos, auditoria
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE acolhida (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_completo VARCHAR(180) NOT NULL,
    data_nascimento DATE NULL,
    data_entrada DATE NULL,
    documento VARCHAR(30) NULL,
    telefone VARCHAR(30) NULL,
    status VARCHAR(20) NOT NULL,
    foto_url VARCHAR(500) NULL,
    observacoes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE saida_medica (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    acolhida_id BIGINT NOT NULL,
    motivo VARCHAR(20) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    profissional VARCHAR(150) NULL,
    data_hora_saida TIMESTAMP(6) NOT NULL,
    data_hora_retorno TIMESTAMP(6) NULL,
    meio_transporte VARCHAR(100) NULL,
    responsavel VARCHAR(40) NOT NULL,
    observacoes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_saida_medica_acolhida FOREIGN KEY (acolhida_id) REFERENCES acolhida(id)
);
CREATE INDEX idx_saida_medica_data_saida ON saida_medica (data_hora_saida);

CREATE TABLE transacao_financeira (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(30) NOT NULL,
    origem_nome VARCHAR(180) NULL,
    origem_documento VARCHAR(30) NULL,
    acolhida_id BIGINT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_hora TIMESTAMP(6) NOT NULL,
    forma_pagamento VARCHAR(20) NOT NULL,
    descricao TEXT NULL,
    numero_recibo VARCHAR(40) NOT NULL UNIQUE,
    arquivo_assinado_path VARCHAR(500) NULL,
    responsavel_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_transacao_acolhida FOREIGN KEY (acolhida_id) REFERENCES acolhida(id),
    CONSTRAINT fk_transacao_responsavel FOREIGN KEY (responsavel_id) REFERENCES users(id)
);
CREATE INDEX idx_transacao_data ON transacao_financeira (data_hora);
CREATE INDEX idx_transacao_tipo ON transacao_financeira (tipo);

CREATE TABLE attachment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transacao_id BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_attachment_transacao FOREIGN KEY (transacao_id) REFERENCES transacao_financeira(id)
);

CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity VARCHAR(120) NOT NULL,
    entity_id VARCHAR(120) NOT NULL,
    action VARCHAR(20) NOT NULL,
    user_id BIGINT NULL,
    timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    payload_snapshot JSON NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);


