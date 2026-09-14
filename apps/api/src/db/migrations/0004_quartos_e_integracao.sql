-- Criar tabela de quartos
CREATE TABLE IF NOT EXISTS "quartos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evento_id" uuid NOT NULL REFERENCES "eventos"("id") ON DELETE CASCADE,
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participantes' AND column_name = 'quarto_id'
  ) THEN
    ALTER TABLE "participantes" ADD COLUMN "quarto_id" uuid REFERENCES "quartos"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participantes' AND column_name = 'inscricao_id'
  ) THEN
    ALTER TABLE "participantes" ADD COLUMN "inscricao_id" uuid;
  END IF;
END $$;
