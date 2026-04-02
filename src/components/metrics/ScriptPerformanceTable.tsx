import { MetricsByScript } from '@/types/leads';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScriptPerformanceTableProps {
  data: MetricsByScript[];
}

export function ScriptPerformanceTable({ data }: ScriptPerformanceTableProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground">{index + 1}º</span>;
    }
  };

  const getPercentageColor = (value: number) => {
    if (value >= 70) return 'text-success';
    if (value >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Performance por Script</h3>

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum dado de performance disponível</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Script</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Canal Aberto</TableHead>
                <TableHead className="text-right">Ligação</TableHead>
                <TableHead className="text-right">Vídeo</TableHead>
                <TableHead className="text-right">Diagnóstico</TableHead>
                <TableHead className="text-right">Fechado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item.script_id}>
                  <TableCell>{getRankIcon(index)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.script_nome}
                      {index === 0 && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          Top
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.total_leads}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getPercentageColor(item.taxa_canal_aberto))}>
                    {item.taxa_canal_aberto.toFixed(1)}%
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getPercentageColor(item.taxa_ligacao_feita))}>
                    {item.taxa_ligacao_feita.toFixed(1)}%
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getPercentageColor(item.taxa_video_enviado))}>
                    {item.taxa_video_enviado.toFixed(1)}%
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getPercentageColor(item.taxa_diagnostico_marcado))}>
                    {item.taxa_diagnostico_marcado.toFixed(1)}%
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getPercentageColor(item.taxa_negocio_fechado))}>
                    {item.taxa_negocio_fechado.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
