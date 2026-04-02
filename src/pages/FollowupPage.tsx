import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeadDetailsDrawer } from '@/components/leads/LeadDetailsDrawer';
import { useFollowupsHoje } from '@/hooks/useLeads';
import { Lead, Niche, TEMPERATURA_CONFIG, STATUS_CONFIG, deriveLeadStatus } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRegistrarContato } from '@/hooks/useLeads';

export default function FollowupPage() {
  const { niche } = useParams<{ niche: string }>();
  const nicheValue = (niche === 'multimarcas' ? 'multimarcas' : niche === 'site' ? 'site' : 'delivery') as Niche;

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: leads, isLoading } = useFollowupsHoje(nicheValue);
  const registrarContato = useRegistrarContato();

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
  };

  const atrasados = (leads || []).filter(l => l.proximo_followup && isPast(new Date(l.proximo_followup)));
  const hoje = (leads || []).filter(l => !l.proximo_followup || !isPast(new Date(l.proximo_followup)));
  const semAgendamento = hoje.filter(l => !l.proximo_followup);
  const agendadosHoje = hoje.filter(l => l.proximo_followup);

  const nicheLabel = nicheValue === 'delivery' ? 'Delivery' : nicheValue === 'site' ? 'Site' : 'Multimarcas';

  return (
    <DashboardLayout
      title={`Follow-up — ${nicheLabel}`}
      subtitle={`${(leads || []).length} leads para contatar`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (leads || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
          <div className="text-5xl">✅</div>
          <h3 className="text-xl font-semibold">Tudo em dia!</h3>
          <p className="text-muted-foreground">Nenhum follow-up pendente para hoje.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Atrasados */}
          {atrasados.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                ⚠️ Atrasados ({atrasados.length})
              </h2>
              <div className="space-y-2">
                {atrasados.map(lead => (
                  <LeadFollowupCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => handleLeadClick(lead)}
                    onRegistrar={() => registrarContato.mutate({
                      id: lead.id,
                      stage: deriveLeadStatus(lead),
                      temperatura: lead.temperatura || 'frio',
                      tentativasAtuais: lead.tentativas_followup || 0,
                    })}
                    atrasado
                  />
                ))}
              </div>
            </section>
          )}

          {/* Agendados para hoje */}
          {agendadosHoje.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Para hoje ({agendadosHoje.length})
              </h2>
              <div className="space-y-2">
                {agendadosHoje.map(lead => (
                  <LeadFollowupCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => handleLeadClick(lead)}
                    onRegistrar={() => registrarContato.mutate({
                      id: lead.id,
                      stage: deriveLeadStatus(lead),
                      temperatura: lead.temperatura || 'frio',
                      tentativasAtuais: lead.tentativas_followup || 0,
                    })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Sem agendamento */}
          {semAgendamento.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Sem data agendada ({semAgendamento.length})
              </h2>
              <div className="space-y-2">
                {semAgendamento.map(lead => (
                  <LeadFollowupCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => handleLeadClick(lead)}
                    onRegistrar={() => registrarContato.mutate({
                      id: lead.id,
                      stage: deriveLeadStatus(lead),
                      temperatura: lead.temperatura || 'frio',
                      tentativasAtuais: lead.tentativas_followup || 0,
                    })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <LeadDetailsDrawer lead={selectedLead} isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </DashboardLayout>
  );
}

function LeadFollowupCard({
  lead,
  onClick,
  onRegistrar,
  atrasado,
}: {
  lead: Lead;
  onClick: () => void;
  onRegistrar: () => void;
  atrasado?: boolean;
}) {
  const tempCfg = TEMPERATURA_CONFIG[lead.temperatura || 'frio'];
  const statusCfg = STATUS_CONFIG[deriveLeadStatus(lead)];

  // Ação sugerida baseada no estágio atual
  const getSugerido = (stage: string) => {
    switch(stage) {
      case 'novo': return 'Iniciar contato';
      case 'canal_aberto': return 'Fazer perguntas / Qualificar';
      case 'ligacao_feita': return 'Enviar vídeo/proposta';
      case 'video_enviado': return 'Cobrar feedback do vídeo';
      case 'interessado': return 'Marcar diagnóstico';
      case 'follow_up': return 'Recuperar interesse';
      case 'diagnostico_marcado': return 'Preparar reunião';
      case 'fechamento_marcado': return 'Enviar contrato';
      default: return 'Contactar';
    }
  };

  return (
    <div
      className={cn(
        'glass-card p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-secondary/30 transition-colors border-l-4',
        atrasado ? 'border-l-destructive' : tempCfg.color.replace('text-', 'border-l-'),
        atrasado && 'bg-destructive/5'
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-xs font-bold uppercase py-0.5 px-1.5 rounded bg-secondary/50', tempCfg.color)}>
            {tempCfg.label}
          </span>
          <span className="font-semibold text-sm truncate">{lead.nome_negocio}</span>
          <span className={cn('status-badge text-[10px] shrink-0', statusCfg.color)}>{statusCfg.label}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="text-primary/80 font-medium">✨ Sugerido: {getSugerido(lead.stage)}</span>
          {lead.proximo_followup && (
            <span className={cn(atrasado && 'text-destructive font-bold')}>
              <Clock className="w-3 h-3 inline mr-1" />
              {atrasado
                ? `Atrasado ${formatDistanceToNow(new Date(lead.proximo_followup), { addSuffix: true, locale: ptBR })}`
                : format(new Date(lead.proximo_followup), "HH:mm")}
            </span>
          )}
          <span>{lead.tentativas_followup || 0} tentativa{lead.tentativas_followup !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col gap-1 sm:flex-row">
          {lead.whats && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-3"
              onClick={(e) => {
                e.stopPropagation();
                const cleanPhone = lead.whats!.replace(/\D/g, '');
                window.open(`https://wa.me/55${cleanPhone}`, '_blank');
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 px-3 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onRegistrar();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Já fiz</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

