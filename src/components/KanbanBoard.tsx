import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';
import { 
  Clock, ChefHat, UtensilsCrossed, CheckCircle2, Trash2, 
  Pencil, CreditCard, Banknote, Smartphone, X, Printer, MessageSquare 
} from 'lucide-react';
import { printOrder } from '@/lib/printService';

const columns: { status: OrderStatus; label: string; icon: React.ElementType; nextAction?: { label: string; nextStatus: OrderStatus } }[] = [
  { status: 'new', label: 'NOVOS', icon: Clock, nextAction: { label: 'Iniciar Preparo', nextStatus: 'preparing' } },
  { status: 'preparing', label: 'EM PREPARO', icon: ChefHat, nextAction: { label: 'Pronto!', nextStatus: 'ready' } },
  { status: 'ready', label: 'MESA / RETIRAR', icon: UtensilsCrossed, nextAction: { label: 'Pagar Agora', nextStatus: 'paid' } },
  { status: 'paid', label: 'PAGOS', icon: CheckCircle2 },
];

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
  { value: 'debito', label: 'Débito', icon: CreditCard },
];

// ... (O PaymentModal e o OrderCard continuam EXATAMENTE iguais ao seu código anterior) ...
function PaymentModal({ order, open, onClose, onConfirm }: { order: Order; open: boolean; onClose: () => void; onConfirm: (method: PaymentMethod) => void }) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Revisão de Pagamento</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-background rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-black">{order.customerName}</p>
          {order.items.map((item, i) => (
            <p key={i} className="text-sm text-foreground">{item.quantity}x {item.productName}</p>
          ))}
          <p className="text-lg font-black text-primary mt-2">R$ {order.total.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map(pm => (
            <button
              key={pm.value}
              onClick={() => setSelected(pm.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                selected === pm.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:border-primary/50'
              }`}
            >
              <pm.icon className="w-4 h-4" /> {pm.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (!selected) return toast.error('Selecione a forma de pagamento.');
            onConfirm(selected);
          }}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black uppercase text-xs shadow-lg hover:brightness-110"
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
    toast.success(`Pedido movido!`);
  };

  const paymentLabels: Record<string, string> = {
    dinheiro: 'Dinheiro', pix: 'PIX', credito: 'Crédito', debito: 'Débito'
  };

  return (
    <>
      <div className="bg-card border border-border/60 hover:border-primary/40 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="font-black text-primary text-[10px] italic">#{String(order.id).slice(-4).toUpperCase()}</span>
          {/* Ações visíveis sempre no desktop para agilidade */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => { printOrder(order); toast.info("Enviando para impressora..."); }} 
              className="p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-white transition-colors"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>
            {order.status === 'new' && onEdit && (
              <button onClick={onEdit} className="p-1.5 bg-secondary rounded-lg text-muted-foreground hover:bg-foreground hover:text-background transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
            )}
            <button onClick={onDelete} className="p-1.5 bg-destructive/10 rounded-lg text-destructive hover:bg-destructive hover:text-white transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <p className="font-black text-lg text-foreground uppercase truncate leading-tight">{order.customerName}</p>
        
        <div className="text-xs text-muted-foreground space-y-0.5 font-bold">
          {order.items.map((item, i) => (
            <p key={i}>• {item.quantity}x {item.productName}</p>
          ))}
        </div>

        {order.notes && (
          <div className="bg-orange-500/10 border-l-4 border-orange-500 p-2 rounded-r-lg">
            <p className="text-[9px] font-black text-orange-600 uppercase flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> OBSERVAÇÃO:
            </p>
            <p className="text-[11px] font-bold text-foreground leading-tight italic">{order.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/60">
          <p className="font-black text-xl text-primary">R$ {order.total.toFixed(2)}</p>
          {order.paid && <CheckCircle2 className="w-6 h-6 text-primary" />}
        </div>

        {order.paid && order.paymentMethod && (
          <p className="text-[10px] text-primary font-black uppercase italic tracking-widest">💳 {paymentLabels[order.paymentMethod]}</p>
        )}

        {nextAction && (
          <button
            onClick={handleMove}
            className="w-full py-3 mt-2 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-sm hover:shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
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
          toast.success(`Pedido pago!`);
        }}
      />
    </>
  );
}

export function KanbanBoard({ onEditOrder }: { onEditOrder?: (order: Order) => void }) {
  const { getTodayOrders, deleteOrder } = useAppStore();
  const todayOrders = getTodayOrders();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    // MUDANÇA PRINCIPAL: De flex horizontal para GRID de 4 colunas!
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
      {columns.map((col) => {
        const colOrders = todayOrders.filter(o => o.status === col.status);
        return (
          <div key={col.status} className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="p-2.5 bg-primary rounded-xl text-primary-foreground shadow-md shadow-primary/20">
                <col.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-foreground leading-none">{col.label}</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{colOrders.length} Pedidos</span>
              </div>
            </div>

            {/* Altura adaptada para preencher a tela e rolar apenas internamente */}
            <div className="flex-1 bg-secondary/10 rounded-2xl p-3 border border-border/50 space-y-4 h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
              {colOrders.length === 0 && <p className="text-[10px] font-black uppercase text-muted-foreground/30 text-center py-20 tracking-widest">Vazio</p>}
              {colOrders.map(order => (
                <OrderCard key={order.id} order={order} nextAction={col.nextAction} onEdit={onEditOrder ? () => onEditOrder(order) : undefined} onDelete={() => setDeleteTarget(order.id)} />
              ))}
            </div>
          </div>
        );
      })}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-card p-8 rounded-3xl w-full max-w-md text-center space-y-6 border border-border shadow-2xl">
            <Trash2 className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-2xl font-black uppercase italic text-foreground">Excluir Pedido?</p>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-secondary hover:bg-secondary/80 rounded-xl font-black uppercase text-xs transition-colors">Cancelar</button>
              <button onClick={() => { deleteOrder(deleteTarget!); setDeleteTarget(null); toast.success("Pedido excluído!"); }} className="flex-1 py-4 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-destructive/20 transition-colors">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}