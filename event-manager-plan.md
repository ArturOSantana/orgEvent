# Plano: Gerenciador de Eventos (Retiros e Acampamentos)

## Visao Geral

Sistema web responsivo com suporte a PWA (instalavel em celular) para gerenciar retiros, acampamentos e eventos de ministerios e igrejas. Permite cadastro e gestao de eventos, participantes, equipes, voluntarios, funcoes, cronogramas, fases, horarios, materiais e observacoes. Gera exportacoes em PDF e Excel. Funciona offline com sincronizacao posterior.

### Escopo

- Web app responsivo + PWA instalavel no celular
- Offline-first com sync automatico ao reconectar
- Controle de acesso por perfis: Coordenador Geral, Lider de Equipe, Voluntario Comum
- Exportacao de cronogramas, escalas, listas e materiais em PDF e Excel/CSV
- Interface profissional com icones Ant Design Icons, sem emojis, sem aparencia generica

### Fora do Escopo (v1)

- Pagamentos e inscricoes online
- Notificacoes push
- Integracao com redes sociais
- App nativo (iOS/Android compilado — o PWA cobre essa necessidade)

---

## Arquitetura

### Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Rapido, type-safe, ecossistema maduro |
| UI | Tailwind CSS + Radix UI | Componentes acessiveis, personalizaveis |
| Icones | Ant Design Icons (`@ant-design/icons`) | Biblioteca profissional e consistente |
| Offline | Service Worker + IndexedDB (via Dexie.js) | Armazenamento local robusto |
| Backend | Node.js + Fastify + TypeScript | Leve, seguro, alta performance |
| Banco de dados | PostgreSQL (servidor) | Confiavel, relacional, suporta sync |
| ORM | Drizzle ORM | Type-safe, sem magia, migracao simples |
| Autenticacao | JWT (access + refresh token) | Stateless, perfis por evento |
| PDF | PDFKit (server-side) | Geracao de documentos profissionais |
| Excel/CSV | ExcelJS (server-side) | Exportacao formatada |
| Sync offline | Fila de operacoes no IndexedDB + endpoint de sync | Operacoes salvas localmente e enviadas ao reconectar |

### Estrutura de Pastas

```
/
  apps/
    web/          # Frontend React PWA
      src/
        components/   # Componentes reutilizaveis
        pages/        # Paginas por rota
        hooks/        # Custom hooks
        store/        # Estado global (Zustand)
        db/           # Dexie.js (IndexedDB offline)
        services/     # Chamadas de API
        types/        # Tipos TypeScript compartilhados
    api/          # Backend Fastify
      src/
        routes/       # Rotas por dominio
        services/     # Logica de negocio
        db/           # Schema Drizzle + migrações
        middlewares/  # Auth, validacao
        export/       # Geradores PDF e Excel
  packages/
    types/        # Tipos compartilhados entre web e api
```

### Modelo de Dados (entidades principais)

```
Evento
  - id, nome, tipo, descricao, data_inicio, data_fim
  - local, capacidade, status, obs
  - [tem] Fases
  - [tem] Cronograma (Horarios)
  - [tem] Equipes
  - [tem] Participantes
  - [tem] Materiais
  - [tem] Funcoes

Fase
  - id, evento_id, nome, descricao, ordem

Horario (Cronograma)
  - id, evento_id, fase_id?, data, hora_inicio, hora_fim
  - titulo, descricao, responsavel_id?, local?

Equipe
  - id, evento_id, nome, descricao
  - [tem] Membros (EquipeMembro -> Voluntario + Funcao)

Voluntario
  - id, nome, telefone, email, obs
  - [tem] Funcoes por evento

Funcao
  - id, evento_id, nome, descricao

Participante
  - id, evento_id, nome, telefone, email, obs, status
  - equipe_id? (se alocado em equipe)

Material
  - id, evento_id, nome, quantidade, unidade, responsavel_id?, status, obs

Usuario
  - id, nome, email, senha_hash
  - [tem] EventoUsuario (perfil por evento)

EventoUsuario
  - usuario_id, evento_id, perfil (coordenador | lider | voluntario)

SyncQueue (IndexedDB local)
  - id, operacao, entidade, payload, sincronizado, criado_em
```

