import type { Order, OrderStatus } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Clock, ChefHat, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

const columns: { status: OrderStatus; label: string; icon: React.ElementType; nextAction?: { label: string; nextStatus: OrderStatus } }[] = [
  { status: 'new', label: 'NOVOS', icon: Clock, nextAction: { label: 'Iniciar Preparo', nextStatus: 'preparing' } },
  { status: 'preparing', label: 'EM PREPARO', icon: ChefHat, nextAction: { label: 'Pronto!', nextStatus: 'ready' } },
  { status: 'ready', label: 'MESA / RETIRAR', icon: UtensilsCrossed, nextAction: { label: 'Pagar Agora', nextStatus: 'paid' } },
  { status: 'paid', label: 'PAGOS', icon: CheckCircle2 },
];

function OrderCard({ order, nextAction }: { order: Order; nextAction?: { label: string; nextStatus: OrderStatus } }) {
  const { moveOrder } = useAppStore();

  const handleMove = () => {
    if (!nextAction) return;
    moveOrder(order.id, nextAction.nextStatus);
    toast.success(`Pedido #${String(order.number).padStart(3, '0')} movido!`);
  };

  return (
    <div className="bg-order-card border border-order-card-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-primary text-sm">
          PEDIDO #{String(order.number).padStart(3, '0')}
        </span>
        {order.status === 'paid' && <CheckCircle2 className="w-5 h-5 text-primary" />}
      </div>
      <p className="text-xs text-foreground font-semibold uppercase">{order.customerName}</p>
      <div className="text-xs text-muted-foreground space-y-0.5">
        {order.items.map((item, i) => (
          <p key={i}>{item.quantity}x {item.productName}</p>
        ))}
      </div>
      <p className="font-bold text-foreground">R$ {order.total.toFixed(2)}</p>
      {nextAction && (
        <button
          onClick={handleMove}
          className="w-full mt-1 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-transform"
        >
          {nextAction.label}
        </button>
      )}
    </div>
  );
}

export function KanbanBoard() {
  const { getTodayOrders } = useAppStore();
  const todayOrders = getTodayOrders();

  return (
    <div className="flex gap-3 overflow-x-auto kanban-scroll pb-4 snap-x snap-mandatory">
      {columns.map((col) => {
        const colOrders = todayOrders.filter(o => o.status === col.status);
        return (
          <div key={col.status} className="min-w-[260px] w-[260px] flex-shrink-0 snap-start">
            <div className="bg-kanban-column-header rounded-t-lg px-3 py-2 flex items-center gap-2">
              <col.icon className="w-4 h-4 text-primary-foreground" />
              <span className="font-bold text-sm text-primary-foreground">{col.label}</span>
              <span className="ml-auto bg-primary-foreground/20 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {colOrders.length}
              </span>
            </div>
            <div className="bg-kanban-column rounded-b-lg p-2 space-y-2 min-h-[200px]">
              {colOrders.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum pedido</p>
              )}
              {colOrders.map(order => (
                <OrderCard key={order.id} order={order} nextAction={col.nextAction} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
