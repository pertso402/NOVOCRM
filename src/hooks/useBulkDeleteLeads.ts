import { useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/lib/externalSupabase';
import { toast } from '@/hooks/use-toast';

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await externalSupabase
        .from('leads')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Leads excluídos',
        description: `${ids.length} lead${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''} com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao excluir leads',
        variant: 'destructive',
      });
    },
  });
}