---

## Sub-Tarefas

---

### ST-01: Estrutura do Monorepo e Configuracao Inicial

**Status**: [ ] pendente

**Intent**
Criar a estrutura base do projeto com monorepo usando npm workspaces, configurar TypeScript, ESLint, Prettier, Tailwind CSS e Vite para o frontend, e Fastify com TypeScript para o backend.

**Expected Outcomes**
- `apps/web` com React + Vite + Tailwind + Radix UI + Ant Design Icons rodando
- `apps/api` com Fastify + TypeScript rodando em modo desenvolvimento
- `packages/types` com tipos compartilhados
- Scripts de dev, build e lint funcionando na raiz
- `.gitignore` configurado corretamente (sem secrets, sem node_modules)

**Todo List**
1. Criar `package.json` raiz com workspaces configurados (`apps/*`, `packages/*`)
2. Criar `apps/api` com Fastify, TypeScript, tsx para dev, compilacao com tsc
3. Criar `apps/web` com Vite, React 18, TypeScript, Tailwind CSS, Radix UI, Ant Design Icons
4. Criar `packages/types` com tipos base compartilhados
5. Configurar ESLint e Prettier na raiz
6. Criar `.gitignore` cobrindo node_modules, dist, .env, arquivos de build
7. Criar `.env.example` documentando variaveis de ambiente necessarias
8. Verificar que `npm run dev` na raiz sobe ambos simultaneamente

**Relevant Context**
- Pasta do workspace: `/Users/artur.santana/retirojovens`
- Pasta esta vazia — criar tudo do zero
- Seguranca: sem secrets em codigo, variaveis via `.env`

---

### ST-02: Banco de Dados — Schema e Migracoes

**Status**: [ ] pendente

**Intent**
Definir o schema completo com Drizzle ORM no backend, criar as migracoes e o script de seed inicial para desenvolvimento.

**Expected Outcomes**
- Todas as tabelas criadas conforme modelo de dados documentado acima
- Migracoes versionadas em `apps/api/src/db/migrations/`
- Script de seed criando um usuario coordenador de teste e um evento de exemplo
- Conexao com PostgreSQL configurada via variavel de ambiente `DATABASE_URL`

**Todo List**
1. Instalar Drizzle ORM, drizzle-kit e driver `postgres` (node-postgres)
2. Definir schemas em `apps/api/src/db/schema/` (um arquivo por dominio: eventos, equipes, voluntarios, participantes, materiais, cronograma, usuarios)
3. Configurar `drizzle.config.ts` apontando para o schema e pasta de migracoes
4. Rodar `drizzle-kit generate` para gerar a migracao inicial
5. Criar script `db:migrate` e `db:seed`
6. Seed deve criar: 1 usuario coordenador, 1 evento de retiro com fases e horarios de exemplo

**Relevant Context**
- Modelo de dados completo esta na secao Arquitetura acima
- `DATABASE_URL` deve vir de variavel de ambiente — nunca hardcoded
- Usar `pgvector` nao e necessario aqui

---

### ST-03: Backend — Autenticacao e Middleware de Perfis

**Status**: [ ] pendente

**Intent**
Implementar o sistema de login com JWT, refresh token e middleware de autorizacao por perfil (coordenador geral, lider de equipe, voluntario comum) com escopo por evento.

**Expected Outcomes**
- `POST /auth/login` retorna access token (15min) e refresh token (7 dias)
- `POST /auth/refresh` renova o access token
- `POST /auth/logout` invalida o refresh token
- Middleware `authenticate` verifica JWT em todas as rotas protegidas
- Middleware `authorize(perfil, eventoId)` verifica se o usuario tem o perfil no evento
- Senhas armazenadas com bcrypt (fator 12)

**Todo List**
1. Instalar `jsonwebtoken`, `bcrypt`, `@types` correspondentes
2. Criar servico `AuthService` com metodos de login, refresh e logout
3. Criar tabela de refresh tokens no banco (invalidacao segura)
4. Implementar middleware `authenticate` — extrai e valida JWT do header Authorization
5. Implementar middleware `authorize` — verifica EventoUsuario para o perfil exigido
6. Criar rotas `/auth/*` no Fastify
7. Garantir que tokens JWT usam `HS256` com secret vindo de variavel de ambiente
8. Nunca expor o hash da senha em nenhuma resposta da API

