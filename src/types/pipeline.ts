export interface Pipeline {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineColumn {
  id: string;
  pipeline_id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  created_at: string;
}

export interface Task {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export type CategoriaLead = 'lead_a' | 'lead_b' | 'lead_c';

export const CATEGORIA_LEAD_CONFIG: Record<CategoriaLead, { label: string; description: string; color: string }> = {
  lead_a: { label: 'Lead A', description: 'Tem dinheiro para investir e alto nível de consciência', color: 'text-green-500' },
  lead_b: { label: 'Lead B', description: 'Parece ter dinheiro, mas sem nível de consciência', color: 'text-yellow-500' },
  lead_c: { label: 'Lead C', description: 'Sem muito dinheiro, só cabe soluções mais baratas', color: 'text-red-500' },
};

export interface LeadExtras {
  id: string;
  lead_id: string;
  cidade: string | null;
  nicho_negocio: string | null;
  observacao: string | null;
  categoria_lead: CategoriaLead | null;
  created_at: string;
  updated_at: string;
}
