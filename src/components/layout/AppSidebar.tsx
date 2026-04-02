import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, FileText,
  ChevronDown, ChevronRight, Truck, Building2, Globe,
  Zap, Settings, Folder, Layers, CheckSquare, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipelines } from '@/hooks/usePipelines';
import { useFollowupsHoje } from '@/hooks/useLeads';
import { Niche } from '@/types/leads';

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck,
  building2: Building2,
  globe: Globe,
  folder: Folder,
  layers: Layers,
};

// Badge de follow-up pendente por pipeline
function FollowupBadge({ niche }: { niche: Niche }) {
  const { data: leads } = useFollowupsHoje(niche);
  const count = (leads || []).length;
  if (count === 0) return null;
  return (
    <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { data: pipelines } = usePipelines();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (slug: string) => location.pathname.startsWith(`/${slug}/`);

  // Expand section automatically when on a related page
  useEffect(() => {
    if (pipelines) {
      const activeSlug = pipelines.find(p => isSectionActive(p.slug))?.slug;
      if (activeSlug && !expandedSections.includes(activeSlug)) {
        setExpandedSections(prev => [...prev, activeSlug]);
      }
    }
  }, [location.pathname, pipelines]);

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">Food Scale</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <Link to="/" className={cn('nav-item mb-2', isActive('/') && 'active')}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <Link to="/tasks" className={cn('nav-item mb-2', isActive('/tasks') && 'active')}>
          <CheckSquare className="w-5 h-5" />
          <span>Tarefas</span>
        </Link>

        {/* Pipeline Sections */}
        <div className="space-y-1 mt-4">
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2">PIPELINES</p>
          {pipelines?.map((pipeline) => {
            const Icon = ICON_MAP[pipeline.icon] || Folder;
            const isExpanded = expandedSections.includes(pipeline.slug);
            const pipelineNiche = pipeline.slug as Niche;

            return (
              <div key={pipeline.id}>
                <button
                  onClick={() => toggleSection(pipeline.slug)}
                  className={cn('nav-item w-full justify-between', isSectionActive(pipeline.slug) && 'text-primary')}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{pipeline.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FollowupBadge niche={pipelineNiche} />
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-4 pl-4 border-l border-sidebar-border mt-1 space-y-1">
                    <Link
                      to={`/${pipeline.slug}/leads`}
                      className={cn('nav-item', isActive(`/${pipeline.slug}/leads`) && 'active')}
                    >
                      <Users className="w-4 h-4" />
                      <span>Leads</span>
                    </Link>
                    <Link
                      to={`/${pipeline.slug}/followup`}
                      className={cn('nav-item', isActive(`/${pipeline.slug}/followup`) && 'active')}
                    >
                      <Bell className="w-4 h-4" />
                      <span>Follow-up</span>
                      <FollowupBadge niche={pipelineNiche} />
                    </Link>
                    <Link
                      to={`/${pipeline.slug}/metrics`}
                      className={cn('nav-item', isActive(`/${pipeline.slug}/metrics`) && 'active')}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Métricas</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scripts & Settings */}
        <div className="mt-4 pt-4 border-t border-sidebar-border space-y-1">
          <Link to="/scripts" className={cn('nav-item', isActive('/scripts') && 'active')}>
            <FileText className="w-5 h-5" />
            <span>Scripts</span>
          </Link>
          <Link to="/settings" className={cn('nav-item', isActive('/settings') && 'active')}>
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Gestão de Prospecções</p>
        </div>
      </div>
    </aside>
  );
}
