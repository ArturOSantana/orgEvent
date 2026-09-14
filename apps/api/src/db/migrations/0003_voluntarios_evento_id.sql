ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "evento_id" uuid REFERENCES "eventos"("id");
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "titulo_convite" text;
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "mensagem_convite" text;
--> statement-breakpoint
ALTER TABLE "voluntarios" ADD COLUMN IF NOT EXISTS "arte_url" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voluntarios_evento_id_idx" ON "voluntarios" USING btree ("evento_id");
