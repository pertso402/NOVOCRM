import { useState, useEffect } from 'react';
import {
  X, Save, Loader2, Building2, User, Phone, FileText, Trash2,
  MapPin, Tag, MessageSquare, Star, DollarSign, Calendar as CalendarIcon,
  Video, Instagram, Thermometer, Clock, RefreshCw,
} from 'lucide-react';
import { Lead, Temperatura, TEMPERATURA_CONFIG, deriveLeadStatus } from '@/types/leads';
import { CategoriaLead, CATEGORIA_LEAD_CONFIG } from '@/types/pipeline';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUpdateLead, useDeleteLead, useUpdateTemperatura, useRegistrarContato } from '@/hooks/useLeads';
import { useScripts } from '@/hooks/useScripts';
import { useLeadExtras, useUpsertLeadExtras } from '@/hooks/useLeadExtras';
import { TaskList } from '@/components/tasks/TaskList';
import { PaymentsList } from '@/components/leads/PaymentsList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExpandableTextarea } from '@/components/leads/ExpandableTextarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailsDrawer({ lead, isOpen, onClose }: LeadDetailsDrawerProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [motivoPerca, setMotivoPerca] = useState('');
  const [motivoGanho, setMotivoGanho] = useState('');
  const [cidade, setCidade] = useState('');
  const [nichoNegocio, setNichoNegocio] = useState('');
  const [observacao, setObservacao] = useState('');
  const [categoriaLead, setCategoriaLead] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [dataFechamento, setDataFechamento] = useState('');

  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const updateTemperatura = useUpdateTemperatura();
  const registrarContato = useRegistrarContato();
  const { data: scripts } = useScripts(lead?.niche, true);
  const { data: leadExtras } = useLeadExtras(lead?.id);
  const upsertLeadExtras = useUpsertLeadExtras();

  const handleDelete = () => {
    if (!lead) return;
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      deleteLead.mutate(lead.id, { onSuccess: () => onClose() });
    }
  };

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      setMotivoPerca(
        lead.motivo_perca && Object.keys(lead.motivo_perca).length > 0
          ? JSON.stringify(lead.motivo_perca, null, 2)
          : ''
      );
      setMotivoGanho(
        lead.motivo_ganho && Object.keys(lead.motivo_ganho).length > 0
          ? JSON.stringify(lead.motivo_ganho, null, 2)
          : ''
      );
    }
  }, [lead]);

  useEffect(() => {
    if (leadExtras) {
      setCidade(leadExtras.cidade || '');
      setNichoNegocio(leadExtras.nicho_negocio || '');
      setObservacao(leadExtras.observacao || '');
      setCategoriaLead(leadExtras.categoria_lead || '');
      setValorVenda((leadExtras as any).valor_venda?.toString() || '');
      setDataFechamento(
        (leadExtras as any).data_fechamento
          ? new Date((leadExtras as any).data_fechamento).toISOString().split('T')[0]
          : ''
      );
    } else {
      setCidade(''); setNichoNegocio(''); setObservacao('');
      setCategoriaLead(''); setValorVenda(''); setDataFechamento('');
    }
  }, [leadExtras]);

  const handleSave = () => {
    if (!lead) return;

    let parsedMotivoPerca = null;
    let parsedMotivoGanho = null;
    try { parsedMotivoPerca = motivoPerca ? JSON.parse(motivoPerca) : null; } catch {}
    try { parsedMotivoGanho = motivoGanho ? JSON.parse(motivoGanho) : null; } catch {}

    const updates: Partial<Lead> = {
      ...formData,
      motivo_perca: parsedMotivoPerca,
      motivo_ganho: parsedMotivoGanho,
    };

    updateLead.mutate({ id: lead.id, updates });

    upsertLeadExtras.mutate({
      lead_id: lead.id,
      cidade: cidade || undefined,
      nicho_negocio: nichoNegocio || undefined,
      observacao: observacao || undefined,
      categoria_lead: categoriaLead || undefined,
      valor_venda: valorVenda ? parseFloat(valorVenda) : undefined,
      data_fechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
    });
  };

  const handleTemperaturaChange = (temp: Temperatura) => {
    if (!lead) return;
    setFormData((prev) => ({ ...prev, temperatura: temp }));
    updateTemperatura.mutate({
      id: lead.id,
      temperatura: temp,
      stage: deriveLeadStatus(lead),
      tentativas: lead.tentativas_followup || 0,
    });
  };

  const handleRegistrarContato = () => {
    if (!lead) return;
    registrarContato.mutate({
      id: lead.id,
      stage: deriveLeadStatus(lead),
      temperatura: lead.temperatura || 'frio',
      tentativasAtuais: lead.tentativas_followup || 0,
    });
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[540px] bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{lead?.nome_negocio || 'Detalhes do Lead'}</h2>
            {lead && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {lead.nome_decisor || 'Sem decisor cadastrado'}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Temperatura + Follow-up bar */}
        {lead && (
          <div className="px-6 py-3 border-b border-border bg-secondary/20 space-y-3">
            {/* Temperatura */}
            <div className="flex items-center gap-3">
              <Thermometer className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">Temperatura:</span>
              <div className="flex gap-2">
                {(['frio', 'morno', 'quente'] as Temperatura[]).map((temp) => {
                  const cfg = TEMPERATURA_CONFIG[temp];
                  const ativo = (formData.temperatura || lead.temperatura) === temp;
                  return (
                    <button
                      key={temp}
                      onClick={() => handleTemperaturaChange(temp)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full border transition-all',
                        ativo
                          ? `${cfg.color} border-current font-semibold bg-current/10`
                          : 'text-muted-foreground border-border hover:border-muted-foreground'
                      )}
                    >
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Próximo follow-up */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {lead.proximo_followup ? (
                  <span>
                    Próximo contato:{' '}
                    <span className={cn(
                      'font-medium',
                      new Date(lead.proximo_followup) <= new Date() ? 'text-destructive' : 'text-foreground'
                    )}>
                      {format(new Date(lead.proximo_followup), "dd/MM 'às' HH:mm")}
                    </span>
                    {' '}
                    <span className="text-xs">
                      ({formatDistanceToNow(new Date(lead.proximo_followup), { addSuffix: true, locale: ptBR })})
                    </span>
                  </span>
                ) : (
                  <span>Sem follow-up agendado</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleRegistrarContato}
                disabled={registrarContato.isPending}
              >
                <RefreshCw className="w-3 h-3" />
                Registrar contato
              </Button>
            </div>

            {lead.tentativas_followup > 0 && (
              <p className="text-xs text-muted-foreground">
                {lead.tentativas_followup} tentativa{lead.tentativas_followup !== 1 ? 's' : ''} realizadas
                {lead.ultimo_contato && (
                  <> · Último contato: {formatDistanceToNow(new Date(lead.ultimo_contato), { addSuffix: true, locale: ptBR })}</>
                )}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {lead && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1 text-xs">Info</TabsTrigger>
                <TabsTrigger value="tasks" className="flex-1 text-xs">Tarefas</TabsTrigger>
                <TabsTrigger value="payments" className="flex-1 text-xs">Pagamentos</TabsTrigger>
                <TabsTrigger value="fechamento" className="flex-1 text-xs">Fechamento</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" /> Nome do Negócio
                  </Label>
                  <Input
                    value={formData.nome_negocio || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, nome_negocio: e.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" /> Nome do Decisor
                  </Label>
                  <Input
                    value={formData.nome_decisor || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, nome_decisor: e.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" /> WhatsApp
                  </Label>
                  <Input
                    value={formData.whats || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, whats: e.target.value }))}
                    className="bg-secondary/50 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" /> Cidade
                    </Label>
                    <Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="bg-secondary/50" placeholder="Ex: São Paulo" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4" /> Nicho do Negócio
                    </Label>
                    <Input value={nichoNegocio} onChange={(e) => setNichoNegocio(e.target.value)} className="bg-secondary/50" placeholder="Ex: Alimentação" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Instagram className="w-4 h-4" /> Instagram
                    </Label>
                    <Input
                      value={formData.instagram || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, instagram: e.target.value }))}
                      className="bg-secondary/50"
                      placeholder="@usuario"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4" /> URL do Vídeo
                    </Label>
                    <Input
                      value={formData.url_video || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, url_video: e.target.value }))}
                      className="bg-secondary/50"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" /> Observação
                  </Label>
                  <ExpandableTextarea
                    value={observacao}
                    onChange={(val) => setObservacao(val)}
                    placeholder="Anotações para usar na prospecção..."
                    className="bg-secondary/50"
                    minHeight="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4" /> Categoria do Lead
                  </Label>
                  <RadioGroup
                    value={categoriaLead}
                    onValueChange={(value) => setCategoriaLead(value)}
                    className="space-y-2"
                  >
                    {(Object.entries(CATEGORIA_LEAD_CONFIG) as [CategoriaLead, typeof CATEGORIA_LEAD_CONFIG[CategoriaLead]][]).map(([key, config]) => (
                      <div key={key} className="flex items-start space-x-3">
                        <RadioGroupItem value={key} id={`drawer-${key}`} className="mt-0.5" />
                        <Label htmlFor={`drawer-${key}`} className="font-normal cursor-pointer">
                          <span className={`font-semibold ${config.color}`}>{config.label}</span>
                          <span className="text-muted-foreground text-xs block">{config.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" /> Script Usado
                  </Label>
                  <Select
                    value={formData.script_id || ''}
                    onValueChange={(value) => setFormData((p) => ({ ...p, script_id: value }))}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Selecione um script" />
                    </SelectTrigger>
                    <SelectContent>
                      {scripts?.map((script) => (
                        <SelectItem key={script.id} value={script.id}>
                          {script.nome} (v{script.versao})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <TaskList leadId={lead.id} leadName={lead.nome_negocio} />
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <PaymentsList leadId={lead.id} leadName={lead.nome_negocio} />
              </TabsContent>

              <TabsContent value="fechamento" className="space-y-4 mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">Informações de Fechamento / Perda</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4" /> Valor da Venda
                    </Label>
                    <Input
                      type="number"
                      value={valorVenda}
                      onChange={(e) => setValorVenda(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4" /> Data do Fechamento
                    </Label>
                    <Input
                      type="date"
                      value={dataFechamento}
                      onChange={(e) => setDataFechamento(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Motivo da Perda</Label>
                  <Textarea
                    value={motivoPerca}
                    onChange={(e) => setMotivoPerca(e.target.value)}
                    className="bg-secondary/50 font-mono text-sm min-h-[100px]"
                    placeholder='{"motivo": "preço alto"}'
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Motivo do Ganho</Label>
                  <Textarea
                    value={motivoGanho}
                    onChange={(e) => setMotivoGanho(e.target.value)}
                    className="bg-secondary/50 font-mono text-sm min-h-[100px]"
                    placeholder='{"motivo": "demonstração do ROI"}'
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border space-y-3">
          <Button onClick={handleSave} disabled={updateLead.isPending} className="w-full">
            {updateLead.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLead.isPending} className="w-full">
            {deleteLead.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</>
            ) : (
              <><Trash2 className="w-4 h-4 mr-2" /> Excluir Lead</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
