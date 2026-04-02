export type LeadStatus =
  | 'novo'
  | 'canal_aberto'
  | 'ligacao_feita'
  | 'video_enviado'
  | 'interessado'
  | 'follow_up'
  | 'diagnostico_marcado'
  | 'fechamento_marcado'
  | 'negocio_fechado'
  | 'negocio_perdido';

export type Temperatura = 'frio' | 'morno' | 'quente';

export type Niche = 'delivery' | 'multimarcas' | 'site';

export interface Lead {
  id: string;
  nome_negocio: string;
  nome_decisor: string | null;
  whats: string | null;
  telefone?: string | null;
  instagram?: string | null;
  url_whats?: string | null;
  url_video?: string | null;
  hora_envio?: string | null;
  niche: Niche;
  script_id: string | null;
  script_usado_text?: string | null;

  // Única fonte de verdade do estágio
  stage: LeadStatus;

  // Temperatura para follow-up inteligente
  temperatura: Temperatura;

  // Campos de follow-up
  proximo_followup: string | null;
  tentativas_followup: number;
  ultimo_contato: string | null;

  // Campos de fechamento/perda
  motivo_perca: Record<string, any> | null;
  motivo_ganho: Record<string, any> | null;
  obs?: string | null;

  // Booleans legados — mantidos apenas para compatibilidade de leitura
  canal_aberto?: boolean;
  interessado?: boolean;
  follow_up?: boolean;
  diagnostico_marcado?: boolean;
  fechamento_marcado?: boolean;
  negocio_fechado?: boolean;
  negocio_perdido?: boolean;

  created_at: string;
  updated_at?: string;
}

export interface Script {
  id: string;
  nome: string;
  niche: Niche;
  versao: string;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MetricsByScript {
  script_id: string;
  script_nome: string;
  niche: Niche;
  total_leads: number;
  taxa_canal_aberto: number;
  taxa_ligacao_feita: number;
  taxa_video_enviado: number;
  taxa_diagnostico_marcado: number;
  taxa_negocio_fechado: number;
}

export const TEMPERATURA_CONFIG: Record<Temperatura, { label: string; color: string; emoji: string }> = {
  frio:   { label: 'Frio',    color: 'text-blue-400',   emoji: '🧊' },
  morno:  { label: 'Morno',   color: 'text-yellow-400', emoji: '🌡️' },
  quente: { label: 'Quente',  color: 'text-red-400',    emoji: '🔥' },
};

export const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  novo:                { label: 'Novo',               color: 'status-new'      },
  canal_aberto:        { label: 'Canal Aberto',        color: 'status-open'     },
  ligacao_feita:       { label: 'Ligação Feita',       color: 'status-progress' },
  video_enviado:       { label: 'Vídeo Enviado',       color: 'status-progress' },
  interessado:         { label: 'Interessado',         color: 'status-progress' },
  follow_up:           { label: 'Follow-up',           color: 'status-progress' },
  diagnostico_marcado: { label: 'Diagnóstico Marcado', color: 'status-progress' },
  fechamento_marcado:  { label: 'Fechamento Marcado',  color: 'status-progress' },
  negocio_fechado:     { label: 'Negócio Fechado',     color: 'status-success'  },
  negocio_perdido:     { label: 'Negócio Perdido',     color: 'status-lost'     },
};

export const KANBAN_COLUMNS: LeadStatus[] = [
  'novo',
  'canal_aberto',
  'ligacao_feita',
  'video_enviado',
  'interessado',
  'follow_up',
  'diagnostico_marcado',
  'fechamento_marcado',
  'negocio_fechado',
  'negocio_perdido',
];

// Única fonte de verdade — usa apenas o campo stage
export function deriveLeadStatus(lead: Lead): LeadStatus {
  const validStatuses: LeadStatus[] = [
    'novo', 'canal_aberto', 'ligacao_feita', 'video_enviado',
    'interessado', 'follow_up', 'diagnostico_marcado',
    'fechamento_marcado', 'negocio_fechado', 'negocio_perdido',
  ];
  if (lead.stage && validStatuses.includes(lead.stage as LeadStatus)) {
    return lead.stage as LeadStatus;
  }
  return 'novo';
}

// Calcula próximo follow-up baseado em temperatura e tentativas
export function calcularProximoFollowup(
  stage: LeadStatus,
  temperatura: Temperatura,
  tentativas: number
): Date | null {
  if (stage === 'negocio_fechado' || stage === 'negocio_perdido') return null;

  const diasPorTemperatura: Record<Temperatura, number[]> = {
    quente: [1, 2, 3],
    morno:  [2, 4, 7],
    frio:   [3, 7, 15],
  };

  const cadencia = diasPorTemperatura[temperatura];
  const diasAdicionar = cadencia[Math.min(tentativas, cadencia.length - 1)];

  const proximo = new Date();
  proximo.setDate(proximo.getDate() + diasAdicionar);
  return proximo;
}
