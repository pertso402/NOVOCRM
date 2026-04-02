import { useMemo } from 'react';
import { Lead, STATUS_CONFIG, deriveLeadStatus, LeadStatus, KANBAN_COLUMNS } from '@/types/leads';
import { cn } from '@/lib/utils';
import { ColumnConfig } from './KanbanBoard';

interface LeadsPipelineProps {
  leads: Lead[];
  columns?: ColumnConfig[];
}

export function LeadsPipeline({ leads, columns }: LeadsPipelineProps) {
  const effectiveColumns = columns && columns.length > 0
    ? columns
    : KANBAN_COLUMNS.map(s => ({ slug: s, label: STATUS_CONFIG[s].label, color: STATUS_CONFIG[s].color }));

  const pipelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveColumns.forEach((col) => { counts[col.slug] = 0; });

    leads.forEach((lead) => {
      const status = deriveLeadStatus(lead);
      if (counts[status] !== undefined) counts[status]++;
    });

    const total = leads.length || 1;
    
    return effectiveColumns.map((col, index) => {
      const count = counts[col.slug] || 0;
      const percentage = (count / total) * 100;
      const prevCount = index > 0 ? (counts[effectiveColumns[index - 1].slug] || 0) : total;
      const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;

      return {
        slug: col.slug,
        count,
        percentage,
        conversionRate,
        label: col.label,
        color: col.color,
      };
    });
  }, [leads, effectiveColumns]);

  const maxCount = Math.max(...pipelineData.map((d) => d.count), 1);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-6">Pipeline de Conversão</h3>
      
      <div className="space-y-4">
        {pipelineData.map((item, index) => (
          <div key={item.slug} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn('status-badge', item.color)}>
                {item.label}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {item.count} leads
                </span>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground/70">
                    {item.conversionRate.toFixed(1)}% conv.
                  </span>
                )}
              </div>
            </div>
            
            <div className="h-8 bg-secondary/50 rounded-lg overflow-hidden relative">
              <div
                className={cn(
                  'h-full rounded-lg transition-all duration-500',
                  item.slug === 'negocio_fechado' && 'bg-success',
                  item.slug === 'negocio_perdido' && 'bg-destructive',
                  !['negocio_fechado', 'negocio_perdido'].includes(item.slug) && 'bg-primary'
                )}
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
