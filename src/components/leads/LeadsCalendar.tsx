import { useMemo } from 'react';
import { Lead, deriveLeadStatus } from '@/types/leads';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Target, Handshake, Bell } from 'lucide-react';

interface LeadsCalendarProps {
  leads: Lead[];
}

export function LeadsCalendar({ leads }: LeadsCalendarProps) {
  const calendarData = useMemo(() => {
    const diagnosticoDates: Date[] = [];
    const fechamentoDates: Date[] = [];
    const followupDates: Date[] = [];

    leads.forEach((lead) => {
      if ((lead as any).diagnostico_data) {
        diagnosticoDates.push(new Date((lead as any).diagnostico_data));
      }
      if ((lead as any).fechamento_data) {
        fechamentoDates.push(new Date((lead as any).fechamento_data));
      }
      if (lead.proximo_followup) {
        followupDates.push(new Date(lead.proximo_followup));
      }
    });

    const diagnosticoCount = leads.filter(l => deriveLeadStatus(l) === 'diagnostico_marcado' || deriveLeadStatus(l) === 'fechamento_marcado' || deriveLeadStatus(l) === 'negocio_fechado').length;
    const fechamentoCount = leads.filter(l => deriveLeadStatus(l) === 'fechamento_marcado' || deriveLeadStatus(l) === 'negocio_fechado').length;
    const followupPendente = leads.filter(l =>
      l.proximo_followup &&
      !['negocio_fechado', 'negocio_perdido'].includes(deriveLeadStatus(l))
    ).length;

    return { diagnosticoDates, fechamentoDates, followupDates, diagnosticoCount, fechamentoCount, followupPendente };
  }, [leads]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Summary Cards */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Resumo de Agendamentos
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-warning mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Diagnósticos</span>
            </div>
            <p className="text-3xl font-bold">{calendarData.diagnosticoCount}</p>
            <p className="text-xs text-muted-foreground mt-1">marcados</p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-success mb-2">
              <Handshake className="w-4 h-4" />
              <span className="text-xs font-medium">Fechamentos</span>
            </div>
            <p className="text-3xl font-bold">{calendarData.fechamentoCount}</p>
            <p className="text-xs text-muted-foreground mt-1">marcados</p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Bell className="w-4 h-4" />
              <span className="text-xs font-medium">Follow-ups</span>
            </div>
            <p className="text-3xl font-bold">{calendarData.followupPendente}</p>
            <p className="text-xs text-muted-foreground mt-1">agendados</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Calendário</h3>
        <Calendar
          mode="multiple"
          selected={[
            ...calendarData.diagnosticoDates,
            ...calendarData.fechamentoDates,
            ...calendarData.followupDates,
          ]}
          className="rounded-md"
          modifiers={{
            diagnostico: calendarData.diagnosticoDates,
            fechamento: calendarData.fechamentoDates,
            followup: calendarData.followupDates,
          }}
          modifiersStyles={{
            diagnostico: { backgroundColor: 'hsl(var(--warning) / 0.2)' },
            fechamento:  { backgroundColor: 'hsl(var(--success) / 0.2)' },
            followup:    { backgroundColor: 'hsl(200 80% 50% / 0.2)' },
          }}
        />

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning/20" />
            <span>Diagnóstico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success/20" />
            <span>Fechamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(200 80% 50% / 0.2)' }} />
            <span>Follow-up</span>
          </div>
        </div>
      </div>
    </div>
  );
}
