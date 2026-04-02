import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { externalSupabase } from '@/lib/externalSupabase';
import { Lead, Niche, MetricsByScript, deriveLeadStatus } from '@/types/leads';
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns';

export function useMetricsSummary(niche: Niche) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = externalSupabase
      .channel(`metrics-${niche}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        const newNiche = (payload as any)?.new?.niche as string | undefined;
        const oldNiche = (payload as any)?.old?.niche as string | undefined;
        if (newNiche === niche || oldNiche === niche) {
          queryClient.invalidateQueries({ queryKey: ['metrics-summary', niche] });
          queryClient.invalidateQueries({ queryKey: ['prospections-period', niche] });
          queryClient.invalidateQueries({ queryKey: ['script-performance', niche] });
        }
      })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [niche, queryClient]);

  return useQuery({
    queryKey: ['metrics-summary', niche],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const monthStart = startOfMonth(new Date());

      const { data: leads, error } = await externalSupabase
        .from('leads')
        .select('*')
        .eq('niche', niche);

      if (error) throw error;

      const allLeads = (leads || []) as Lead[];
      const total = allLeads.length || 1;

      // Contagens por período
      const todayCount   = allLeads.filter(l => new Date(l.created_at) >= today).length;
      const weekCount    = allLeads.filter(l => new Date(l.created_at) >= weekStart).length;
      const monthCount   = allLeads.filter(l => new Date(l.created_at) >= monthStart).length;
      const last30 = allLeads.filter(l => new Date(l.created_at) >= subDays(new Date(), 30)).length;
      const dailyAverage = Math.round((last30 / 30) * 10) / 10;

      // Contagens por stage (única fonte de verdade)
      const byStage = (stage: string) => allLeads.filter(l => deriveLeadStatus(l) === stage).length;

      const canalAberto       = allLeads.filter(l => !['novo'].includes(deriveLeadStatus(l))).length;
      const ligacaoFeita      = byStage('ligacao_feita') + byStage('video_enviado') + byStage('interessado') + byStage('follow_up') + byStage('diagnostico_marcado') + byStage('fechamento_marcado') + byStage('negocio_fechado');
      const videoEnviado      = byStage('video_enviado') + byStage('interessado') + byStage('follow_up') + byStage('diagnostico_marcado') + byStage('fechamento_marcado') + byStage('negocio_fechado');
      const diagnosticoMarcado= byStage('diagnostico_marcado') + byStage('fechamento_marcado') + byStage('negocio_fechado');
      const fechamentoMarcado = byStage('fechamento_marcado') + byStage('negocio_fechado');
      const negocioFechado    = byStage('negocio_fechado');

      return {
        todayCount, weekCount, monthCount,
        totalCount: allLeads.length, dailyAverage,
        conversionRates: {
          canalAberto:        (canalAberto / total) * 100,
          ligacaoFeita:       (ligacaoFeita / total) * 100,
          videoEnviado:       (videoEnviado / total) * 100,
          diagnosticoMarcado: (diagnosticoMarcado / total) * 100,
          fechamentoMarcado:  (fechamentoMarcado / total) * 100,
          negocioFechado:     (negocioFechado / total) * 100,
        },
        funnelData: [
          { name: 'Total Leads',    value: allLeads.length,      fill: 'hsl(var(--primary))' },
          { name: 'Canal Aberto',   value: canalAberto,          fill: 'hsl(var(--accent))' },
          { name: 'Ligação Feita',  value: ligacaoFeita,         fill: 'hsl(var(--warning))' },
          { name: 'Vídeo Enviado',  value: videoEnviado,         fill: 'hsl(199 70% 50%)' },
          { name: 'Diagnóstico',    value: diagnosticoMarcado,   fill: 'hsl(199 60% 45%)' },
          { name: 'Fechamento',     value: fechamentoMarcado,    fill: 'hsl(199 50% 40%)' },
          { name: 'Fechado',        value: negocioFechado,       fill: 'hsl(var(--success))' },
        ],
      };
    },
    refetchInterval: 30000,
  });
}

export function useProspectionsByPeriod(niche: Niche) {
  return useQuery({
    queryKey: ['prospections-period', niche],
    queryFn: async () => {
      const { data: leads, error } = await externalSupabase
        .from('leads')
        .select('created_at')
        .eq('niche', niche)
        .gte('created_at', subMonths(new Date(), 12).toISOString());

      if (error) throw error;
      const allLeads = (leads || []) as Pick<Lead, 'created_at'>[];

      const dailyData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date: format(date, 'dd/MM'),
          count: allLeads.filter(l => format(new Date(l.created_at), 'yyyy-MM-dd') === dateStr).length,
        };
      });

      const weeklyData = Array.from({ length: 12 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(new Date(), 11 - i), { weekStartsOn: 1 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return {
          week: `Sem ${12 - i}`,
          count: allLeads.filter(l => {
            const d = new Date(l.created_at);
            return d >= weekStart && d <= weekEnd;
          }).length,
        };
      });

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(new Date(), 11 - i));
        const monthStr = format(monthStart, 'yyyy-MM');
        return {
          month: format(monthStart, 'MMM/yy'),
          count: allLeads.filter(l => format(new Date(l.created_at), 'yyyy-MM') === monthStr).length,
        };
      });

      return { dailyData, weeklyData, monthlyData };
    },
    refetchInterval: 30000,
  });
}

export function useScriptPerformance(niche: Niche, dateRange?: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['script-performance', niche, dateRange],
    queryFn: async () => {
      let query = externalSupabase
        .from('leads')
        .select('*')
        .eq('niche', niche)
        .not('script_id', 'is', null);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      const allLeads = (leads || []) as Lead[];
      const scriptMap = new Map<string, Lead[]>();
      allLeads.forEach(lead => {
        if (lead.script_id) {
          scriptMap.set(lead.script_id, [...(scriptMap.get(lead.script_id) || []), lead]);
        }
      });

      const performance: MetricsByScript[] = [];
      scriptMap.forEach((scriptLeads, scriptId) => {
        const total = scriptLeads.length || 1;
        const hasStage = (stage: string) => scriptLeads.filter(l => deriveLeadStatus(l) === stage).length;
        const hasStageOrAbove = (stages: string[]) => scriptLeads.filter(l => stages.includes(deriveLeadStatus(l))).length;

        performance.push({
          script_id: scriptId,
          script_nome: scriptId,
          niche,
          total_leads: scriptLeads.length,
          taxa_canal_aberto:   (hasStageOrAbove(['canal_aberto','ligacao_feita','video_enviado','interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado']) / total) * 100,
          taxa_ligacao_feita:  (hasStageOrAbove(['ligacao_feita','video_enviado','interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado']) / total) * 100,
          taxa_video_enviado:  (hasStageOrAbove(['video_enviado','interessado','follow_up','diagnostico_marcado','fechamento_marcado','negocio_fechado']) / total) * 100,
          taxa_diagnostico_marcado: (hasStageOrAbove(['diagnostico_marcado','fechamento_marcado','negocio_fechado']) / total) * 100,
          taxa_negocio_fechado: (hasStage('negocio_fechado') / total) * 100,
        });
      });

      return performance.sort((a, b) => b.taxa_negocio_fechado - a.taxa_negocio_fechado);
    },
    refetchInterval: 30000,
  });
}
