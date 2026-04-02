import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Lead, LeadStatus, KANBAN_COLUMNS, STATUS_CONFIG, deriveLeadStatus } from '@/types/leads';
import { KanbanColumn } from './KanbanColumn';
import { LeadCard } from './LeadCard';
import { useUpdateLeadStatus } from '@/hooks/useLeads';
import { LeadCategoryMap } from '@/hooks/useLeadExtrasBulk';

export interface ColumnConfig {
  slug: string;
  label: string;
  color: string;
}

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  columns?: ColumnConfig[];
  categoryMap?: LeadCategoryMap;
}

export function KanbanBoard({ leads, onLeadClick, columns, categoryMap = {} }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateStatus = useUpdateLeadStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const effectiveColumns = columns && columns.length > 0
    ? columns
    : KANBAN_COLUMNS.map(s => ({ slug: s, label: STATUS_CONFIG[s].label, color: STATUS_CONFIG[s].color }));

  const getLeadsByStatus = useCallback(
    (slug: string) =>
      leads.filter((lead) => deriveLeadStatus(lead) === slug),
    [leads]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentStatus = deriveLeadStatus(lead);
    if (currentStatus === newStatus) return;

    updateStatus.mutate({ id: leadId, status: newStatus, currentStage: currentStatus });
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)]">
        {effectiveColumns.map((col) => (
          <KanbanColumn
            key={col.slug}
            status={col.slug as LeadStatus}
            leads={getLeadsByStatus(col.slug)}
            config={{ label: col.label, color: col.color }}
            onLeadClick={onLeadClick}
            categoryMap={categoryMap}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <div className="kanban-card opacity-90 shadow-lg rotate-3">
            <LeadCard lead={activeLead} onClick={() => {}} category={categoryMap[activeLead.id]} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
