# Gestor de Eventos

Sistema web para gerenciamento de retiros, acampamentos e eventos de ministerios e igrejas.

## Funcionalidades

- Cadastro e gestao de eventos com cronograma, fases e horarios
- Gestao de equipes, voluntarios e funcoes
- Controle de participantes com importacao via CSV
- Controle de materiais e observacoes
- Exportacao de cronograma e escalas em PDF
- Exportacao de participantes e materiais em Excel
- Funciona offline com sincronizacao automatica
- Interface responsiva — web e PWA instalavel no celular

## Perfis de acesso

| Perfil | Permissoes |
|---|---|
| Coordenador | Acesso total: criar, editar, arquivar eventos, gerenciar equipes e participantes |
| Lider de Equipe | Gerenciar equipes, voluntarios, cronograma e materiais do evento |
| Voluntario | Visualizar informacoes do evento |

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, PWA
- **Backend**: Node.js 20, Fastify, TypeScript
- **Banco**: PostgreSQL 15 + Drizzle ORM
- **Offline**: Service Worker + IndexedDB (Dexie.js)

## Pre-requisitos

- Node.js 20+
- PostgreSQL 15+ (ou Docker)
- npm 10+

## Configuracao

### 1. Clonar e instalar dependencias

```bash
git clone <url>
cd retirojovens
npm install
```

### 2. Variaveis de ambiente

Copiar o arquivo de exemplo e preencher:

```bash
cp .env.example apps/api/.env
```

Editar `apps/api/.env`:

```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/gestoreventos
JWT_SECRET=gere_um_secret_longo_e_aleatorio
JWT_REFRESH_SECRET=gere_outro_secret_diferente
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Copiar para o frontend:

```bash
cp .env.example apps/web/.env.local
```

Editar `apps/web/.env.local`:

```
VITE_API_URL=http://localhost:3001
```

### 3. Banco de dados

```bash
# Rodar migracoes
npm run db:migrate --workspace=apps/api

# Popular com dados iniciais (usuario admin + evento de exemplo)
npm run db:seed --workspace=apps/api
```

Credenciais do admin criadas pelo seed:

- Email: `admin@retiro.local`
- Senha: `Admin@2024`

**Troque a senha apos o primeiro login.**

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Isso inicia:

- API em `http://localhost:3001`
- Frontend em `http://localhost:5173`

### 5. Build de producao

```bash
npm run build
```

### 6. Rodar com Docker (desenvolvimento local)

```bash
docker-compose up -d
```

> **Atencao:** O `docker-compose.yml` e apenas para desenvolvimento local.
> Em producao, todos os secrets devem vir de variaveis de ambiente reais —
> nunca hardcoded. Use um gerenciador de secrets (HashiCorp Vault, IBM Key Protect).

## Estrutura do projeto

```
apps/
  web/       # Frontend React PWA
  api/       # Backend Fastify
packages/
  types/     # Tipos TypeScript compartilhados
```

## Seguranca

- Nunca commitar o arquivo `.env`
- Trocar os valores de `JWT_SECRET` e `JWT_REFRESH_SECRET` antes de ir para producao
- Em producao, usar um gerenciador de secrets (HashiCorp Vault, IBM Key Protect)
- O arquivo `docker-compose.yml` e apenas para desenvolvimento local
- A imagem Docker usa `registry.redhat.io/ubi9/nodejs-20-minimal` e roda como usuario nao-root (UID 1001)
- Todas as portas expostas escutam em `127.0.0.1`, nunca em `0.0.0.0`
- Rate limiting ativo: 100 req/min globais, 10 req/min nas rotas de autenticacao por IP
# orgEvent
