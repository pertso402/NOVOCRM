import { useDraggable } from '@dnd-kit/core';
import { Lead, TEMPERATURA_CONFIG } from '@/types/leads';
import { CategoriaLead, CATEGORIA_LEAD_CONFIG } from '@/types/pipeline';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';

const CATEGORY_BORDER_COLORS: Record<CategoriaLead, string> = {
  lead_a: 'border-l-green-500',
  lead_b: 'border-l-red-500',
  lead_c: 'border-l-yellow-500',
};

const CATEGORY_BG_COLORS: Record<CategoriaLead, string> = {
  lead_a: 'bg-green-500/10',
  lead_b: 'bg-red-500/10',
  lead_c: 'bg-yellow-500/10',
};

const CATEGORY_TEXT_COLORS: Record<CategoriaLead, string> = {
  lead_a: 'text-green-500',
  lead_b: 'text-red-500',
  lead_c: 'text-yellow-500',
};

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  category?: CategoriaLead | null;
}

export function LeadCard({ lead, onClick, category }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const tempCfg = TEMPERATURA_CONFIG[lead.temperatura || 'frio'];
  const followupAtrasado = lead.proximo_followup && isPast(new Date(lead.proximo_followup));
  const followupHoje = lead.proximo_followup && !isPast(new Date(lead.proximo_followup)) &&
    format(new Date(lead.proximo_followup), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'kanban-card animate-fade-in border-l-4',
        category ? CATEGORY_BORDER_COLORS[category] : 'border-l-transparent',
        isDragging && 'dragging'
      )}
    >
      {/* Category badge */}
      {category && (
        <div className="mb-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
            CATEGORY_BG_COLORS[category],
            CATEGORY_TEXT_COLORS[category],
          )}>
            {CATEGORIA_LEAD_CONFIG[category].label}
          </span>
        </div>
      )}

      {/* Nome e temperatura */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-sm leading-tight flex-1">{lead.nome_negocio}</p>
        <span className={cn('text-xs shrink-0', tempCfg.color)} title={`Temperatura: ${tempCfg.label}`}>
          {tempCfg.emoji}
        </span>
      </div>

      {lead.nome_decisor && (
        <p className="text-xs text-muted-foreground mb-2">{lead.nome_decisor}</p>
      )}

      {/* Follow-up indicator */}
      {lead.proximo_followup && (
        <div className={cn(
          'flex items-center gap-1 text-[10px] mt-1.5 px-1.5 py-0.5 rounded',
          followupAtrasado ? 'bg-destructive/15 text-destructive' : followupHoje ? 'bg-yellow-500/15 text-yellow-600' : 'bg-secondary/50 text-muted-foreground'
        )}>
          <Clock className="w-2.5 h-2.5" />
          {followupAtrasado ? 'Follow-up atrasado' : followupHoje ? 'Follow-up hoje' : format(new Date(lead.proximo_followup), 'dd/MM')}
        </div>
      )}

      {/* Tentativas */}
      {(lead.tentativas_followup || 0) > 0 && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {lead.tentativas_followup} contato{lead.tentativas_followup !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
