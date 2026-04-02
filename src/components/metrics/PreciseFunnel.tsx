import { useState } from 'react';
import { usePreciseFunnel, PeriodFilter } from '@/hooks/useStageHistory';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Loader2, TrendingDown } from 'lucide-react';

interface PreciseFunnelProps {
  pipelineSlug: string;
}

const STAGE_COLORS: Record<string, string> = {
  canal_aberto: 'hsl(199 89% 48%)',
  ligacao_feita: 'hsl(39 100% 50%)',
  video_enviado: 'hsl(280 70% 55%)',
  interessado: 'hsl(150 60% 45%)',
  negocio_fechado: 'hsl(142 76% 36%)',
};

export function PreciseFunnel({ pipelineSlug }: PreciseFunnelProps) {
  const [filter, setFilter] = useState<PeriodFilter>('daily');
  const periodsMap = { daily: 30, weekly: 12, monthly: 12 };

  const { isLoading, aggregateFunnel, timeSeriesData, funnelStages } = usePreciseFunnel(
    pipelineSlug,
    filter,
    periodsMap[filter]
  );

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Funil de Conversão Preciso</h3>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as PeriodFilter)}>
            <TabsList>
              <TabsTrigger value="daily">Diário</TabsTrigger>
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Funnel summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {aggregateFunnel.map((step, idx) => {
            const prevCount = idx > 0 ? aggregateFunnel[idx - 1].count : step.count;
            const convRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '0.0';

            return (
              <div key={step.stage} className="bg-secondary/30 rounded-lg p-4 text-center relative">
                <p className="text-xs text-muted-foreground mb-1">{step.label}</p>
                <p className="text-2xl font-bold">{step.count}</p>
                {idx > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {convRate}% conv.
                  </p>
                )}
                {idx < aggregateFunnel.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-muted-foreground/40 text-lg z-10">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Visual funnel bars */}
        <div className="space-y-2">
          {aggregateFunnel.map((step, idx) => {
            const maxCount = Math.max(...aggregateFunnel.map(s => s.count), 1);
            const width = (step.count / maxCount) * 100;
            const prevCount = idx > 0 ? aggregateFunnel[idx - 1].count : null;
            const convRate = prevCount && prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : null;

            return (
              <div key={step.stage} className="flex items-center gap-3">
                <span className="text-sm w-28 text-right text-muted-foreground">{step.label}</span>
                <div className="flex-1 h-8 bg-secondary/30 rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: STAGE_COLORS[step.stage] || 'hsl(var(--primary))',
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                    {step.count} {convRate && `(${convRate}%)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time series chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          Evolução por {filter === 'daily' ? 'Dia' : filter === 'weekly' ? 'Semana' : 'Mês'}
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              {funnelStages.map((s) => (
                <Bar
                  key={s.stage}
                  dataKey={s.stage}
                  name={s.label}
                  fill={STAGE_COLORS[s.stage] || 'hsl(var(--primary))'}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
