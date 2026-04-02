import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns';

export type PeriodFilter = 'daily' | 'weekly' | 'monthly';

interface StageTransition {
  id: string;
  lead_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_at: string;
}

interface FunnelStep {
  stage: string;
  label: string;
  count: number;
  percentage: number;
}

interface PeriodBucket {
  label: string;
  start: Date;
  end: Date;
}

function getPeriodBuckets(filter: PeriodFilter, count: number): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    if (filter === 'daily') {
      const day = subDays(now, i);
      buckets.push({
        label: format(day, 'dd/MM'),
        start: startOfDay(day),
        end: endOfDay(day),
      });
    } else if (filter === 'weekly') {
      const week = subWeeks(now, i);
      const ws = startOfWeek(week, { weekStartsOn: 1 });
      buckets.push({
        label: `${format(ws, 'dd/MM')}`,
        start: ws,
        end: endOfWeek(week, { weekStartsOn: 1 }),
      });
    } else {
      const month = subMonths(now, i);
      buckets.push({
        label: format(month, 'MMM/yy'),
        start: startOfMonth(month),
        end: endOfMonth(month),
      });
    }
  }
  return buckets;
}

const FUNNEL_STAGES = [
  { stage: 'canal_aberto', label: 'Contatados' },
  { stage: 'ligacao_feita', label: 'Loom Enviado' },
  { stage: 'video_enviado', label: 'Respondeu' },
  { stage: 'interessado', label: 'Interessado' },
  { stage: 'negocio_fechado', label: 'Fechou' },
];

export function useStageHistory(pipelineSlug: string) {
  return useQuery({
    queryKey: ['stage-history', pipelineSlug],
    queryFn: async () => {
      // Get all leads for this pipeline to filter history
      const { data, error } = await supabase
        .from('lead_stage_history')
        .select('*')
        .order('changed_at', { ascending: true });

      if (error) throw error;
      return (data || []) as StageTransition[];
    },
  });
}

export function usePreciseFunnel(pipelineSlug: string, filter: PeriodFilter, periodsCount: number = 30) {
  const { data: allHistory, isLoading } = useStageHistory(pipelineSlug);

  const buckets = getPeriodBuckets(filter, periodsCount);

  // Build funnel for a specific period
  const buildFunnelForPeriod = (start: Date, end: Date, transitions: StageTransition[]) => {
    const periodTransitions = transitions.filter(t => {
      const d = new Date(t.changed_at);
      return d >= start && d <= end;
    });

    const stageCounts: Record<string, Set<string>> = {};
    FUNNEL_STAGES.forEach(s => { stageCounts[s.stage] = new Set(); });

    periodTransitions.forEach(t => {
      if (stageCounts[t.to_stage]) {
        stageCounts[t.to_stage].add(t.lead_id);
      }
    });

    const total = stageCounts[FUNNEL_STAGES[0].stage]?.size || 1;

    return FUNNEL_STAGES.map(s => ({
      stage: s.stage,
      label: s.label,
      count: stageCounts[s.stage]?.size || 0,
      percentage: ((stageCounts[s.stage]?.size || 0) / total) * 100,
    }));
  };

  // Current period funnel (based on filter)
  const currentBucket = buckets[buckets.length - 1];
  const currentFunnel = allHistory
    ? buildFunnelForPeriod(currentBucket?.start || new Date(), currentBucket?.end || new Date(), allHistory)
    : [];

  // Time series data per stage
  const timeSeriesData = allHistory
    ? buckets.map(bucket => {
        const funnel = buildFunnelForPeriod(bucket.start, bucket.end, allHistory);
        const entry: Record<string, any> = { label: bucket.label };
        funnel.forEach(f => { entry[f.stage] = f.count; });
        return entry;
      })
    : [];

  // Aggregate funnel for selected range
  const rangeStart = buckets[0]?.start || new Date();
  const rangeEnd = buckets[buckets.length - 1]?.end || new Date();
  const aggregateFunnel = allHistory
    ? buildFunnelForPeriod(rangeStart, rangeEnd, allHistory)
    : [];

  return {
    isLoading,
    currentFunnel,
    aggregateFunnel,
    timeSeriesData,
    buckets,
    funnelStages: FUNNEL_STAGES,
  };
}