**Relevant Context**
- Perfis: `coordenador`, `lider`, `voluntario` — escopo por evento (EventoUsuario)
- Seguranca: TLS obrigatorio em producao, secrets via env
- ST-02 deve estar concluida (tabelas de usuarios e EventoUsuario)

---

### ST-04: Backend — CRUD das Entidades Principais

**Status**: [ ] pendente

**Intent**
Implementar as rotas REST para todas as entidades do sistema: Eventos, Fases, Horarios, Equipes, Voluntarios, Funcoes, Participantes, Materiais e Observacoes.

**Expected Outcomes**
- Rotas CRUD completas para cada entidade sob `/api/eventos/:eventoId/...`
- Validacao de entrada com Zod em todas as rotas
- Respostas paginadas onde listas podem ser longas
- Controle de acesso aplicado: somente coordenador pode criar/deletar eventos; lideres gerenciam equipes e voluntarios de seus eventos; voluntarios so visualizam

**Todo List**
1. Criar servicos por dominio: `EventoService`, `CronogramaService`, `EquipeService`, `VoluntarioService`, `ParticipanteService`, `MaterialService`
2. Criar rotas Fastify por dominio com validacao Zod nos schemas de entrada
3. Aplicar middlewares `authenticate` e `authorize` por nivel de acesso
4. Rotas de eventos: listar, criar, editar, arquivar (sem delete fisico)
5. Rotas de cronograma: listar horarios por fase, criar, editar, reordenar
6. Rotas de equipes: CRUD + adicionar/remover membros com funcao
7. Rotas de participantes: CRUD + busca por nome/email + alocacao em equipe
8. Rotas de materiais: CRUD + atualizar status
9. Todos os inputs validados com Zod — rejeitar entradas invalidas com erro 400

**Relevant Context**
- ST-03 deve estar concluida (autenticacao funcionando)
- Inputs validados server-side — nunca confiar no cliente
- Sem delete fisico: usar campo `arquivado_em` ou `status`

---

### ST-05: Backend — Exportacao PDF e Excel

**Status**: [ ] pendente

**Intent**
Implementar os endpoints de exportacao que geram documentos prontos para impressao ou uso em planilhas.

**Expected Outcomes**
- `GET /api/eventos/:id/exportar/cronograma.pdf` — cronograma completo formatado
- `GET /api/eventos/:id/exportar/escalas.pdf` — escala de equipes e voluntarios
- `GET /api/eventos/:id/exportar/participantes.xlsx` — lista de participantes com equipes
- `GET /api/eventos/:id/exportar/materiais.xlsx` — lista de materiais com status
- PDFs com cabecalho contendo nome do evento, data e logo placeholder

**Todo List**
1. Instalar `pdfkit` e `exceljs`
2. Criar modulo `apps/api/src/export/` com geradores separados por tipo
3. `CronogramaPDF`: pagina por fase, horarios em tabela com responsavel
4. `EscalasPDF`: tabela por equipe listando membros e funcoes
5. `ParticipantesXLSX`: colunas nome, email, telefone, equipe, status
6. `MateriaisXLSX`: colunas nome, quantidade, unidade, responsavel, status
7. Criar rotas de exportacao protegidas (apenas coordenador e lider)
8. Garantir que nenhum dado sensivelmente pessoal (senha, tokens) apareca nos exports

**Relevant Context**
- ST-04 deve estar concluida (dados disponiveis via servicos)
- Exports sao gerados server-side e enviados como download

---

### ST-06: Backend — Endpoint de Sincronizacao Offline

**Status**: [ ] pendente

**Intent**
Criar o endpoint que recebe a fila de operacoes acumuladas no frontend enquanto offline e as aplica em ordem no banco.

**Expected Outcomes**
- `POST /api/sync` recebe array de operacoes com entidade, tipo (create/update/delete) e payload
- Operacoes aplicadas em transacao atomica
- Conflitos detectados (versao/timestamp) e reportados ao cliente
- Resposta inclui estado atual das entidades afetadas para o cliente atualizar

