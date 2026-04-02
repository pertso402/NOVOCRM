import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/metrics/MetricCard';
import { useMetricsSummary } from '@/hooks/useMetrics';
import { useFollowupsHoje } from '@/hooks/useLeads';
import { usePipelines } from '@/hooks/usePipelines';
import { Niche } from '@/types/leads';
import {
  Truck, Building2, Globe, TrendingUp, Users, ArrowRight,
  Zap, Target, BarChart3, Folder, Layers, Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck, building2: Building2, globe: Globe, folder: Folder, layers: Layers,
};

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary group-hover:bg-primary/20',
  accent: 'bg-accent/10 text-accent group-hover:bg-accent/20',
  emerald: 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20',
  orange: 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20',
  pink: 'bg-pink-500/10 text-pink-500 group-hover:bg-pink-500/20',
};

function PipelineCard({ slug, name, icon, color }: { slug: string; name: string; icon: string; color: string }) {
  const { data: metrics } = useMetricsSummary(slug as Niche);
  const { data: followups } = useFollowupsHoje(slug as Niche);
  const Icon = ICON_MAP[icon] || Folder;
  const colorClass = COLOR_MAP[color] || COLOR_MAP.primary;
  const followupCount = (followups || []).length;

  return (
    <div className="glass-card-hover p-6 group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center transition-colors', colorClass)}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{name}</h3>
            <p className="text-muted-foreground text-sm">{metrics?.totalCount || 0} leads no total</p>
          </div>
        </div>
        {followupCount > 0 && (
          <span className="text-xs font-bold bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">
            {followupCount} follow-up{followupCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-2xl font-bold">{metrics?.todayCount || 0}</p>
          <p className="text-xs text-muted-foreground">Hoje</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-2xl font-bold">{metrics?.weekCount || 0}</p>
          <p className="text-xs text-muted-foreground">Semana</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-2xl font-bold">
            {metrics?.conversionRates?.negocioFechado?.toFixed(0) || 0}%
          </p>
          <p className="text-xs text-muted-foreground">Fechamento</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link to={`/${slug}/leads`}>
            Ver Leads <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant={followupCount > 0 ? 'destructive' : 'secondary'} className="gap-1">
          <Link to={`/${slug}/followup`}>
            <Bell className="w-4 h-4" />
            {followupCount > 0 ? followupCount : ''}
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to={`/${slug}/metrics`}><BarChart3 className="w-4 h-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

export default function Index() {
  const { data: pipelines } = usePipelines();
  const { data: deliveryMetrics } = useMetricsSummary('delivery');
  const { data: multimarcasMetrics } = useMetricsSummary('multimarcas');
  const { data: siteMetrics } = useMetricsSummary('site');
  const { data: followupsDelivery } = useFollowupsHoje('delivery');
  const { data: followupsMulti } = useFollowupsHoje('multimarcas');
  const { data: followupsSite } = useFollowupsHoje('site');

  const totalToday   = (deliveryMetrics?.todayCount || 0) + (multimarcasMetrics?.todayCount || 0) + (siteMetrics?.todayCount || 0);
  const totalWeek    = (deliveryMetrics?.weekCount || 0) + (multimarcasMetrics?.weekCount || 0) + (siteMetrics?.weekCount || 0);
  const totalMonth   = (deliveryMetrics?.monthCount || 0) + (multimarcasMetrics?.monthCount || 0) + (siteMetrics?.monthCount || 0);
  const totalLeads   = (deliveryMetrics?.totalCount || 0) + (multimarcasMetrics?.totalCount || 0) + (siteMetrics?.totalCount || 0);
  const totalFollowups = (followupsDelivery?.length || 0) + (followupsMulti?.length || 0) + (followupsSite?.length || 0);

  return (
    <DashboardLayout title="Dashboard" subtitle="Visão geral das suas prospecções">
      <div className="space-y-8">
        {/* Hero */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Food Scale CRM</h2>
              <p className="text-muted-foreground">Gerencie suas prospecções de forma eficiente</p>
            </div>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Total de Leads"      value={totalLeads}    icon={<Users className="w-5 h-5" />} />
          <MetricCard label="Prospecções Hoje"    value={totalToday}    icon={<Target className="w-5 h-5" />} />
          <MetricCard label="Esta Semana"          value={totalWeek}     icon={<TrendingUp className="w-5 h-5" />} />
          <MetricCard label="Este Mês"             value={totalMonth}    icon={<BarChart3 className="w-5 h-5" />} />
          <MetricCard
            label="Follow-ups Pendentes"
            value={totalFollowups}
            icon={<Bell className="w-5 h-5" />}
            className={totalFollowups > 0 ? 'border-destructive/40' : ''}
          />
        </div>

        {/* Pipeline Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Pipelines</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pipelines?.map((pipeline) => (
              <PipelineCard
                key={pipeline.id}
                slug={pipeline.slug}
                name={pipeline.name}
                icon={pipeline.icon}
                color={pipeline.color}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
