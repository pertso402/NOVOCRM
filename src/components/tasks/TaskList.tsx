import { useState } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Trash2, 
  Plus,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Task } from '@/types/pipeline';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TaskListProps {
  leadId: string;
  leadName?: string;
}

export function TaskList({ leadId, leadName }: TaskListProps) {
  const { data: tasks, isLoading } = useTasks(leadId);
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const pendingTasks = tasks?.filter(t => !t.completed) || [];
  const completedTasks = tasks?.filter(t => t.completed) || [];

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

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Carregando tarefas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Tarefas</h4>
        <CreateTaskDialog leadId={leadId} />
      </div>

      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma tarefa cadastrada</p>
      ) : (
        <div className="space-y-3">
          {/* Pending tasks */}
          {pendingTasks.map((task) => {
            const dueDateInfo = getDueDateInfo(task.due_date);
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <button
                  onClick={() => toggleTask.mutate({ id: task.id, completed: true })}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(task.priority)}
                    <span className="font-medium">{task.title}</span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {dueDateInfo && (
                    <div className={cn('flex items-center gap-1 text-xs mt-1', dueDateInfo.className)}>
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
          })}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Concluídas ({completedTasks.length})</p>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                >
                  <button
                    onClick={() => toggleTask.mutate({ id: task.id, completed: false })}
                    className="mt-0.5 text-success hover:text-muted-foreground transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <span className="flex-1 text-muted-foreground line-through">{task.title}</span>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateTaskDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const createTask = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createTask.mutate(
      {
        lead_id: leadId,
        title: formData.title,
        description: formData.description || null,
        due_date: formData.due_date || null,
        priority: formData.priority,
        completed: false,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormData({
            title: '',
            description: '',
            due_date: '',
            priority: 'medium',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Plus className="w-4 h-4 mr-1" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Título *</Label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Ligar para o cliente"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createTask.isPending}>
            Criar Tarefa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
