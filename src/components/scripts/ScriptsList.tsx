import { useState } from 'react';
import { Script, Niche } from '@/types/leads';
import { useScripts, useCreateScript, useUpdateScript } from '@/hooks/useScripts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function ScriptsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    niche: 'delivery' as Niche,
    versao: '1.0',
    ativo: true,
  });

  const { data: scripts, isLoading } = useScripts();
  const createScript = useCreateScript();
  const updateScript = useUpdateScript();

  const handleOpenDialog = (script?: Script) => {
    if (script) {
      setEditingScript(script);
      setFormData({
        nome: script.nome,
        niche: script.niche,
        versao: script.versao,
        ativo: script.ativo,
      });
    } else {
      setEditingScript(null);
      setFormData({
        nome: '',
        niche: 'delivery',
        versao: '1.0',
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingScript) {
      updateScript.mutate(
        { id: editingScript.id, updates: formData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingScript(null);
          },
        }
      );
    } else {
      createScript.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  const isPending = createScript.isPending || updateScript.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scripts de Prospecção</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os scripts utilizados nas prospecções
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Script
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingScript ? 'Editar Script' : 'Novo Script'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome do Script</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex: Script Delivery v1"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Nicho</Label>
                <Select
                  value={formData.niche}
                  onValueChange={(value: Niche) =>
                    setFormData((prev) => ({ ...prev, niche: value }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="multimarcas">Multimarcas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Versão</Label>
                <Input
                  value={formData.versao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, versao: e.target.value }))
                  }
                  placeholder="1.0"
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, ativo: checked }))
                  }
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isPending || !formData.nome}
                className="w-full mt-4"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingScript ? (
                  'Atualizar Script'
                ) : (
                  'Criar Script'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : scripts?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum script cadastrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scripts?.map((script) => (
                <TableRow key={script.id}>
                  <TableCell className="font-medium">{script.nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {script.niche === 'delivery' ? 'Delivery' : 'Multimarcas'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    v{script.versao}
                  </TableCell>
                  <TableCell>
                    {script.ativo ? (
                      <Badge className="bg-success/20 text-success border-0">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(script.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(script)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
