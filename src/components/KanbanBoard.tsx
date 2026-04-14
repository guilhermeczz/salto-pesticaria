import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';
import { Clock, ChefHat, UtensilsCrossed, CheckCircle2, Trash2, Pencil, CreditCard, Banknote, Smartphone, X } from 'lucide-react';

const columns: { status: OrderStatus; label: string; icon: React.ElementType; nextAction?: { label: string; nextStatus: OrderStatus } }[] = [
  { status: 'new', label: 'NOVOS', icon: Clock, nextAction: { label: 'Iniciar Preparo', nextStatus: 'preparing' } },
  { status: 'preparing', label: 'EM PREPARO', icon: ChefHat, nextAction: { label: 'Pronto!', nextStatus: 'ready' } },
  { status: 'ready', label: 'MESA / RETIRAR', icon: UtensilsCrossed, nextAction: { label: 'Pagar Agora', nextStatus: 'paid' } },
  { status: 'paid', label: 'PAGOS', icon: CheckCircle2 },
];

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'credito', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'debito', label: 'Cartão de Débito', icon: CreditCard },
];

function DeleteConfirmDialog({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
        <h3 className="text-lg font-bold text-foreground">Excluir Pedido?</h3>
        <p className="text-sm text-muted-foreground">Deseja mesmo excluir este pedido? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm">Excluir</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ order, open, onClose, onConfirm }: { order: Order; open: boolean; onClose: () => void; onConfirm: (method: PaymentMethod) => void }) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Revisão de Pagamento</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-background rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Pedido #{String(order.number).padStart(3, '0')} — {order.customerName}</p>
          {order.items.map((item, i) => (
            <p key={i} className="text-sm text-foreground">{item.quantity}x {item.productName}</p>
          ))}
          <p className="text-lg font-bold text-primary mt-2">R$ {order.total.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Forma de Pagamento *</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(pm => (
              <button
                key={pm.value}
                onClick={() => setSelected(pm.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  selected === pm.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:border-primary/50'
                }`}
              >
                <pm.icon className="w-4 h-4" />
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            if (!selected) {
              toast.error('Selecione a forma de pagamento.');
              return;
            }
            onConfirm(selected);
          }}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-transform"
        >
          Confirmar Pagamento
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order, nextAction, onEdit, onDelete }: {
  order: Order;
  nextAction?: { label: string; nextStatus: OrderStatus };
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const { moveOrder, payOrder } = useAppStore();
  const [showPayment, setShowPayment] = useState(false);

  const handleMove = () => {
    if (!nextAction) return;
    if (nextAction.nextStatus === 'paid') {
      setShowPayment(true);
      return;
    }
    moveOrder(order.id, nextAction.nextStatus);
    toast.success(`Pedido #${String(order.number).padStart(3, '0')} movido!`);
  };

  const paymentLabels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    credito: 'Crédito',
    debito: 'Débito',
  };

  return (
    <>
      <div className="bg-order-card border border-order-card-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary text-sm">
            PEDIDO #{String(order.number).padStart(3, '0')}
          </span>
          <div className="flex items-center gap-1">
            {order.paid && <CheckCircle2 className="w-5 h-5 text-primary" />}
            {order.status === 'new' && onEdit && (
              <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-foreground font-semibold uppercase">{order.customerName}</p>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {order.items.map((item, i) => (
            <p key={i}>{item.quantity}x {item.productName}</p>
          ))}
        </div>
        <p className="font-bold text-foreground">R$ {order.total.toFixed(2)}</p>
        {order.paid && order.paymentMethod && (
          <p className="text-xs text-primary font-medium">💳 {paymentLabels[order.paymentMethod]}</p>
        )}
        {nextAction && (
          <button
            onClick={handleMove}
            className="w-full mt-1 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-transform"
          >
            {nextAction.label}
          </button>
        )}
      </div>
      <PaymentModal
        order={order}
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onConfirm={(method) => {
          payOrder(order.id, method);
          setShowPayment(false);
          toast.success(`Pedido #${String(order.number).padStart(3, '0')} pago!`);
        }}
      />
    </>
  );
}

interface KanbanBoardProps {
  onEditOrder?: (order: Order) => void;
}

export function KanbanBoard({ onEditOrder }: KanbanBoardProps) {
  const { getTodayOrders, deleteOrder } = useAppStore();
  const todayOrders = getTodayOrders();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto kanban-scroll pb-4 snap-x snap-mandatory">
        {columns.map((col) => {
          const colOrders = todayOrders.filter(o => o.status === col.status);
          return (
            <div key={col.status} className="min-w-[260px] w-[260px] flex-shrink-0 snap-start flex flex-col">
              <div className="bg-kanban-column-header rounded-t-lg px-3 py-2 flex items-center gap-2">
                <col.icon className="w-4 h-4 text-primary-foreground" />
                <span className="font-bold text-sm text-primary-foreground">{col.label}</span>
                <span className="ml-auto bg-primary-foreground/20 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>
              <div className="bg-kanban-column rounded-b-lg p-2 space-y-2 min-h-[80vh] overflow-y-auto flex-1">
                {colOrders.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum pedido</p>
                )}
                {colOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    nextAction={col.nextAction}
                    onEdit={col.status === 'new' && onEditOrder ? () => onEditOrder(order) : undefined}
                    onDelete={() => setDeleteTarget(order.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          if (deleteTarget) {
            deleteOrder(deleteTarget);
            toast.success('Pedido excluído.');
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
