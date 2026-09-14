-- Cole este SQL no SQL Editor do Supabase e execute.
-- Acesse: https://supabase.com/dashboard/project/mbjytwtjmfajsbpwfpzc/sql/new
-- Apos executar, rode: npm run db:seed --workspace=apps/api

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revogado" boolean DEFAULT false,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"email" varchar(300) NOT NULL,
	"senha_hash" varchar(500) NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(300) NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"descricao" text,
	"data_inicio" timestamp NOT NULL,
	"data_fim" timestamp NOT NULL,
	"local" varchar(300),
	"capacidade" integer,
	"status" varchar(50) DEFAULT 'planejamento' NOT NULL,
	"obs" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "evento_usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"perfil" varchar(50) NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "horarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"fase_id" uuid,
	"titulo" varchar(300) NOT NULL,
	"descricao" text,
	"data" date NOT NULL,
	"hora_inicio" varchar(5) NOT NULL,
	"hora_fim" varchar(5) NOT NULL,
	"local" varchar(200),
	"responsavel_id" uuid,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "funcoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "voluntarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"telefone" varchar(20),
	"email" varchar(300),
	"obs" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "equipe_voluntarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipe_id" uuid NOT NULL,
	"voluntario_id" uuid NOT NULL,
	"funcao_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "participantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"telefone" varchar(20),
	"email" varchar(300),
	"obs" text,
	"status" varchar(50) DEFAULT 'confirmado' NOT NULL,
	"equipe_id" uuid,
	"checkin_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "materiais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"quantidade" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unidade" varchar(50),
	"responsavel_id" uuid,
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"obs" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "observacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"conteudo" text NOT NULL,
	"autor_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

-- Foreign keys
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_usuarios_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "evento_usuarios" ADD CONSTRAINT "evento_usuarios_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "evento_usuarios" ADD CONSTRAINT "evento_usuarios_usuario_id_usuarios_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "fases" ADD CONSTRAINT "fases_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "horarios" ADD CONSTRAINT "horarios_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "horarios" ADD CONSTRAINT "horarios_fase_id_fases_id_fk"
  FOREIGN KEY ("fase_id") REFERENCES "public"."fases"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "horarios" ADD CONSTRAINT "horarios_responsavel_id_usuarios_id_fk"
  FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "equipe_voluntarios" ADD CONSTRAINT "equipe_voluntarios_equipe_id_equipes_id_fk"
  FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "equipe_voluntarios" ADD CONSTRAINT "equipe_voluntarios_voluntario_id_voluntarios_id_fk"
  FOREIGN KEY ("voluntario_id") REFERENCES "public"."voluntarios"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "equipe_voluntarios" ADD CONSTRAINT "equipe_voluntarios_funcao_id_funcoes_id_fk"
  FOREIGN KEY ("funcao_id") REFERENCES "public"."funcoes"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "equipes" ADD CONSTRAINT "equipes_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "funcoes" ADD CONSTRAINT "funcoes_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "participantes" ADD CONSTRAINT "participantes_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "participantes" ADD CONSTRAINT "participantes_equipe_id_equipes_id_fk"
  FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "materiais" ADD CONSTRAINT "materiais_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "materiais" ADD CONSTRAINT "materiais_responsavel_id_usuarios_id_fk"
  FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_evento_id_eventos_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_autor_id_usuarios_id_fk"
  FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");
