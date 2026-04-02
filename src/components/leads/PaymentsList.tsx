import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Check, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment, Payment } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaymentsListProps {
  leadId: string;
  leadName: string;
}

export function PaymentsList({ leadId, leadName }: PaymentsListProps) {
  const { data: payments = [], isLoading } = usePayments(leadId);
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const handleCreate = () => {
    if (!valor) return;
    createPayment.mutate({
      lead_id: leadId,
      descricao: descricao || undefined,
      valor: parseFloat(valor),
      data_vencimento: dataVencimento ? new Date(dataVencimento).toISOString() : undefined,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setDescricao('');
        setValor('');
        setDataVencimento('');
      }
    });
  };

  const handleMarkPaid = (payment: Payment) => {
    updatePayment.mutate({
      id: payment.id,
      leadId,
      updates: { status: 'pago', data_pagamento: new Date().toISOString() } as any,
    });
  };

  const totalValue = payments.reduce((sum, p) => sum + Number(p.valor), 0);
  const paidValue = payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.valor), 0);
  const pendingValue = totalValue - paidValue;

  const statusIcon = (status: string) => {
    if (status === 'pago') return <Check className="w-3.5 h-3.5 text-green-500" />;
    if (status === 'atrasado') return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
    return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Pagamentos
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Parcela
        </Button>
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-secondary/30">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold">R$ {totalValue.toLocaleString('pt-BR')}</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="text-sm font-bold text-green-500">R$ {paidValue.toLocaleString('pt-BR')}</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="text-sm font-bold text-yellow-500">R$ {pendingValue.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
          <div>
            <Label className="text-xs">Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Parcela 1/2" className="bg-secondary/50 h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" className="bg-secondary/50 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Vencimento</Label>
              <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="bg-secondary/50 h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!valor || createPayment.isPending} className="flex-1">Adicionar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Payment list */}
      <div className="space-y-2">
        {payments.map((payment) => (
          <div key={payment.id} className={cn(
            "flex items-center justify-between p-3 rounded-lg bg-secondary/30",
            payment.status === 'pago' && 'opacity-60'
          )}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {statusIcon(payment.status)}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{payment.descricao || 'Parcela'}</p>
                {payment.data_vencimento && (
                  <p className="text-xs text-muted-foreground">
                    Venc: {format(new Date(payment.data_vencimento), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold whitespace-nowrap">
                R$ {Number(payment.valor).toLocaleString('pt-BR')}
              </span>
              {payment.status !== 'pago' && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMarkPaid(payment)} title="Marcar como pago">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deletePayment.mutate({ id: payment.id, leadId })}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {payments.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parcela cadastrada</p>
        )}
      </div>
    </div>
  );
}
