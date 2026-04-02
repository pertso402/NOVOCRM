import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isPast, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Trash2,
  AlertCircle,
  Clock,
  Filter,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAllTasks, useToggleTask, useDeleteTask } from '@/hooks/useTasks';
import { usePipelines, usePipelineColumns } from '@/hooks/usePipelines';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { externalSupabase } from '@/lib/externalSupabase';
import { Lead, STATUS_CONFIG, deriveLeadStatus } from '@/types/leads';

function useAllLeads() {
  return useQuery({
    queryKey: ['all-leads-for-tasks'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('leads')
        .select('*');
      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 60_000,
  });
}

export default function TasksPage() {
  const { data: tasks, isLoading } = useAllTasks();
  const { data: leads } = useAllLeads();
  const { data: pipelines } = usePipelines();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const leadsMap = useMemo(() => {
    const map = new Map<string, Lead>();
    leads?.forEach(l => map.set(l.id, l));
    return map;
  }, [leads]);

  const pipelinesMap = useMemo(() => {
    const map = new Map<string, string>();
    pipelines?.forEach(p => map.set(p.slug, p.name));
    return map;
  }, [pipelines]);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const pendingTasks = tasks?.filter(t => !t.completed) || [];
  const completedTasks = tasks?.filter(t => t.completed) || [];

  const overdueTasks = pendingTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
  const todayTasks = pendingTasks.filter(t => t.due_date && isToday(new Date(t.due_date)));
  const upcomingTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) >= tomorrow && new Date(t.due_date) < nextWeek);
  const laterTasks = pendingTasks.filter(t => !t.due_date || new Date(t.due_date) >= nextWeek);

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    
    if (isPast(date) && !isToday(date)) {
      return { label: 'Atrasada', className: 'text-destructive' };
    }
    if (isToday(date)) {
      return { label: 'Hoje', className: 'text-warning' };
    }
    if (isTomorrow(date)) {
      return { label: 'Amanhã', className: 'text-primary' };
    }
    return { 
      label: format(date, "dd 'de' MMM", { locale: ptBR }), 
      className: 'text-muted-foreground' 
    };
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStageLabel = (lead: Lead) => {
    const status = deriveLeadStatus(lead);
    const config = STATUS_CONFIG[status];
    return config?.label || status;
  };

  const TaskItem = ({ task }: { task: typeof pendingTasks[0] }) => {
    const dueDateInfo = getDueDateInfo(task.due_date);
    const lead = leadsMap.get(task.lead_id);
    const pipelineName = lead ? pipelinesMap.get(lead.niche) || lead.niche : null;

    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
        <button
          onClick={() => toggleTask.mutate({ id: task.id, completed: !task.completed })}
          className={cn(
            "mt-0.5 transition-colors",
            task.completed 
              ? "text-success hover:text-muted-foreground" 
              : "text-muted-foreground hover:text-primary"
          )}
        >
          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {getPriorityIcon(task.priority)}
            <span className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
              {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Lead info row */}
          {lead && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="font-medium text-foreground">{lead.nome_negocio}</span>
              </div>
              {pipelineName && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {pipelineName}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <MapPin className="w-3 h-3 mr-1" />
                {getStageLabel(lead)}
              </Badge>
              {lead.nome_decisor && (
                <span className="text-xs text-muted-foreground">
                  Decisor: {lead.nome_decisor}
                </span>
              )}
              {lead.whats && (
                <span className="text-xs text-muted-foreground">
                  📱 {lead.whats}
                </span>
              )}
              {lead.url_whats && (
                <a
                  href={lead.url_whats}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir WhatsApp
                </a>
              )}
            </div>
          )}

          {dueDateInfo && (
            <div className={cn('flex items-center gap-1 text-xs mt-2', dueDateInfo.className)}>
              <Calendar className="w-3 h-3" />
              {dueDateInfo.label}
            </div>
          )}
        </div>
        <button
          onClick={() => deleteTask.mutate(task.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const TaskSection = ({ title, tasks, icon }: { title: string; tasks: typeof pendingTasks; icon?: React.ReactNode }) => {
    if (tasks.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title} ({tasks.length})
        </div>
        <div className="space-y-2">
          {tasks.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Tarefas" subtitle="Gerencie suas tarefas">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground">Carregando tarefas...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Tarefas" 
      subtitle={`${pendingTasks.length} pendentes • ${completedTasks.length} concluídas`}
    >
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Filter className="w-4 h-4" />
            Pendentes ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Concluídas ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {pendingTasks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tarefa pendente!</h3>
              <p className="text-muted-foreground">
                Crie tarefas a partir dos detalhes de cada lead.
              </p>
            </div>
          ) : (
            <>
              <TaskSection 
                title="Atrasadas" 
                tasks={overdueTasks} 
                icon={<AlertCircle className="w-4 h-4 text-destructive" />}
              />
              <TaskSection 
                title="Hoje" 
                tasks={todayTasks}
                icon={<Calendar className="w-4 h-4 text-warning" />}
              />
              <TaskSection 
                title="Próximos 7 dias" 
                tasks={upcomingTasks}
                icon={<Calendar className="w-4 h-4 text-primary" />}
              />
              <TaskSection 
                title="Depois / Sem data" 
                tasks={laterTasks}
                icon={<Clock className="w-4 h-4" />}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tarefa concluída</h3>
              <p className="text-muted-foreground">
                Complete suas tarefas para vê-las aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedTasks.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
