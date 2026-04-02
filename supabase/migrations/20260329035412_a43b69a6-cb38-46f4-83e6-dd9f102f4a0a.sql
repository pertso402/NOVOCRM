CREATE TABLE public.lead_stage_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id text NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on lead_stage_history"
ON public.lead_stage_history
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE INDEX idx_lead_stage_history_lead_id ON public.lead_stage_history(lead_id);
CREATE INDEX idx_lead_stage_history_changed_at ON public.lead_stage_history(changed_at);
CREATE INDEX idx_lead_stage_history_to_stage ON public.lead_stage_history(to_stage);