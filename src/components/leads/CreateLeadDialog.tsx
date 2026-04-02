import { useState } from 'react';
import { Loader2, Plus, Building2, User, Phone, MapPin, Tag, MessageSquare, Star, Video, Instagram, Link, Thermometer } from 'lucide-react';
import { ExpandableTextarea } from '@/components/leads/ExpandableTextarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Niche, Temperatura, TEMPERATURA_CONFIG } from '@/types/leads';
import { CategoriaLead, CATEGORIA_LEAD_CONFIG } from '@/types/pipeline';
import { useCreateLead } from '@/hooks/useLeads';
import { useScripts } from '@/hooks/useScripts';
import { useUpsertLeadExtras } from '@/hooks/useLeadExtras';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface CreateLeadDialogProps {
  niche: Niche;
}

const defaultForm = {
  nome_negocio: '',
  nome_decisor: '',
  whats: '',
  instagram: '',
  url_video: '',
  url_whats: '',
  script_id: '',
  cidade: '',
  nicho_negocio: '',
  observacao: '',
  categoria_lead: '' as string,
  hora_envio: 'noite',
  temperatura: 'frio' as Temperatura,
};

export function CreateLeadDialog({ niche }: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const createLead = useCreateLead();
  const upsertLeadExtras = useUpsertLeadExtras();
  const { data: scripts } = useScripts(niche, true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createLead.mutate(
      {
        nome_negocio: formData.nome_negocio,
        nome_decisor: formData.nome_decisor,
        whats: formData.whats,
        instagram: formData.instagram || null,
        url_video: formData.url_video || null,
        url_whats: formData.url_whats || null,
        hora_envio: formData.hora_envio || 'noite',
        script_id: formData.script_id || null,
        niche,
        temperatura: formData.temperatura,
      },
      {
        onSuccess: (newLead) => {
          if (formData.cidade || formData.nicho_negocio || formData.observacao || formData.categoria_lead) {
            upsertLeadExtras.mutate({
              lead_id: newLead.id,
              cidade: formData.cidade || undefined,
              nicho_negocio: formData.nicho_negocio || undefined,
              observacao: formData.observacao || undefined,
              categoria_lead: formData.categoria_lead || undefined,
            });
          }
          setOpen(false);
          setFormData(defaultForm);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" /> Nome do Negócio *
            </Label>
            <Input
              required
              value={formData.nome_negocio}
              onChange={(e) => setFormData((p) => ({ ...p, nome_negocio: e.target.value }))}
              placeholder="Ex: Pizzaria do João"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" /> Nome do Decisor
            </Label>
            <Input
              value={formData.nome_decisor}
              onChange={(e) => setFormData((p) => ({ ...p, nome_decisor: e.target.value }))}
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" /> WhatsApp
            </Label>
            <Input
              value={formData.whats}
              onChange={(e) => setFormData((p) => ({ ...p, whats: e.target.value }))}
              placeholder="Ex: 44999999999"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Instagram className="w-4 h-4" /> Instagram
              </Label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData((p) => ({ ...p, instagram: e.target.value }))}
                placeholder="@usuario"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4" /> URL do Vídeo
              </Label>
              <Input
                value={formData.url_video}
                onChange={(e) => setFormData((p) => ({ ...p, url_video: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4" /> Link WhatsApp
            </Label>
            <Input
              value={formData.url_whats}
              onChange={(e) => setFormData((p) => ({ ...p, url_whats: e.target.value }))}
              placeholder="https://wa.me/5544..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" /> Cidade
              </Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData((p) => ({ ...p, cidade: e.target.value }))}
                placeholder="Ex: Umuarama"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                Horário de Envio
              </Label>
              <Select
                value={formData.hora_envio}
                onValueChange={(value) => setFormData((p) => ({ ...p, hora_envio: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manha">☀️ Manhã</SelectItem>
                  <SelectItem value="noite">🌙 Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Temperatura inicial */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4" /> Temperatura inicial
            </Label>
            <div className="flex gap-2">
              {(['frio', 'morno', 'quente'] as Temperatura[]).map((temp) => {
                const cfg = TEMPERATURA_CONFIG[temp];
                const ativo = formData.temperatura === temp;
                return (
                  <button
                    type="button"
                    key={temp}
                    onClick={() => setFormData((p) => ({ ...p, temperatura: temp }))}
                    className={cn(
                      'flex-1 text-sm py-1.5 rounded-lg border transition-all',
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

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" /> Observação
            </Label>
            <ExpandableTextarea
              value={formData.observacao}
              onChange={(val) => setFormData((p) => ({ ...p, observacao: val }))}
              placeholder="Anotações para usar na prospecção..."
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4" /> Categoria do Lead
            </Label>
            <RadioGroup
              value={formData.categoria_lead}
              onValueChange={(value) => setFormData((p) => ({ ...p, categoria_lead: value }))}
              className="space-y-2"
            >
              {(Object.entries(CATEGORIA_LEAD_CONFIG) as [CategoriaLead, typeof CATEGORIA_LEAD_CONFIG[CategoriaLead]][]).map(([key, config]) => (
                <div key={key} className="flex items-start space-x-3">
                  <RadioGroupItem value={key} id={`create-${key}`} className="mt-0.5" />
                  <Label htmlFor={`create-${key}`} className="font-normal cursor-pointer">
                    <span className={`font-semibold ${config.color}`}>{config.label}</span>
                    <span className="text-muted-foreground text-xs block">{config.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Script</Label>
            <Select
              value={formData.script_id}
              onValueChange={(value) => setFormData((p) => ({ ...p, script_id: value }))}
            >
              <SelectTrigger>
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

          <Button type="submit" className="w-full" disabled={createLead.isPending}>
            {createLead.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</>
            ) : (
              'Criar Lead'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
