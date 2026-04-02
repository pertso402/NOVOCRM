import { useState } from 'react';
import { Target, Edit2, Check, AlertTriangle } from 'lucide-react';
import { useWeeklyGoal, useUpsertWeeklyGoal, useSalesData } from '@/hooks/useWeeklyGoals';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface WeeklyGoalBarProps {
  pipelineSlug: string;
}

export function WeeklyGoalBar({ pipelineSlug }: WeeklyGoalBarProps) {
  const { data: goal } = useWeeklyGoal(pipelineSlug);
  const upsertGoal = useUpsertWeeklyGoal();
  const { data: salesData } = useSalesData(pipelineSlug);

  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  const metaValor = goal?.meta_valor || 3750;
  const currentWeek = salesData?.currentWeekTotal || 0;
  const progressPercent = Math.min((currentWeek / metaValor) * 100, 100);
  const overdueCount = salesData?.overduePayments?.length || 0;
  const nextWeekReceivable = salesData?.nextWeekReceivable || 0;

  const handleSave = () => {
    if (!newGoal) return;
    upsertGoal.mutate({ pipeline_slug: pipelineSlug, meta_valor: parseFloat(newGoal) }, {
      onSuccess: () => { setEditing(false); setNewGoal(''); }
    });
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Meta Semanal</span>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
            </Badge>
          )}
          {nextWeekReceivable > 0 && (
            <Badge variant="outline" className="text-xs">
              A receber próx. sem: {fmt(nextWeekReceivable)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Input
                type="number"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                className="w-28 h-7 text-xs"
                placeholder={String(metaValor)}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">{fmt(currentWeek)} / {fmt(metaValor)}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(true); setNewGoal(String(metaValor)); }}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      <Progress value={progressPercent} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">{progressPercent.toFixed(1)}% da meta</p>
    </div>
  );
}