CREATE UNIQUE INDEX IF NOT EXISTS "evento_usuarios_evento_usuario_idx" ON "evento_usuarios" USING btree ("evento_id","usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "equipe_voluntarios_equipe_voluntario_idx" ON "equipe_voluntarios" USING btree ("equipe_id","voluntario_id");

-- Formulário de inscrição pública por evento
CREATE TABLE IF NOT EXISTS "formularios_inscricao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"slug" varchar(200) NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"descricao" text,
	"coletar_telefone" boolean DEFAULT true NOT NULL,
	"coletar_email" boolean DEFAULT true NOT NULL,
	"valor_inscricao" numeric(10, 2) DEFAULT '0',
	"instrucoes_pagamento" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"data_limite" timestamp,
	"vagas" integer,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "formularios_inscricao_evento_id_unique" UNIQUE("evento_id"),
	CONSTRAINT "formularios_inscricao_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "campos_formulario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formulario_id" uuid NOT NULL,
	"rotulo" varchar(200) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"opcoes" jsonb,
	"obrigatorio" boolean DEFAULT false NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inscricoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formulario_id" uuid NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"email" varchar(300),
	"telefone" varchar(20),
	"status" varchar(50) DEFAULT 'pendente_pagamento' NOT NULL,
	"pagamento_confirmado_por" uuid,
	"pagamento_confirmado_em" timestamp,
	"checkin_em" timestamp,
	"checkin_confirmado_por" uuid,
	"obs_admin" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "respostas_inscricao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inscricao_id" uuid NOT NULL,
	"campo_id" uuid NOT NULL,
	"valor" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "formularios_inscricao" ADD CONSTRAINT "formularios_inscricao_evento_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "campos_formulario" ADD CONSTRAINT "campos_formulario_formulario_id_fk"
  FOREIGN KEY ("formulario_id") REFERENCES "public"."formularios_inscricao"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_formulario_id_fk"
  FOREIGN KEY ("formulario_id") REFERENCES "public"."formularios_inscricao"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_evento_id_fk"
  FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "respostas_inscricao" ADD CONSTRAINT "respostas_inscricao_inscricao_id_fk"
  FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricoes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "respostas_inscricao" ADD CONSTRAINT "respostas_inscricao_campo_id_fk"
  FOREIGN KEY ("campo_id") REFERENCES "public"."campos_formulario"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "inscricoes_evento_status_idx" ON "inscricoes" USING btree ("evento_id", "status");
CREATE INDEX IF NOT EXISTS "inscricoes_formulario_idx" ON "inscricoes" USING btree ("formulario_id");

-- Tabela de controle do Drizzle migrator (para o script db:migrate reconhecer que ja foi aplicado)
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- Alteracoes para o sistema de convites e customizacoes
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "slug" varchar(300);
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "status_convite" varchar(50) DEFAULT 'pendente';
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "observacao_convite" text DEFAULT '';
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "data_resposta" timestamp;
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "visualizado_em" timestamp;
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "titulo_convite" text;
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "mensagem_convite" text;
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "arte_url" text;
CREATE UNIQUE INDEX IF NOT EXISTS "voluntarios_slug_idx" ON "voluntarios" USING btree ("slug");

-- Adiciona evento_id na tabela voluntarios para rastrear o evento mesmo sem equipe
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "evento_id" uuid REFERENCES "public"."eventos"("id");
CREATE INDEX IF NOT EXISTS "voluntarios_evento_id_idx" ON "voluntarios" USING btree ("evento_id");

-- Criar tabela de quartos
CREATE TABLE IF NOT EXISTS "quartos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evento_id" uuid NOT NULL REFERENCES "public"."eventos"("id") ON DELETE CASCADE,
  "nome" varchar(200) NOT NULL,
  "genero" varchar(20) DEFAULT 'misto',
  "capacidade" integer DEFAULT 4 NOT NULL,
  "responsavel_nome" varchar(200),
  "localizacao" varchar(200),
  "obs" text,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL
);

-- Adicionar colunas quarto_id e inscricao_id em participantes se não existirem
ALTER TABLE "participantes" ADD COLUMN IF NOT EXISTS "quarto_id" uuid REFERENCES "public"."quartos"("id") ON DELETE SET NULL;
ALTER TABLE "participantes" ADD COLUMN IF NOT EXISTS "inscricao_id" uuid;

-- Limpar inscritos e participantes
-- Ordem: filhos antes dos pais (foreign keys)
DELETE FROM "respostas_inscricao";
DELETE FROM "inscricoes";
DELETE FROM "participantes";
