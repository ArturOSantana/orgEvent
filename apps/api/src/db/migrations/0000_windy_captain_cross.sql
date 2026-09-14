CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revogado" boolean DEFAULT false,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"email" varchar(300) NOT NULL,
	"senha_hash" varchar(500) NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "evento_usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"perfil" varchar(50) NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventos" (
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
--> statement-breakpoint
CREATE TABLE "fases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "horarios" (
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
--> statement-breakpoint
CREATE TABLE "equipe_voluntarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipe_id" uuid NOT NULL,
	"voluntario_id" uuid NOT NULL,
	"funcao_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funcoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voluntarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"telefone" varchar(20),
	"email" varchar(300),
	"obs" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"telefone" varchar(20),
	"email" varchar(300),
	"obs" text,
	"status" varchar(50) DEFAULT 'confirmado' NOT NULL,
	"equipe_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materiais" (
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
--> statement-breakpoint
CREATE TABLE "observacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"conteudo" text NOT NULL,
	"autor_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_usuarios" ADD CONSTRAINT "evento_usuarios_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_usuarios" ADD CONSTRAINT "evento_usuarios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fases" ADD CONSTRAINT "fases_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_fase_id_fases_id_fk" FOREIGN KEY ("fase_id") REFERENCES "public"."fases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_responsavel_id_usuarios_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipe_voluntarios" ADD CONSTRAINT "equipe_voluntarios_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipe_voluntarios" ADD CONSTRAINT "equipe_voluntarios_voluntario_id_voluntarios_id_fk" FOREIGN KEY ("voluntario_id") REFERENCES "public"."voluntarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipe_voluntarios" ADD CONSTRAINT "equipe_voluntarios_funcao_id_funcoes_id_fk" FOREIGN KEY ("funcao_id") REFERENCES "public"."funcoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcoes" ADD CONSTRAINT "funcoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_responsavel_id_usuarios_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "evento_usuarios_evento_usuario_idx" ON "evento_usuarios" USING btree ("evento_id","usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "equipe_voluntarios_equipe_voluntario_idx" ON "equipe_voluntarios" USING btree ("equipe_id","voluntario_id");