import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pipeline, PipelineColumn } from '@/types/pipeline';
import { toast } from '@/hooks/use-toast';

export function usePipelines() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('pipelines-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipelines' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pipelines'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Pipeline[];
    },
  });
}

export function usePipelineBySlug(slug?: string) {
  const { data: pipelines } = usePipelines();
  const pipeline = pipelines?.find(p => p.slug === slug);
  return pipeline;
}

export function usePipelineColumns(pipelineId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pipelineId) return;

    const channel = supabase
      .channel(`pipeline-columns-${pipelineId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_columns' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pipeline-columns', pipelineId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipelineId, queryClient]);

  return useQuery({
    queryKey: ['pipeline-columns', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return [];
      
      const { data, error } = await supabase
        .from('pipeline_columns')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as PipelineColumn[];
    },
    enabled: !!pipelineId,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pipeline: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pipelines')
        .insert(pipeline)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newPipeline) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Pipeline criado com sucesso!' });
      
      // Create default columns for new pipeline
      const defaultColumns = [
        { name: 'Novo', slug: 'novo', color: 'status-new', position: 0 },
        { name: 'Em Andamento', slug: 'em_andamento', color: 'status-progress', position: 1 },
        { name: 'Fechado', slug: 'fechado', color: 'status-success', position: 2 },
        { name: 'Perdido', slug: 'perdido', color: 'status-lost', position: 3 },
      ];
      
      supabase
        .from('pipeline_columns')
        .insert(defaultColumns.map(col => ({ ...col, pipeline_id: newPipeline.id })))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['pipeline-columns'] });
        });
    },
    onError: () => {
      toast({ title: 'Erro ao criar pipeline', variant: 'destructive' });
    },
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pipeline> }) => {
      const { data, error } = await supabase
        .from('pipelines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Pipeline atualizado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar pipeline', variant: 'destructive' });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Pipeline excluído!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir pipeline', variant: 'destructive' });
    },
  });
}

export function useCreatePipelineColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: Omit<PipelineColumn, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('pipeline_columns')
        .insert(column)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-columns'] });
      toast({ title: 'Coluna adicionada!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar coluna', variant: 'destructive' });
    },
  });
}

export function useUpdatePipelineColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PipelineColumn> }) => {
      const { data, error } = await supabase
        .from('pipeline_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-columns'] });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar coluna', variant: 'destructive' });
    },
  });
}

export function useDeletePipelineColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipeline_columns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-columns'] });
      toast({ title: 'Coluna removida!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir coluna', variant: 'destructive' });
    },
  });
}
