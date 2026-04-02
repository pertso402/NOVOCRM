-- Campos adicionados no DB EXTERNO (leads table):
-- Executar no Supabase externo (nnnrnaxvghgbtqjlxjnk):
--
-- ALTER TABLE public.leads
--   ADD COLUMN IF NOT EXISTS temperatura text CHECK (temperatura IN ('frio','morno','quente')) DEFAULT 'frio',
--   ADD COLUMN IF NOT EXISTS proximo_followup timestamptz DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS tentativas_followup int NOT NULL DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS ultimo_contato timestamptz DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS obs text DEFAULT NULL;
--
-- ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'ligacao_feita';
-- ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'video_enviado';
--
-- UPDATE public.leads SET stage = CASE
--   WHEN negocio_fechado = true THEN 'negocio_fechado'
--   WHEN negocio_perdido = true THEN 'negocio_perdido'
--   WHEN fechamento_marcado = true THEN 'fechamento_marcado'
--   WHEN diagnostico_marcado = true THEN 'diagnostico_marcado'
--   WHEN follow_up = true THEN 'follow_up'
--   WHEN interessado = true THEN 'interessado'
--   WHEN "Documento/proposta Enviada" = true THEN 'video_enviado'
--   WHEN "Apresentação criada" = true THEN 'ligacao_feita'
--   WHEN canal_aberto = true THEN 'canal_aberto'
--   ELSE stage
-- END
-- WHERE stage = 'novo' OR stage IS NULL;

-- View de follow-up diário (criar no DB externo):
CREATE OR REPLACE VIEW public.v_followup_hoje AS
SELECT
  id,
  nome_negocio,
  nome_decisor,
  whats,
  url_whats,
  stage,
  temperatura,
  tentativas_followup,
  proximo_followup,
  ultimo_contato,
  niche,
  created_at
FROM public.leads
WHERE
  stage NOT IN ('negocio_fechado', 'negocio_perdido')
  AND (proximo_followup IS NULL OR proximo_followup <= now())
ORDER BY
  CASE temperatura WHEN 'quente' THEN 1 WHEN 'morno' THEN 2 ELSE 3 END,
  proximo_followup ASC NULLS LAST;
