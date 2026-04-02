import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, format, addWeeks, isBefore, isAfter } from 'date-fns';

export interface WeeklyGoal {
  id: string;
  pipeline_slug: string;
  meta_valor: number;
  created_at: string;
  updated_at: string;
}

export function useWeeklyGoal(pipelineSlug: string) {
  return useQuery({
    queryKey: ['weekly-goal', pipelineSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('pipeline_slug', pipelineSlug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as WeeklyGoal) || null;
    },
  });
}

export function useUpsertWeeklyGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pipeline_slug, meta_valor }: { pipeline_slug: string; meta_valor: number }) => {
      const { data, error } = await supabase
        .from('weekly_goals')
        .upsert({ pipeline_slug, meta_valor } as any, { onConflict: 'pipeline_slug' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-goal', variables.pipeline_slug] });
      queryClient.invalidateQueries({ queryKey: ['sales-data'] });
      toast({ title: 'Meta atualizada' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar meta', variant: 'destructive' });
    },
  });
}

export interface PaymentRecord {
  id: string;
  lead_id: string;
  descricao: string | null;
  valor: number;
  data_vencimento: string | null;
  data_pagamento: string | null;
  status: string;
}

export interface SalesData {
  currentWeekTotal: number;
  lastWeekTotal: number;
  currentMonthTotal: number;
  lastMonthTotal: number;
  nextWeekReceivable: number;
  weeklyChartData: { week: string; valor: number }[];
  monthlyChartData: { month: string; valor: number }[];
  overduePayments: PaymentRecord[];
  upcomingPayments: PaymentRecord[];
}

// Sales are now based on PAYMENT dates, not deal close dates
// A R$400 deal split into 2x R$200 counts R$200 in each week's goal
export function useSalesData(pipelineSlug: string) {
  return useQuery({
    queryKey: ['sales-data', pipelineSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      const allPayments = (data || []) as unknown as PaymentRecord[];
      const paidPayments = allPayments.filter(p => p.status === 'pago' && p.data_pagamento);
      const pendingPayments = allPayments.filter(p => p.status !== 'pago');

      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
      const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

      const inRange = (dateStr: string, start: Date, end: Date) => {
        const d = new Date(dateStr);
        return d >= start && d <= end;
      };

      // Revenue = paid payments by payment date
      const currentWeekTotal = paidPayments
        .filter(p => inRange(p.data_pagamento!, thisWeekStart, thisWeekEnd))
        .reduce((sum, p) => sum + Number(p.valor), 0);
      const lastWeekTotal = paidPayments
        .filter(p => inRange(p.data_pagamento!, lastWeekStart, lastWeekEnd))
        .reduce((sum, p) => sum + Number(p.valor), 0);
      const currentMonthTotal = paidPayments
        .filter(p => inRange(p.data_pagamento!, thisMonthStart, thisMonthEnd))
        .reduce((sum, p) => sum + Number(p.valor), 0);
      const lastMonthTotal = paidPayments
        .filter(p => inRange(p.data_pagamento!, lastMonthStart, lastMonthEnd))
        .reduce((sum, p) => sum + Number(p.valor), 0);

      // Next week receivable (pending with due date next week)
      const nextWeekReceivable = pendingPayments
        .filter(p => p.data_vencimento && inRange(p.data_vencimento, nextWeekStart, nextWeekEnd))
        .reduce((sum, p) => sum + Number(p.valor), 0);

      // Overdue: pending and due date is before today
      const overduePayments = pendingPayments.filter(p => 
        p.data_vencimento && isBefore(new Date(p.data_vencimento), now)
      );

      // Upcoming: pending with due date in the next 14 days
      const twoWeeksOut = addWeeks(now, 2);
      const upcomingPayments = pendingPayments.filter(p =>
        p.data_vencimento && 
        !isBefore(new Date(p.data_vencimento), now) &&
        isBefore(new Date(p.data_vencimento), twoWeeksOut)
      );

      // Weekly chart (last 8 weeks) based on paid date
      const weeklyChartData = Array.from({ length: 8 }, (_, i) => {
        const ws = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
        const we = endOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
        const valor = paidPayments
          .filter(p => inRange(p.data_pagamento!, ws, we))
          .reduce((sum, p) => sum + Number(p.valor), 0);
        return { week: format(ws, 'dd/MM'), valor };
      });

      // Monthly chart (last 6 months)
      const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
        const ms = startOfMonth(subMonths(now, 5 - i));
        const me = endOfMonth(subMonths(now, 5 - i));
        const valor = paidPayments
          .filter(p => inRange(p.data_pagamento!, ms, me))
          .reduce((sum, p) => sum + Number(p.valor), 0);
        return { month: format(ms, 'MMM/yy'), valor };
      });

      return {
        currentWeekTotal,
        lastWeekTotal,
        currentMonthTotal,
        lastMonthTotal,
        nextWeekReceivable,
        weeklyChartData,
        monthlyChartData,
        overduePayments,
        upcomingPayments,
      } as SalesData;
    },
    refetchInterval: 30000,
  });
}
