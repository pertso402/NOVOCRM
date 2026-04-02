import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadExtras } from '@/types/pipeline';
import { toast } from '@/hooks/use-toast';

export function useLeadExtras(leadId?: string) {
  return useQuery({
    queryKey: ['lead-extras', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      const { data, error } = await supabase
        .from('lead_extras')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (error) throw error;
      return data as LeadExtras | null;
    },
    enabled: !!leadId,
  });
}

export function useUpsertLeadExtras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      lead_id, 
      cidade, 
      nicho_negocio,
      observacao,
      categoria_lead,
      valor_venda,
      data_fechamento,
    }: { 
      lead_id: string; 
      cidade?: string; 
      nicho_negocio?: string;
      observacao?: string;
      categoria_lead?: string;
      valor_venda?: number;
      data_fechamento?: string;
    }) => {
      const { data, error } = await supabase
        .from('lead_extras')
        .upsert(
          { lead_id, cidade, nicho_negocio, observacao, categoria_lead, valor_venda, data_fechamento } as any,
          { onConflict: 'lead_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-extras', variables.lead_id] });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar dados extras', variant: 'destructive' });
    },
  });
}
