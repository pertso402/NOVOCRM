import { useState } from 'react';
import { Edit2, Check, Target, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { useWeeklyGoal, useUpsertWeeklyGoal, useSalesData } from '@/hooks/useWeeklyGoals';
import { MetricCard } from './MetricCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface SalesGoalDashboardProps {
  pipelineSlug: string;
}

export function SalesGoalDashboard({ pipelineSlug }: SalesGoalDashboardProps) {
  const { data: goal } = useWeeklyGoal(pipelineSlug);
  const upsertGoal = useUpsertWeeklyGoal();
  const { data: salesData } = useSalesData(pipelineSlug);

  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  const metaValor = goal?.meta_valor || 3750;
  const currentWeek = salesData?.currentWeekTotal || 0;
  const progressPercent = Math.min((currentWeek / metaValor) * 100, 100);

  const handleSaveGoal = () => {
    if (!newGoal) return;
    upsertGoal.mutate({ pipeline_slug: pipelineSlug, meta_valor: parseFloat(newGoal) }, {
      onSuccess: () => { setEditing(false); setNewGoal(''); }
    });
  };

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(salesData?.overduePayments?.length || 0) > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Parcelas Vencidas ({salesData!.overduePayments.length})</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {salesData!.overduePayments.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.descricao || 'Parcela'} — venceu {p.data_vencimento ? format(new Date(p.data_vencimento), 'dd/MM') : '—'}</span>
                  <span className="font-semibold">{formatCurrency(Number(p.valor))}</span>
                </div>
              ))}
              <div className="border-t border-destructive/30 pt-1 mt-1 flex justify-between font-semibold text-sm">
                <span>Total vencido</span>
                <span>{formatCurrency(salesData!.overduePayments.reduce((s, p) => s + Number(p.valor), 0))}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {(salesData?.upcomingPayments?.length || 0) > 0 && (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Cobranças Próximas ({salesData!.upcomingPayments.length})</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {salesData!.upcomingPayments.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.descricao || 'Parcela'} — vence {p.data_vencimento ? format(new Date(p.data_vencimento), 'dd/MM') : '—'}</span>
                  <span className="font-semibold">{formatCurrency(Number(p.valor))}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Goal Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Meta Semanal
            </CardTitle>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  placeholder={String(metaValor)}
                  className="w-32 h-8 text-sm"
                />
                <Button size="sm" variant="ghost" onClick={handleSaveGoal} disabled={upsertGoal.isPending}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => { setEditing(true); setNewGoal(String(metaValor)); }}>
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{formatCurrency(currentWeek)} / {formatCurrency(metaValor)}</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">{progressPercent.toFixed(1)}% da meta</p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Esta Semana"
          value={formatCurrency(salesData?.currentWeekTotal || 0)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          label="Semana Passada"
          value={formatCurrency(salesData?.lastWeekTotal || 0)}
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <MetricCard
          label="Este Mês"
          value={formatCurrency(salesData?.currentMonthTotal || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Mês Passado"
          value={formatCurrency(salesData?.lastMonthTotal || 0)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          label="A Receber Próx. Semana"
          value={formatCurrency(salesData?.nextWeekReceivable || 0)}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Receita por Semana (pagamentos recebidos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData?.weeklyChartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <ReferenceLine y={metaValor} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Meta', fill: 'hsl(var(--destructive))', fontSize: 11 }} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Receita por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData?.monthlyChartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="valor" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
