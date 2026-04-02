import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Folder, Truck, Building2, Globe, Layers, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { usePipelines, useCreatePipeline, useUpdatePipeline, useDeletePipeline, usePipelineColumns, useUpdatePipelineColumn, useCreatePipelineColumn, useDeletePipelineColumn } from '@/hooks/usePipelines';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { value: 'folder', icon: Folder, label: 'Pasta' },
  { value: 'truck', icon: Truck, label: 'Caminhão' },
  { value: 'building2', icon: Building2, label: 'Prédio' },
  { value: 'globe', icon: Globe, label: 'Globo' },
  { value: 'layers', icon: Layers, label: 'Camadas' },
];

const COLOR_OPTIONS = [
  { value: 'primary', label: 'Azul', className: 'bg-primary' },
  { value: 'accent', label: 'Roxo', className: 'bg-accent' },
  { value: 'emerald', label: 'Verde', className: 'bg-emerald-500' },
  { value: 'orange', label: 'Laranja', className: 'bg-orange-500' },
  { value: 'pink', label: 'Rosa', className: 'bg-pink-500' },
];

function PipelineColumnsEditor({ pipelineId }: { pipelineId: string }) {
  const { data: columns, isLoading } = usePipelineColumns(pipelineId);
  const updateColumn = useUpdatePipelineColumn();
  const createColumn = useCreatePipelineColumn();
  const deleteColumn = useDeletePipelineColumn();
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColName, setEditColName] = useState('');
  const [newColName, setNewColName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleStartEditCol = (id: string, name: string) => {
    setEditingColId(id);
    setEditColName(name);
  };

  const handleSaveColEdit = () => {
    if (editingColId && editColName.trim()) {
      updateColumn.mutate({ id: editingColId, updates: { name: editColName.trim() } });
      setEditingColId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveColEdit();
    if (e.key === 'Escape') setEditingColId(null);
  };

  const handleAddColumn = () => {
    if (newColName.trim()) {
      const slug = newColName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const nextPosition = columns?.length ?? 0;
      createColumn.mutate({
        pipeline_id: pipelineId,
        name: newColName.trim(),
        slug,
        color: 'secondary',
        position: nextPosition,
      });
      setNewColName('');
      setIsAdding(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddColumn();
    if (e.key === 'Escape') { setIsAdding(false); setNewColName(''); }
  };

  if (isLoading) return <div className="text-xs text-muted-foreground pl-12 py-2">Carregando fases...</div>;

  return (
    <div className="pl-12 pr-3 pb-3 space-y-1">
      <p className="text-xs text-muted-foreground mb-2">Fases do funil (clique para editar)</p>
      {columns?.map((col, index) => (
        <div key={col.id} className="flex items-center gap-2 group">
          <GripVertical className="w-3 h-3 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
          {editingColId === col.id ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                value={editColName}
                onChange={(e) => setEditColName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveColEdit}>
                <Save className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingColId(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <button
                className="flex-1 text-left text-sm py-1 px-2 rounded hover:bg-secondary/50 transition-colors flex items-center gap-2"
                onClick={() => handleStartEditCol(col.id, col.name)}
              >
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  col.color === 'status-new' && 'bg-blue-400',
                  col.color === 'status-open' && 'bg-cyan-400',
                  col.color === 'status-progress' && 'bg-yellow-400',
                  col.color === 'status-success' && 'bg-green-400',
                  col.color === 'status-lost' && 'bg-red-400',
                  (!col.color || col.color === 'secondary') && 'bg-muted-foreground',
                )} />
                {col.name}
                <Edit2 className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 ml-auto" />
              </button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={() => deleteColumn.mutate(col.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-1 pl-8">
          <Input
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            className="h-7 text-sm"
            placeholder="Nome da fase"
            autoFocus
          />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleAddColumn}>
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setIsAdding(false); setNewColName(''); }}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="ml-8 text-xs text-muted-foreground" onClick={() => setIsAdding(true)}>
          <Plus className="w-3 h-3 mr-1" /> Adicionar fase
        </Button>
      )}
    </div>
  );
}

export function PipelineManager() {
  const { data: pipelines, isLoading } = usePipelines();
  const deletePipeline = useDeletePipeline();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const updatePipeline = useUpdatePipeline();

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updatePipeline.mutate({ id: editingId, updates: { name: editName } });
      setEditingId(null);
    }
  };

  const getIcon = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(o => o.value === iconName);
    return iconOption?.icon || Folder;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipelines</h3>
        <CreatePipelineDialog />
      </div>

      <div className="space-y-2">
        {pipelines?.map((pipeline) => {
          const Icon = getIcon(pipeline.icon);
          const isEditing = editingId === pipeline.id;
          const isExpanded = expandedId === pipeline.id;

          return (
            <div key={pipeline.id} className="rounded-lg bg-secondary/30 overflow-hidden">
              <div className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors group">
                <button onClick={() => toggleExpand(pipeline.id)} className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  pipeline.color === 'primary' && 'bg-primary/20 text-primary',
                  pipeline.color === 'accent' && 'bg-accent/20 text-accent',
                  pipeline.color === 'emerald' && 'bg-emerald-500/20 text-emerald-500',
                  pipeline.color === 'orange' && 'bg-orange-500/20 text-orange-500',
                  pipeline.color === 'pink' && 'bg-pink-500/20 text-pink-500',
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" autoFocus />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}><Save className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{pipeline.name}</p>
                      <p className="text-xs text-muted-foreground">/{pipeline.slug}/leads</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(pipeline.id, pipeline.name)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Pipeline</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{pipeline.name}"? Isso também excluirá todas as colunas personalizadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deletePipeline.mutate(pipeline.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>

              {isExpanded && <PipelineColumnsEditor pipelineId={pipeline.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreatePipelineDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', icon: 'folder', color: 'primary' });
  const createPipeline = useCreatePipeline();

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPipeline.mutate(formData, {
      onSuccess: () => { setOpen(false); setFormData({ name: '', slug: '', icon: 'folder', color: 'primary' }); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Pipeline</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Criar Pipeline</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Nome *</Label>
            <Input required value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: E-commerce" />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="ecommerce" />
            <p className="text-xs text-muted-foreground mt-1">URL: /{formData.slug || 'slug'}/leads</p>
          </div>
          <div>
            <Label>Ícone</Label>
            <div className="flex gap-2 mt-2">
              {ICON_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                  className={cn('p-2 rounded-lg border-2 transition-colors', formData.icon === option.value ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary/50 hover:bg-secondary')}>
                  <option.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 mt-2">
              {COLOR_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                  className={cn('w-8 h-8 rounded-full border-2 transition-all', option.className, formData.color === option.value ? 'border-foreground scale-110' : 'border-transparent')} />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createPipeline.isPending}>Criar Pipeline</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
