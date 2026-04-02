import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/lib/externalSupabase';
import { Script, Niche } from '@/types/leads';
import { toast } from '@/hooks/use-toast';

export function useScripts(niche?: Niche, _onlyActive = false) {
  return useQuery({
    queryKey: ['scripts', niche],
    queryFn: async () => {
      let query = externalSupabase.from('scripts').select('*');
      if (niche) query = query.eq('niche', niche);

      const { data, error } = await query;
      if (error) throw error;

      return ((data || []) as Script[]).sort((a: any, b: any) => {
        const aLabel = String(a?.nome ?? a?.name ?? '').toLocaleLowerCase('pt-BR');
        const bLabel = String(b?.nome ?? b?.name ?? '').toLocaleLowerCase('pt-BR');
        return aLabel.localeCompare(bLabel, 'pt-BR');
      });
    },
  });
}

export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (script: Partial<Script>) => {
      const { data, error } = await externalSupabase.from('scripts').insert(script).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      toast({ title: 'Script criado' });
    },
    onError: () => toast({ title: 'Erro ao criar script', variant: 'destructive' }),
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Script> }) => {
      const { data, error } = await externalSupabase.from('scripts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      toast({ title: 'Script atualizado' });
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });
}
