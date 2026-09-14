-- Permite que um voluntário tenha múltiplas funções na mesma equipe.
-- Remove o unique constraint (equipe_id, voluntario_id) e cria um novo
-- unique em (equipe_id, voluntario_id, funcao_id) para evitar duplicatas exatas.

ALTER TABLE "equipe_voluntarios"
  DROP CONSTRAINT IF EXISTS "equipe_voluntarios_equipe_voluntario_idx";

DROP INDEX IF EXISTS "equipe_voluntarios_equipe_voluntario_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "equipe_voluntarios_equipe_voluntario_funcao_idx"
  ON "equipe_voluntarios" ("equipe_id", "voluntario_id", "funcao_id");