**Todo List**
1. Definir schema da fila de sync: `{ id, entidade, operacao, payload, cliente_timestamp }`
2. Criar `SyncService` que processa o array de operacoes em ordem
3. Validar cada operacao individualmente com Zod antes de aplicar
4. Usar transacao Drizzle para garantir atomicidade do batch
5. Detectar conflitos por campo `updated_at`: se servidor tem versao mais nova, reportar conflito
6. Criar rota `POST /api/sync` protegida por `authenticate`

**Relevant Context**
- ST-04 deve estar concluida
- Conflitos devem ser reportados sem travar — cliente decide como resolver
- Todos os campos de entidade devem ter `updated_at` automaticamente atualizado

---

### ST-07: Frontend — Layout Base e Navegacao

**Status**: [ ] pendente

**Intent**
Criar o shell da aplicacao: layout responsivo com sidebar no desktop, bottom navigation no mobile, sistema de rotas e estrutura de paginas.

**Expected Outcomes**
- Layout responsivo: sidebar recolhivel no desktop, barra inferior no mobile
- Rotas configuradas com React Router v6
- Paginas vazias (placeholder) para cada secao: Eventos, Cronograma, Equipes, Participantes, Voluntarios, Materiais
- Header com nome do evento ativo e menu de usuario
- Icones Ant Design Icons em todos os itens de navegacao
- Tema com cores customizadas (sem paleta generica padrao)
- Dark mode opcional

**Todo List**
1. Instalar React Router v6, Zustand, Dexie.js, Axios
2. Instalar `@ant-design/icons`
3. Criar componentes `AppShell`, `Sidebar`, `BottomNav`, `Header`
4. Configurar React Router com rotas protegidas (redirect para login se sem token)
5. Criar paginas placeholder para cada modulo
6. Definir paleta de cores no `tailwind.config.ts` (tons de azul profundo + accent laranja/ambar)
7. Criar componentes base: `Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`
8. Garantir que o layout e usavel em tela de 375px (iPhone SE) e 1440px (desktop)

**Relevant Context**
- ST-01 deve estar concluida
- Sem emojis em nenhum lugar — apenas Ant Design Icons
- Interface nao deve parecer generica — tipografia e espacamento bem definidos

---

### ST-08: Frontend — Autenticacao e Contexto de Usuario

**Status**: [ ] pendente

**Intent**
Implementar tela de login, gerenciamento de tokens JWT no cliente e contexto global de usuario autenticado com perfil por evento.

**Expected Outcomes**
- Tela de login com campos email e senha, botao de entrar
- Tokens armazenados em memoria (access) e localStorage (refresh)
- Axios interceptor que renova o access token automaticamente via refresh
- Contexto `AuthContext` disponivel em toda a app com usuario e perfil atual
- Logout limpa estado e redireciona para login
- Protecao de rotas: redireciona para `/login` se nao autenticado

**Todo List**
1. Criar pagina `LoginPage` com formulario e validacao
2. Criar `authService.ts` com funcoes login, logout, refresh
3. Configurar Axios instance com interceptor de refresh automatico
4. Criar `AuthContext` e `AuthProvider` com hook `useAuth()`
5. Criar `ProtectedRoute` component para React Router
6. Nunca armazenar o access token no localStorage — apenas em memoria (variavel de modulo)
7. Refresh token no localStorage com flag `httpOnly` simulada via controle de acesso

**Relevant Context**
- ST-03 do backend deve estar concluida
- ST-07 deve estar concluida (rotas e layout existem)
- Seguranca: access token em memoria evita ataques XSS via localStorage

---

### ST-09: Frontend — Modulo de Eventos

**Status**: [ ] pendente

**Intent**
Implementar as telas de listagem, criacao, edicao e visualizacao de eventos com todas as informacoes principais.

**Expected Outcomes**
- Listagem de eventos com busca, filtro por status e ordenacao
- Card de evento mostrando nome, datas, local, status e contadores (participantes, equipes, voluntarios)
- Formulario de criacao/edicao com todos os campos do modelo
- Pagina de detalhe do evento como hub central para os outros modulos
- Acoes restritas por perfil (coordenador pode criar/arquivar, outros apenas visualizam)

