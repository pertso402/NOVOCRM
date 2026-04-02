import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard } from '@/components/leads/KanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsPipeline } from '@/components/leads/LeadsPipeline';
import { LeadsCalendar } from '@/components/leads/LeadsCalendar';
import { LeadDetailsDrawer } from '@/components/leads/LeadDetailsDrawer';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { CategoryFilter } from '@/components/leads/CategoryFilter';
import { WeeklyGoalBar } from '@/components/leads/WeeklyGoalBar';
import { useLeads } from '@/hooks/useLeads';
import { useLeadExtrasBulk } from '@/hooks/useLeadExtrasBulk';
import { usePipelineBySlug, usePipelineColumns } from '@/hooks/usePipelines';
import { Lead, Niche } from '@/types/leads';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LayoutGrid, List, BarChart3, Calendar, Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LeadsPage() {
  const { niche } = useParams<{ niche: string }>();
  const nicheValue = (niche === 'multimarcas' ? 'multimarcas' : niche === 'site' ? 'site' : 'delivery') as Niche;
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [horaEnvioFilter, setHoraEnvioFilter] = useState('all');

  const { data: leads, isLoading, error } = useLeads(nicheValue);
  const pipeline = usePipelineBySlug(niche);
  const { data: pipelineColumns } = usePipelineColumns(pipeline?.id);

  const leadIds = useMemo(() => (leads || []).map(l => l.id), [leads]);
  const { data: categoryMap } = useLeadExtrasBulk(leadIds);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = leads;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.nome_negocio?.toLowerCase().includes(q) ||
        l.nome_decisor?.toLowerCase().includes(q) ||
        l.whats?.includes(searchQuery) ||
        l.instagram?.toLowerCase().includes(q)
      );
    }
    
    // Category filter
    if (categoryFilter === 'none') {
      result = result.filter(l => !categoryMap?.[l.id]);
    } else if (categoryFilter !== 'all') {
      result = result.filter(l => categoryMap?.[l.id] === categoryFilter);
    }
    
    // Hora envio filter
    if (horaEnvioFilter !== 'all') {
      result = result.filter(l => (l.hora_envio || 'noite') === horaEnvioFilter);
    }
    
    return result;
  }, [leads, categoryFilter, categoryMap, searchQuery, horaEnvioFilter]);

  const nicheLabel = nicheValue === 'delivery' ? 'Delivery' : nicheValue === 'site' ? 'Site' : 'Multimarcas';

  const dynamicColumns = pipelineColumns?.map(col => ({
    slug: col.slug,
    label: col.name,
    color: col.color || 'status-progress',
  })) || [];

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
  };

  if (isLoading) {
    return (
      <DashboardLayout title={`Leads - ${nicheLabel}`}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title={`Leads - ${nicheLabel}`}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-destructive mb-2">Erro ao carregar leads</p>
            <p className="text-muted-foreground text-sm">
              Verifique se as tabelas existem no banco de dados
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Leads - ${nicheLabel}`}
      subtitle={`${filteredLeads.length} leads encontrados`}
    >
      <WeeklyGoalBar pipelineSlug={nicheValue} />

      <Tabs defaultValue="kanban" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-secondary/50 border-border/50"
              />
            </div>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <List className="w-4 h-4" />
                Tabela
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendário
              </TabsTrigger>
            </TabsList>

            <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

            <Select value={horaEnvioFilter} onValueChange={setHoraEnvioFilter}>
              <SelectTrigger className="w-40 bg-secondary/50 border-border/50">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Horário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos horários</SelectItem>
                <SelectItem value="manha">☀️ Manhã</SelectItem>
                <SelectItem value="noite">🌙 Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CreateLeadDialog niche={nicheValue} />
        </div>

        <TabsContent value="kanban" className="mt-0">
          <KanbanBoard leads={filteredLeads} onLeadClick={handleLeadClick} columns={dynamicColumns} categoryMap={categoryMap || {}} />
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <LeadsTable leads={filteredLeads} onLeadClick={handleLeadClick} columns={dynamicColumns} categoryMap={categoryMap || {}} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
          <LeadsPipeline leads={filteredLeads} columns={dynamicColumns} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <LeadsCalendar leads={filteredLeads} />
        </TabsContent>
      </Tabs>

      <LeadDetailsDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </DashboardLayout>
  );
}
