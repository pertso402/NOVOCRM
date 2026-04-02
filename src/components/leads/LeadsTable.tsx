import { useState, useMemo } from 'react';
import { Lead, STATUS_CONFIG, deriveLeadStatus, KANBAN_COLUMNS, TEMPERATURA_CONFIG } from '@/types/leads';
import { CategoriaLead, CATEGORIA_LEAD_CONFIG } from '@/types/pipeline';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { BulkActionsBar } from './BulkActionsBar';
import { useBulkDeleteLeads } from '@/hooks/useBulkDeleteLeads';
import { ColumnConfig } from './KanbanBoard';
import { LeadCategoryMap } from '@/hooks/useLeadExtrasBulk';

interface LeadsTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  columns?: ColumnConfig[];
  categoryMap?: LeadCategoryMap;
}

type SortField = 'nome_negocio' | 'created_at' | 'status' | 'temperatura' | 'proximo_followup';
type SortDirection = 'asc' | 'desc';

export function LeadsTable({ leads, onLeadClick, columns, categoryMap = {} }: LeadsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('proximo_followup');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const bulkDelete = useBulkDeleteLeads();

  const effectiveColumns = columns && columns.length > 0
    ? columns
    : KANBAN_COLUMNS.map(s => ({ slug: s, label: STATUS_CONFIG[s].label, color: STATUS_CONFIG[s].color }));

  const columnMap = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {};
    effectiveColumns.forEach(c => { map[c.slug] = { label: c.label, color: c.color }; });
    return map;
  }, [effectiveColumns]);

  const getStatusConfig = (slug: string) =>
    columnMap[slug] || STATUS_CONFIG[slug as keyof typeof STATUS_CONFIG] || { label: slug, color: 'status-progress' };

  const ordemTemp: Record<string, number> = { quente: 0, morno: 1, frio: 2 };

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.nome_negocio?.toLowerCase().includes(q) ||
        l.nome_decisor?.toLowerCase().includes(q) ||
        l.whats?.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(l => deriveLeadStatus(l) === statusFilter);
    }

    if (tempFilter !== 'all') {
      result = result.filter(l => (l.temperatura || 'frio') === tempFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'nome_negocio':
          comparison = (a.nome_negocio || '').localeCompare(b.nome_negocio || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = deriveLeadStatus(a).localeCompare(deriveLeadStatus(b));
          break;
        case 'temperatura':
          comparison = (ordemTemp[a.temperatura || 'frio'] ?? 2) - (ordemTemp[b.temperatura || 'frio'] ?? 2);
          break;
        case 'proximo_followup':
          const aF = a.proximo_followup ? new Date(a.proximo_followup).getTime() : Infinity;
          const bF = b.proximo_followup ? new Date(b.proximo_followup).getTime() : Infinity;
          comparison = aF - bF;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, search, statusFilter, tempFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDelete.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, decisor ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-secondary/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {effectiveColumns.map(col => (
              <SelectItem key={col.slug} value={col.slug}>{col.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tempFilter} onValueChange={setTempFilter}>
          <SelectTrigger className="w-[140px] bg-secondary/50">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌡️ Todas</SelectItem>
            <SelectItem value="quente">🔥 Quente</SelectItem>
            <SelectItem value="morno">🌡️ Morno</SelectItem>
            <SelectItem value="frio">🧊 Frio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredLeads.length > 0 && selectedIds.size === filteredLeads.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 h-auto font-medium" onClick={() => handleSort('nome_negocio')}>
                  Negócio <SortIcon field="nome_negocio" />
                </Button>
              </TableHead>
              <TableHead>Decisor</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 h-auto font-medium" onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 h-auto font-medium" onClick={() => handleSort('temperatura')}>
                  Temp. <SortIcon field="temperatura" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 h-auto font-medium" onClick={() => handleSort('proximo_followup')}>
                  <Clock className="w-3.5 h-3.5 mr-1 inline" />Próx. Contato <SortIcon field="proximo_followup" />
                </Button>
              </TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 h-auto font-medium" onClick={() => handleSort('created_at')}>
                  Data <SortIcon field="created_at" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum lead encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => {
                const status = deriveLeadStatus(lead);
                const config = getStatusConfig(status);
                const tempCfg = TEMPERATURA_CONFIG[lead.temperatura || 'frio'];
                const isSelected = selectedIds.has(lead.id);
                const atrasado = lead.proximo_followup && isPast(new Date(lead.proximo_followup));

                return (
                  <TableRow
                    key={lead.id}
                    className={cn('cursor-pointer', isSelected && 'bg-primary/5')}
                    onClick={() => onLeadClick(lead)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => {
                          const newSet = new Set(selectedIds);
                          if (isSelected) newSet.delete(lead.id); else newSet.add(lead.id);
                          setSelectedIds(newSet);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lead.nome_negocio || '-'}</TableCell>
                    <TableCell>{lead.nome_decisor || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{lead.whats || '-'}</TableCell>
                    <TableCell>
                      <span className={cn('status-badge', config.color)}>{config.label}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-sm font-medium', tempCfg.color)}>
                        {tempCfg.emoji} {tempCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {lead.proximo_followup ? (
                        <span className={cn('text-sm', atrasado ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                          {atrasado ? '⚠️ ' : ''}{format(new Date(lead.proximo_followup), 'dd/MM HH:mm')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const cat = categoryMap[lead.id] as CategoriaLead | undefined;
                        if (!cat) return <span className="text-muted-foreground text-sm">-</span>;
                        const colors: Record<CategoriaLead, string> = {
                          lead_a: 'bg-green-500/15 text-green-500',
                          lead_b: 'bg-red-500/15 text-red-500',
                          lead_c: 'bg-yellow-500/15 text-yellow-500',
                        };
                        return (
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', colors[cat])}>
                            {CATEGORIA_LEAD_CONFIG[cat].label}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={handleBulkDelete}
        isDeleting={bulkDelete.isPending}
      />
    </div>
  );
}
