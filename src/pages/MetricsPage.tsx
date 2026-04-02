import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/metrics/MetricCard';
import { ConversionFunnel } from '@/components/metrics/ConversionFunnel';
import { PreciseFunnel } from '@/components/metrics/PreciseFunnel';
import { ProspectionsChart } from '@/components/metrics/ProspectionsChart';
import { ScriptPerformanceTable } from '@/components/metrics/ScriptPerformanceTable';
import { SalesGoalDashboard } from '@/components/metrics/SalesGoalDashboard';
import { useMetricsSummary, useProspectionsByPeriod, useScriptPerformance } from '@/hooks/useMetrics';
import { usePipelines } from '@/hooks/usePipelines';
import { Niche } from '@/types/leads';
import { Loader2, Users, CalendarDays, TrendingUp, Target, Activity, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MetricsPage() {
  const { niche } = useParams<{ niche: string }>();
  const { data: pipelines } = usePipelines();
  
  // Find matching pipeline or use niche as-is
  const pipeline = pipelines?.find(p => p.slug === niche);
  const nicheValue = (niche || 'delivery') as Niche;

  const { data: summary, isLoading: summaryLoading, dataUpdatedAt } = useMetricsSummary(nicheValue);
  const { data: periodData, isLoading: periodLoading } = useProspectionsByPeriod(nicheValue);
  const { data: scriptPerformance, isLoading: perfLoading } = useScriptPerformance(nicheValue);

  const nicheLabel = pipeline?.name || niche || 'Pipeline';
  const isLoading = summaryLoading || periodLoading || perfLoading;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR') : null;

  if (isLoading) {
    return (
      <DashboardLayout title={`Métricas - ${nicheLabel}`}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Métricas - ${nicheLabel}`}
      subtitle="Análise de desempenho das prospecções"
    >
      <div className="space-y-6">
        {/* Realtime indicator */}
        <div className="flex items-center justify-end gap-2">
          <Badge variant="outline" className="gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Atualização automática
          </Badge>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Última atualização: {lastUpdated}
            </span>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Prospecções Hoje"
            value={summary?.todayCount || 0}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            label="Esta Semana"
            value={summary?.weekCount || 0}
            icon={<CalendarDays className="w-5 h-5" />}
          />
          <MetricCard
            label="Este Mês"
            value={summary?.monthCount || 0}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            label="Média Diária"
            value={summary?.dailyAverage || 0}
            icon={<Activity className="w-5 h-5" />}
          />
          <MetricCard
            label="Taxa de Fechamento"
            value={`${summary?.conversionRates?.negocioFechado?.toFixed(1) || 0}%`}
            icon={<Target className="w-5 h-5" />}
          />
        </div>

        {/* Conversion Rates */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Canal Aberto"
            value={`${summary?.conversionRates?.canalAberto?.toFixed(1) || 0}%`}
            className="text-center"
          />
          <MetricCard
            label="Ligação Feita"
            value={`${summary?.conversionRates?.ligacaoFeita?.toFixed(1) || 0}%`}
            className="text-center"
          />
          <MetricCard
            label="Vídeo Enviado"
            value={`${summary?.conversionRates?.videoEnviado?.toFixed(1) || 0}%`}
            className="text-center"
          />
          <MetricCard
            label="Diagnóstico"
            value={`${summary?.conversionRates?.diagnosticoMarcado?.toFixed(1) || 0}%`}
            className="text-center"
          />
          <MetricCard
            label="Fechamento"
            value={`${summary?.conversionRates?.fechamentoMarcado?.toFixed(1) || 0}%`}
            className="text-center"
          />
          <MetricCard
            label="Negócio Fechado"
            value={`${summary?.conversionRates?.negocioFechado?.toFixed(1) || 0}%`}
            className="text-center"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {periodData && (
            <ProspectionsChart
              dailyData={periodData.dailyData}
              weeklyData={periodData.weeklyData}
              monthlyData={periodData.monthlyData}
            />
          )}
          
          {summary?.funnelData && (
            <ConversionFunnel data={summary.funnelData} />
          )}
        </div>

        {/* Script Performance */}
        {scriptPerformance && (
          <ScriptPerformanceTable data={scriptPerformance} />
        )}

        {/* Precise Funnel */}
        <PreciseFunnel pipelineSlug={nicheValue} />

        {/* Sales Goals & Charts */}
        <SalesGoalDashboard pipelineSlug={nicheValue} />
      </div>
    </DashboardLayout>
  );
}
