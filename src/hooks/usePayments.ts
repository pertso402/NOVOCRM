import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  lead_id: string;
  descricao: string | null;
  valor: number;
  data_vencimento: string | null;
  data_pagamento: string | null;
  status: 'pendente' | 'pago' | 'atrasado';
  created_at: string;
  updated_at: string;
}

export function usePayments(leadId?: string) {
  return useQuery({
    queryKey: ['payments', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('lead_id', leadId)
        .order('data_vencimento', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Payment[];
    },
    enabled: !!leadId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: { lead_id: string; descricao?: string; valor: number; data_vencimento?: string; status?: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.lead_id] });
      toast({ title: 'Parcela adicionada' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar parcela', variant: 'destructive' });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId, updates }: { id: string; leadId: string; updates: Partial<Payment> }) => {
      const { error } = await supabase
        .from('payments')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.leadId] });
      toast({ title: 'Parcela atualizada' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar parcela', variant: 'destructive' });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.leadId] });
      toast({ title: 'Parcela removida' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover parcela', variant: 'destructive' });
    },
  });
}
