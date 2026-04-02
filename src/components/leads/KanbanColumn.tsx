import { useDroppable } from '@dnd-kit/core';
import { Lead, LeadStatus } from '@/types/leads';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';
import { LeadCategoryMap } from '@/hooks/useLeadExtrasBulk';

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  config: { label: string; color: string };
  onLeadClick: (lead: Lead) => void;
  categoryMap?: LeadCategoryMap;
}

export function KanbanColumn({ status, leads, config, onLeadClick, categoryMap = {} }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'kanban-column transition-all duration-200',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('status-badge', config.color)}>
            {config.label}
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {leads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground/50 text-center">
              Nenhum lead
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
              category={categoryMap[lead.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}
