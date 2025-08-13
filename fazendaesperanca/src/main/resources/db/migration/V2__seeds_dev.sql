-- Seeds mínimos para ambiente de desenvolvimento
-- Senha hash de 'Admin@123' gerada por BCrypt (placeholder, troque em prod)
INSERT INTO users (nome, email, senha_hash, role, ativo) VALUES
 ('Administrador', 'admin@fazenda.org', '$2a$10$2b22yA2cpEwRkQZkJbq8qe3u9a8m5FJmVgk5O6m1I6oY2rJ7mQn5i', 'ADMIN', true),
 ('Responsável', 'responsavel@fazenda.org', '$2a$10$2b22yA2cpEwRkQZkJbq8qe3u9a8m5FJmVgk5O6m1I6oY2rJ7mQn5i', 'RESPONSAVEL', true);

INSERT INTO acolhida (nome_completo, data_nascimento, data_entrada, status) VALUES
 ('Maria da Silva', '1995-05-10', '2024-01-15', 'ATIVA'),
 ('Joana Pereira', '1998-09-22', '2024-03-10', 'ATIVA');

-- Saídas médicas de exemplo
INSERT INTO saida_medica (acolhida_id, motivo, destino, profissional, data_hora_saida, responsavel, observacoes)
VALUES
 (1, 'CONSULTA', 'Hospital Municipal', 'Dra. Ana', UTC_TIMESTAMP(6), 'ALCILEIA_FIGUEREDO', 'Consulta rotineira'),
 (2, 'EXAME', 'Clínica XYZ', 'Dr. Paulo', UTC_TIMESTAMP(6), 'MARIA_ASSUNCION', 'Exame de sangue');

-- Transações de exemplo (doação, recebimento, entrega)
INSERT INTO transacao_financeira (tipo, origem_nome, valor, data_hora, forma_pagamento, numero_recibo, responsavel_id, status)
VALUES
 ('DOACAO_EXTERNA', 'Empresa ABC', 500.00, UTC_TIMESTAMP(6), 'PIX', 'REC-2025-00001', 1, 'PENDENTE_ASSINATURA');

INSERT INTO transacao_financeira (tipo, acolhida_id, valor, data_hora, forma_pagamento, numero_recibo, responsavel_id, status)
VALUES
 ('RECEBIMENTO_ACOLHIDA', 1, 120.00, UTC_TIMESTAMP(6), 'DINHEIRO', 'REC-2025-00002', 2, 'PENDENTE_ASSINATURA'),
 ('ENTREGA_ACOLHIDA', 2, 80.00, UTC_TIMESTAMP(6), 'DINHEIRO', 'REC-2025-00003', 2, 'PENDENTE_ASSINATURA');


