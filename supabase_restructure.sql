-- ################################################################################
-- # CRM RESTRUCTURING SCRIPT - LEADS TABLE
-- ################################################################################
-- # Este script consolida todos os campos de status (booleanos legados) 
-- # na coluna 'stage' e limpa a estrutura para o novo sistema.
-- ################################################################################

-- 1. Garantir que a coluna 'stage' e 'temperatura' existam
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

-- 2. Migrar dados dos booleanos legados para a coluna 'stage'
-- Só atualiza se o stage for 'novo' ou nulo, para não sobrepor dados já migrados.
UPDATE public.leads 
SET stage = CASE
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
END
WHERE stage = 'novo' OR stage IS NULL;

-- 3. Limpeza de campos legados (OPCIONAL - DESCOMENTE SE TIVER CERTEZA)
-- Para manter a segurança, vamos apenas renomear para 'old_' em vez de deletar.
-- ALTER TABLE public.leads RENAME COLUMN canal_aberto TO z_old_canal_aberto;
-- ALTER TABLE public.leads RENAME COLUMN interessado TO z_old_interessado;
-- ALTER TABLE public.leads RENAME COLUMN follow_up TO z_old_follow_up;
-- ALTER TABLE public.leads RENAME COLUMN diagnostico_marcado TO z_old_diagnostico_marcado;
-- ALTER TABLE public.leads RENAME COLUMN fechamento_marcado TO z_old_fechamento_marcado;
-- ALTER TABLE public.leads RENAME COLUMN negocio_fechado TO z_old_negocio_fechado;
-- ALTER TABLE public.leads RENAME COLUMN negocio_perdido TO z_old_negocio_perdido;
-- ALTER TABLE public.leads RENAME COLUMN "Apresentação criada" TO "z_old_apresentacao_criada";
-- ALTER TABLE public.leads RENAME COLUMN "Documento/proposta Enviada" TO "z_old_proposta_enviada";

-- 4. Criar View de Follow-up (se não existir)
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
  AND (proximo_followup IS NULL OR proximo_followup <= (now() AT TIME ZONE 'UTC'))
ORDER BY
  CASE temperatura WHEN 'quente' THEN 1 WHEN 'morno' THEN 2 ELSE 3 END,
  proximo_followup ASC NULLS LAST;

-- 5. Mensagem de sucesso
-- SQL executado com sucesso!
