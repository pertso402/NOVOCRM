
-- Add valor_venda and data_fechamento to lead_extras
ALTER TABLE public.lead_extras 
  ADD COLUMN IF NOT EXISTS valor_venda numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_fechamento timestamp with time zone DEFAULT NULL;

-- Create payments table for installment tracking
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento timestamp with time zone,
  data_pagamento timestamp with time zone,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on payments" ON public.payments FOR ALL TO public USING (true) WITH CHECK (true);

-- Create weekly_goals table
CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_slug text NOT NULL,
  meta_valor numeric NOT NULL DEFAULT 3750,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(pipeline_slug)
);

ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on weekly_goals" ON public.weekly_goals FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert default goal for delivery
INSERT INTO public.weekly_goals (pipeline_slug, meta_valor) VALUES ('delivery', 3750) ON CONFLICT (pipeline_slug) DO NOTHING;