**Todo List**
1. Criar `EventosList` com cards responsivos e barra de busca
2. Criar `EventoForm` com validacao client-side (React Hook Form + Zod)
3. Criar `EventoDetail` como pagina hub com tabs para Cronograma, Equipes, Participantes, etc.
4. Integrar com API via `eventoService.ts`
5. Salvar operacoes na fila offline (Dexie) quando sem conexao
6. Indicador visual de status: Planejamento, Em andamento, Concluido, Arquivado

**Relevant Context**
- ST-04 e ST-08 devem estar concluidas
- ST-07 fornece o layout base

---

### ST-10: Frontend — Modulo de Cronograma

**Status**: [ ] pendente

**Intent**
Implementar a visualizacao e edicao do cronograma por fases e horarios, com visao de linha do tempo e listagem por dia.

**Expected Outcomes**
- Listagem de fases com seus horarios em ordem
- Visualizacao de linha do tempo por dia (estilo agenda)
- Formulario para adicionar/editar horarios com fase, data, hora inicio/fim, titulo, responsavel
- Reordenacao de horarios por drag-and-drop (opcional v1: botoes subir/descer)
- Impressao/exportacao do cronograma via botao que chama o endpoint PDF

**Todo List**
1. Criar `CronogramaPage` com abas por fase
2. Criar componente `HorarioCard` com todas as informacoes e acoes
3. Criar `HorarioForm` com selecao de fase, data/hora e responsavel
4. Botao "Exportar PDF" chamando endpoint de exportacao
5. Integrar com API via `cronogramaService.ts`
6. Suporte offline: ler da fila local quando sem conexao

**Relevant Context**
- ST-05 (exportacao PDF) e ST-09 devem estar concluidas

---

### ST-11: Frontend — Modulo de Equipes e Voluntarios

**Status**: [ ] pendente

**Intent**
Implementar gestao de equipes, voluntarios e alocacao de funcoes dentro de cada equipe.

**Expected Outcomes**
- Listagem de equipes com contador de membros
- Detalhe de equipe mostrando membros e suas funcoes
- Adicionar/remover voluntarios de uma equipe com selecao de funcao
- Cadastro de voluntarios com dados de contato e observacoes
- Cadastro de funcoes por evento
- Exportacao da escala de equipes em PDF

**Todo List**
1. Criar `EquipesList` e `EquipeDetail`
2. Criar `VoluntarioForm` e `VoluntariosList`
3. Criar `FuncaoForm` (modal simples)
4. Componente de alocacao: buscar voluntario e atribuir funcao na equipe
5. Botao "Exportar Escala PDF"
6. Integrar com API via `equipeService.ts` e `voluntarioService.ts`

**Relevant Context**
- ST-04 e ST-09 devem estar concluidas

---

### ST-12: Frontend — Modulo de Participantes

**Status**: [ ] pendente

**Intent**
Implementar o cadastro e gestao de participantes do evento com alocacao em equipes e exportacao de lista.

**Expected Outcomes**
- Listagem de participantes com busca por nome/email e filtro por equipe
- Formulario de cadastro com nome, telefone, email, observacoes, status
- Alocacao de participante em equipe
- Exportacao da lista em Excel/CSV via botao
- Importacao de participantes por upload de CSV (v1 simples: nome e email)

**Todo List**
1. Criar `ParticipantesList` com busca e filtros
2. Criar `ParticipanteForm`
3. Selector de equipe na tela de detalhe do participante
4. Botao "Exportar Excel"
5. Botao "Importar CSV" com preview antes de confirmar
6. Integrar com API

**Relevant Context**
- ST-05 (exportacao) e ST-11 devem estar concluidas

---

### ST-13: Frontend — Modulo de Materiais e Observacoes

**Status**: [ ] pendente

**Intent**
Implementar o controle de materiais necessarios para o evento e o registro de observacoes gerais.

**Expected Outcomes**
- Lista de materiais com nome, quantidade, unidade, responsavel e status (pendente, adquirido, entregue)
- Formulario de cadastro/edicao de material
- Exportacao da lista de materiais em Excel
- Aba ou secao de Observacoes livres vinculadas ao evento (campo texto rico simples)

