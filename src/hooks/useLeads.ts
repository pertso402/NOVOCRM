import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { externalSupabase } from '@/lib/externalSupabase';
import { supabase } from '@/integrations/supabase/client';
import { Lead, Niche, LeadStatus, Temperatura, calcularProximoFollowup, deriveLeadStatus } from '@/types/leads';
import { toast } from '@/hooks/use-toast';

async function logStageTransition(leadId: string, fromStage: string | null, toStage: string) {
  try {
    await supabase.from('lead_stage_history').insert({
      lead_id: leadId,
      from_stage: fromStage,
      to_stage: toStage,
      changed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to log stage transition', e);
  }
}

export function useLeads(niche: Niche) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = externalSupabase
      .channel('leads-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          const newNiche = (payload as any)?.new?.niche as string | undefined;
          const oldNiche = (payload as any)?.old?.niche as string | undefined;
          const niches = new Set([newNiche, oldNiche].filter(Boolean));
          if (niches.has(niche)) {
            queryClient.invalidateQueries({ queryKey: ['leads', niche] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: 'Realtime desconectado',
            description: 'Não foi possível assinar atualizações em tempo real.',
            variant: 'destructive',
          });
        }
      });

    return () => { externalSupabase.removeChannel(channel); };
  }, [niche, queryClient]);

  return useQuery({
    queryKey: ['leads', niche],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('leads')
        .select('*')
        .eq('niche', niche)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

// Query específica para follow-ups do dia
export function useFollowupsHoje(niche: Niche) {
  return useQuery({
    queryKey: ['followups-hoje', niche],
    queryFn: async () => {
      const agora = new Date().toISOString();
      const { data, error } = await externalSupabase
        .from('leads')
        .select('*')
        .eq('niche', niche)
        .not('stage', 'in', '("negocio_fechado","negocio_perdido")')
        .or(`proximo_followup.is.null,proximo_followup.lte.${agora}`)
        .order('temperatura', { ascending: true }) // frio -> morno -> quente (invertido em UI)
        .order('proximo_followup', { ascending: true, nullsFirst: false });

      if (error) throw error;
      const leads = (data || []) as Lead[];
      // Reordena: quente primeiro
      return leads.sort((a, b) => {
        const ordem: Record<Temperatura, number> = { quente: 0, morno: 1, frio: 2 };
        return (ordem[a.temperatura] ?? 2) - (ordem[b.temperatura] ?? 2);
      });
    },
    refetchInterval: 60000,
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      // Remove campos legados que não existem mais como colunas primárias
      const { ligacao_feita, video_enviado, ...cleanUpdates } = updates as any;

      const payload: Record<string, unknown> = { ...cleanUpdates };

      // Compatibilidade com colunas legadas no banco externo
      if (ligacao_feita !== undefined) payload['Apresentação criada'] = ligacao_feita;
      if (video_enviado !== undefined) payload['Documento/proposta Enviada'] = video_enviado;

      const { data, error } = await externalSupabase
        .from('leads')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['followups-hoje'] });
      toast({ title: 'Lead atualizado', description: 'Alterações salvas.' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      currentStage,
      temperatura,
    }: {
      id: string;
      status: LeadStatus;
      currentStage?: string | null;
      temperatura?: Temperatura;
    }) => {
      // Busca o lead atual para calcular próximo follow-up
      const { data: leadAtual } = await externalSupabase
        .from('leads')
        .select('tentativas_followup, temperatura')
        .eq('id', id)
        .single();

      const tempAtual: Temperatura = temperatura || leadAtual?.temperatura || 'frio';
      const tentativas = (leadAtual?.tentativas_followup || 0);
      const proximoFollowup = calcularProximoFollowup(status, tempAtual, tentativas);

      const payload: Record<string, unknown> = {
        stage: status,
        temperatura: tempAtual,
        ultimo_contato: new Date().toISOString(),
        proximo_followup: proximoFollowup ? proximoFollowup.toISOString() : null,
        // Sincroniza booleans legados para não quebrar queries antigas
        canal_aberto: ['canal_aberto','ligacao_feita','video_enviado','interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado'].includes(status),
        interessado: ['interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado'].includes(status),
        follow_up: ['follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado'].includes(status),
        diagnostico_marcado: ['diagnostico_marcado','fechamento_marcado','negocio_fechado'].includes(status),
        fechamento_marcado: ['fechamento_marcado','negocio_fechado'].includes(status),
        negocio_fechado: status === 'negocio_fechado',
        negocio_perdido: status === 'negocio_perdido',
        'Apresentação criada': ['ligacao_feita','video_enviado','interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado'].includes(status),
        'Documento/proposta Enviada': ['video_enviado','interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado'].includes(status),
      };

      const { data, error } = await externalSupabase
        .from('leads')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logStageTransition(id, currentStage || null, status);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['stage-history'] });
      queryClient.invalidateQueries({ queryKey: ['followups-hoje'] });
    },
    onError: () => {
      toast({ title: 'Erro ao mover lead', variant: 'destructive' });
    },
  });
}

export function useUpdateTemperatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      temperatura,
      stage,
      tentativas,
    }: {
      id: string;
      temperatura: Temperatura;
      stage: LeadStatus;
      tentativas: number;
    }) => {
      const proximoFollowup = calcularProximoFollowup(stage, temperatura, tentativas);

      const { data, error } = await externalSupabase
        .from('leads')
        .update({
          temperatura,
          proximo_followup: proximoFollowup ? proximoFollowup.toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['followups-hoje'] });
      toast({ title: 'Temperatura atualizada' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar temperatura', variant: 'destructive' });
    },
  });
}

export function useRegistrarContato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      stage,
      temperatura,
      tentativasAtuais,
    }: {
      id: string;
      stage: LeadStatus;
      temperatura: Temperatura;
      tentativasAtuais: number;
    }) => {
      const novasTentativas = tentativasAtuais + 1;
      const proximoFollowup = calcularProximoFollowup(stage, temperatura, novasTentativas);

      const { data, error } = await externalSupabase
        .from('leads')
        .update({
          ultimo_contato: new Date().toISOString(),
          tentativas_followup: novasTentativas,
          proximo_followup: proximoFollowup ? proximoFollowup.toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['followups-hoje'] });
      toast({ title: 'Contato registrado', description: 'Próximo follow-up agendado.' });
    },
    onError: () => {
      toast({ title: 'Erro ao registrar contato', variant: 'destructive' });
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { ligacao_feita, video_enviado, ...cleanLead } = lead as any;

      const payload: Record<string, unknown> = {
        ...cleanLead,
        stage: 'novo',
        temperatura: 'frio',
        tentativas_followup: 0,
        canal_aberto: false,
        interessado: false,
        follow_up: false,
        diagnostico_marcado: false,
        fechamento_marcado: false,
        negocio_fechado: false,
        negocio_perdido: false,
        'Apresentação criada': false,
        'Documento/proposta Enviada': false,
      };

      const { data, error } = await externalSupabase
        .from('leads')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.id) {
        logStageTransition(data.id, null, data.stage || 'novo');
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['stage-history'] });
      toast({ title: 'Lead criado' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar lead', variant: 'destructive' });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await externalSupabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead excluído' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir lead', variant: 'destructive' });
    },
  });
}
