-- 1) Tabela de Pipelines customizáveis
CREATE TABLE public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir pipelines padrão
INSERT INTO public.pipelines (name, slug, icon, color) VALUES
  ('Delivery', 'delivery', 'truck', 'primary'),
  ('Multimarcas', 'multimarcas', 'building2', 'accent'),
  ('Site', 'site', 'globe', 'emerald');

-- 2) Tabela de Colunas/Status customizáveis por pipeline
CREATE TABLE public.pipeline_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT 'secondary',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir colunas padrão para cada pipeline
INSERT INTO public.pipeline_columns (pipeline_id, name, slug, color, position)
SELECT p.id, col.name, col.slug, col.color, col.position
FROM public.pipelines p
CROSS JOIN (VALUES
  ('Novo', 'novo', 'status-new', 0),
  ('Canal Aberto', 'canal_aberto', 'status-open', 1),
  ('Ligação Feita', 'ligacao_feita', 'status-progress', 2),
  ('Vídeo Enviado', 'video_enviado', 'status-progress', 3),
  ('Interessado', 'interessado', 'status-progress', 4),
  ('Follow-up', 'follow_up', 'status-progress', 5),
  ('Diagnóstico Marcado', 'diagnostico_marcado', 'status-progress', 6),
  ('Fechamento Marcado', 'fechamento_marcado', 'status-progress', 7),
  ('Negócio Fechado', 'negocio_fechado', 'status-success', 8),
  ('Negócio Perdido', 'negocio_perdido', 'status-lost', 9)
) AS col(name, slug, color, position);

-- 3) Tabela de Tarefas vinculadas a leads
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Tabela de campos extras para leads (cidade, nicho do negócio)
CREATE TABLE public.lead_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL UNIQUE,
  cidade TEXT,
  nicho_negocio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_extras ENABLE ROW LEVEL SECURITY;

-- Policies para acesso público (sem auth por enquanto, como o DB externo)
CREATE POLICY "Allow all operations on pipelines" ON public.pipelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pipeline_columns" ON public.pipeline_columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lead_extras" ON public.lead_extras FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipelines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_extras;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lead_extras_updated_at BEFORE UPDATE ON public.lead_extras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();