**Todo List**
1. Criar `MateriaisList` com filtro por status e responsavel
2. Criar `MaterialForm`
3. Criar `ObservacoesTab` com editor de texto simples (textarea, sem rich text complexo)
4. Botao "Exportar Materiais Excel"
5. Integrar com API

**Relevant Context**
- ST-05 e ST-09 devem estar concluidas

---

### ST-14: Frontend — Offline e Sincronizacao

**Status**: [ ] pendente

**Intent**
Implementar a camada offline com Service Worker, fila de operacoes no IndexedDB via Dexie.js e sincronizacao automatica ao reconectar.

**Expected Outcomes**
- App funciona sem internet: leitura dos dados em cache, escrita na fila local
- Indicador visual de status de conexao (online/offline/sincronizando)
- Ao reconectar, fila e enviada para `POST /api/sync` automaticamente
- Conflitos reportados ao usuario com opcao de resolver
- Service Worker cacheia assets e dados recentes

**Todo List**
1. Configurar Vite PWA plugin com Service Worker (estrategia cache-first para assets, network-first para API)
2. Definir schema Dexie para tabelas espelho das entidades principais
3. Criar `SyncManager` — classe que gerencia a fila e dispara sync
4. Hook `useConnection()` que detecta mudanca de status de rede
5. Componente `SyncStatus` no header mostrando estado atual
6. Tela de conflitos: lista de operacoes em conflito com opcao de manter local ou servidor

**Relevant Context**
- ST-06 (endpoint sync) deve estar concluido
- ST-07 (layout) deve estar concluido
- Todos os modulos de frontend devem estar integrados com o SyncManager

---

### ST-15: Configuracao de Producao e Deploy

**Status**: [ ] pendente

**Intent**
Preparar o projeto para deploy com Dockerfile, variaveis de ambiente documentadas e configuracoes de seguranca para producao.

**Expected Outcomes**
- `Dockerfile` para a API usando imagem Red Hat UBI9 minimal
- `docker-compose.yml` para rodar localmente com PostgreSQL
- Build do frontend gera arquivos estaticos servidos pela API ou CDN
- Todas as variaveis sensiveis documentadas no `.env.example`
- CORS configurado corretamente na API
- Rate limiting basico nas rotas de autenticacao

**Todo List**
1. Criar `apps/api/Dockerfile` usando `registry.redhat.io/ubi9/nodejs-20-minimal:latest`
2. Criar `docker-compose.yml` com servicos `api` e `postgres`
3. Configurar CORS na API com lista de origens permitidas via variavel de ambiente
4. Adicionar rate limiting no Fastify para rotas `/auth/*` (max 10 req/min por IP)
5. Build script do frontend gera `dist/` que pode ser servido estaticamente
6. Criar `README.md` com instrucoes de setup, variaveis de ambiente e como rodar
7. Verificar que nenhum secret esta hardcoded em nenhum arquivo

**Relevant Context**
- Seguranca: imagens apenas de `registry.redhat.io`, usuario nao-root no container
- Seguranca: nao bind para `0.0.0.0` em producao — usar `127.0.0.1` ou configuracao via env
- Esta deve ser a ultima sub-tarefa executada

---

## Ordem de Execucao

```
ST-01 -> ST-02 -> ST-03 -> ST-04 -> ST-05 -> ST-06
                                                   \
ST-01 -> ST-07 -> ST-08 -> ST-09 -> ST-10 -> ST-11 -> ST-12 -> ST-13 -> ST-14
                                                                              \
                                                                            ST-15
```

Backend (ST-01 a ST-06) pode ser desenvolvido em paralelo com Frontend base (ST-07, ST-08) pois compartilham apenas tipos.

---

## Convencoes do Projeto

- Sem emojis em nenhum lugar da interface — apenas Ant Design Icons
- Tipografia: Inter para textos, JetBrains Mono para codigos/timestamps
- Cores: azul profundo `#1e3a5f` como primaria, ambar `#f59e0b` como accent
- Sem aparencia generica de IA — sem gradientes de roxo para azul, sem cards brancos com sombra generica
- Idioma da interface: Portugues Brasileiro
- Todos os campos de data/hora no formato `dd/mm/aaaa hh:mm`
- IDs usam UUID v4
- Todos os campos de auditoria: `criado_em`, `atualizado_em`, `criado_por`
