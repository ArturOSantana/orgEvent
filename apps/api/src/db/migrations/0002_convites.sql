ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "slug" varchar(300) UNIQUE;
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "status_convite" varchar(50) DEFAULT 'pendente';
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "observacao_convite" text DEFAULT '';
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "data_resposta" timestamp;
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "visualizado_em" timestamp;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "voluntarios_slug_idx" ON "voluntarios" USING btree ("slug");
