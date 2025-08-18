## Fazenda Esperança – Sistema de Gestão

Aplicação full‑stack para gestão de acolhidas, saídas médicas e finanças da Obra Social Nossa Senhora da Glória – Fazenda da Esperança (Filial São Domingos Gusmão).

### Visão geral

- **Domínios principais**: cadastro de acolhidas, controle de saídas médicas (individual e em grupo), registro de transações financeiras (doações externas e recebimentos de acolhida), relatórios gerenciais (CSV e XLSX), emissão de recibos em PDF, auditoria e segurança com perfis de acesso.
- **Arquitetura**: backend REST em Spring Boot + frontend SPA em React/TypeScript. Autenticação via JWT (access/refresh) com interceptadores no frontend para renovação transparente.

## Tecnologias

### Backend (Java 17 / Spring Boot 3.5.x)

- Spring Boot: Web, Data JPA (Hibernate), Security, Validation, Actuator
- Banco de dados: MySQL (migrations com Flyway)
- Segurança/JWT: jjwt (api/impl/jackson)
- Documentação: springdoc-openapi (Swagger UI)
- Exportação: OpenCSV (CSV) e Apache POI (XLSX)
- PDF: openhtmltopdf (PDFBox)
- Utilitários: Lombok, MapStruct (opcional)
- Logging: Logback (formatação com traceId/path/method) e filtro de logging HTTP

### Frontend (React + TypeScript + Vite)

- React Router para navegação SPA
- Axios com interceptadores (Authorization, loading global, refresh token)
- Tailwind CSS para estilização
- Context API para autenticação e controle de sessão (idle timeout + sync entre abas)

## Backend – Funcionalidades

### Domínios

- `Acolhida`: dados pessoais, status (ATIVA/EGRESSA), documentos, telefone, observações
- `SaidaMedica`: motivo, destino, profissional, horários de saída/retorno, meio de transporte, responsável, observações
- `TransacaoFinanceira`: tipo (DOACAO_EXTERNA/RECEBIMENTO_ACOLHIDA), valor, forma de pagamento, data/hora, descrição, número de recibo, responsável
- `User`: autenticação, nome, e‑mail e perfil (`Role`)
- `AuditLog`: trilha de auditoria por ação (ver AOP abaixo)

### Segurança e autenticação

- JWT com access token e refresh token
- Perfis/roles: ADMIN, RESPONSAVEL, COLABORADOR, VISUALIZADOR (controle por `@PreAuthorize`)
- CORS configurado para o frontend

### Auditoria e logs

- AOP com `@AuditableAction` registra ações CRUD e exportações (entidade, usuário, timestamp)
- Logback com padrão estruturado (timestamp/level/traceId/path/method/logger)

### Timezone e datas

- Backend configurado para `America/Sao_Paulo` e locale `pt-BR`
- Endpoints aceitam/retornam `OffsetDateTime`; frontend envia datas com offset local para evitar desvios de fuso

### Relatórios e exportação

- Endpoints CSV: `/relatorios/saidas-medicas.csv`, `/relatorios/financeiro.csv`
- Endpoints XLSX: `/relatorios/saidas-medicas.xlsx`, `/relatorios/financeiro.xlsx`
- Planilhas XLSX com identidade visual: título/subtítulo (período), cabeçalho destacado, bordas leves, ajuste automático de colunas e cabeçalho congelado (pronto para impressão)
- Dados legíveis: enums convertidos para texto sem “_” e capitalização adequada; nomes de acolhidas e responsáveis exibidos quando aplicável

### Recibos em PDF

- Endpoint: `/transacoes/{id}/recibo/pdf`
- Layout com logo, identificação da organização, dados da transação e destinatário (doador ou acolhida), data/valor formatados em pt‑BR

### Principais endpoints (resumo)

- Autenticação: `/auth/login`, `/auth/refresh`
- Acolhidas: CRUD e listagem paginada/filtrada
- Saídas médicas: criação/edição/retorno, listagem com filtros e criação em grupo (frontend)
- Transações: criação, listagem paginada (com nome da acolhida ou origem), exclusão, cancelamento, recibo PDF
- Relatórios: CSV/XLSX para saídas médicas e financeiro (com fetch join para evitar lazy loading em relatórios)

## Frontend – Funcionalidades

### Autenticação e sessão

- Tela de login com contexto de auth; sempre inicia deslogado
- Armazena access/refresh tokens, renova automaticamente em 401
- Idle logout com timeout configurável e sincronização entre abas
- Redireciona para login quando não autorizado (401/403)

### Dashboard

- Indicadores: total de saídas médicas, tempo médio fora, total de transações, acolhidas ativas/egressas
- Atalhos para módulos de finanças e saídas

### Acolhidas

- Listagem com filtros (nome, status, datas de entrada)
- Formulário de cadastro/edição (foto URL removido), validações de datas/documentos

### Saídas médicas

- Cadastro individual e em grupo, com seleção de acolhidas ativas
- Duração calculada e exibição de responsável (texto legível)
- Filtros por acolhida, motivo e período

### Transações financeiras

- Criação de doação externa e recebimento de acolhida
- Vinculação automática do documento da acolhida no recebimento
- Campo de valor com máscara pt‑BR (mantém apenas dígitos, exibe milhares e centavos)
- Listagem com coluna “Origem/Acolhida”, recibo em PDF e exclusão
- Colunas e ações de assinatura canceladas/removidas conforme nova regra

### Relatórios (UI)

- Presets de período (Hoje, 7/30 dias, Este mês, Mês passado)
- Data/hora com validação e opção “dia inteiro”
- Exportação para XLSX (principal) e CSV (alternativo) com feedback de “Gerando…” e tratamento de erros

## Estrutura do repositório (resumo)

- `fazendaesperanca/` – backend Spring Boot
  - `src/main/java/com/fazendaesperanca/fazendaesperanca/` – código fonte (config, security, domain, repository, service, web)
  - `src/main/resources/` – configs, `application.yml`, migrations Flyway, `logback-spring.xml`
- `frontend/` – SPA React/TypeScript
  - `src/` – páginas, módulos, componentes de UI, contexto de autenticação, utilitários

## Decisões de design notáveis

- Envio de datas sempre com offset local para refletir corretamente o fuso horário do usuário
- Interceptadores Axios com fila de requisições durante refresh para evitar “race conditions”
- Geração de Excel estilizado para impressão direta (títulos, subtítulos e cabeçalhos)
- Relatórios usam consultas com fetch join a fim de evitar `LazyInitializationException`
