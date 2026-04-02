-- ################################################################################
-- # CRM RESTRUCTURING SCRIPT - LEADS TABLE (FIXED VERSION)
-- ################################################################################
-- # Este script consolida todos os campos de status (booleanos legados) 
-- # na coluna 'stage' e limpa a estrutura para o novo sistema.
-- ################################################################################

-- 1. Garantir que os valores do ENUM 'lead_stage' existam (se for enum)
-- Tenta adicionar os valores novos ao tipo se ele já for um ENUM
DO $$ 
BEGIN
    -- Se o tipo existir, garantimos os valores
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'ligacao_feita';
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'video_enviado';
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'fechamento_marcado';
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'diagnostico_marcado';
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'follow_up';
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'interessado';
    ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'canal_aberto';
EXCEPTION
    WHEN undefined_object THEN
        -- Se o tipo não existir, ignoramos pois usaremos TEXT
        NULL;
END $$;

-- 2. Garantir que as colunas existam
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='stage') THEN
        ALTER TABLE public.leads ADD COLUMN stage text DEFAULT 'novo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='temperatura') THEN
        ALTER TABLE public.leads ADD COLUMN temperatura text DEFAULT 'frio';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='proximo_followup') THEN
        ALTER TABLE public.leads ADD COLUMN proximo_followup timestamptz DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='ultimo_contato') THEN
        ALTER TABLE public.leads ADD COLUMN ultimo_contato timestamptz DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='tentativas_followup') THEN
        ALTER TABLE public.leads ADD COLUMN tentativas_followup int DEFAULT 0;
    END IF;
END $$;

-- 3. Migrar dados dos booleanos legados para a coluna 'stage'
-- Usamos um CAST (::public.lead_stage) se for enum, senão funciona como TEXT
UPDATE public.leads 
SET stage = (CASE
    WHEN negocio_fechado = true THEN 'negocio_fechado'
    WHEN negocio_perdido = true THEN 'negocio_perdido'
    WHEN fechamento_marcado = true THEN 'fechamento_marcado'
    WHEN diagnostico_marcado = true THEN 'diagnostico_marcado'
    WHEN follow_up = true THEN 'follow_up'
    WHEN interessado = true THEN 'interessado'
    WHEN "Documento/proposta Enviada" = true THEN 'video_enviado'
    WHEN "Apresentação criada" = true THEN 'ligacao_feita'
    WHEN canal_aberto = true THEN 'canal_aberto'
    ELSE 'novo'
END)::text::public.lead_stage
WHERE (stage::text = 'novo' OR stage IS NULL);

-- 4. Criar View de Follow-up 
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
  stage::text NOT IN ('negocio_fechado', 'negocio_perdido')
  AND (proximo_followup IS NULL OR proximo_followup <= (now() AT TIME ZONE 'UTC'))
ORDER BY
  CASE temperatura WHEN 'quente' THEN 1 WHEN 'morno' THEN 2 ELSE 3 END,
  proximo_followup ASC NULLS LAST;

