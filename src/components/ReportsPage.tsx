import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR');
}

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export function ReportsPage() {
  const { getArchivedOrders } = useAppStore();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputDate(d);
  });
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));

  const orders = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    return getArchivedOrders(start, end);
  }, [startDate, endDate, getArchivedOrders]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-bold text-foreground">Relatórios & Arquivados</h2>
        </div>

        {/* Revenue card */}
        <div className="bg-primary rounded-xl p-4 mb-4">
          <p className="text-sm text-primary-foreground/80">Faturamento Total</p>
          <p className="text-2xl font-bold text-primary-foreground">
            R$ {totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-primary-foreground/60 mt-1">
            {formatDate(new Date(startDate))} — {formatDate(new Date(endDate))}
          </p>
        </div>

        {/* Date filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">
              <CalendarDays className="w-3 h-3 inline mr-1" />Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">
              <CalendarDays className="w-3 h-3 inline mr-1" />Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-2">
          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum pedido encontrado neste período.
            </p>
          )}
          {orders.map(order => (
            <div key={order.id} className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary text-sm">
                  #{String(order.number).padStart(3, '0')} — {order.customerName}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.status === 'paid'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {order.status === 'paid' ? 'PAGO' : order.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {order.createdAt.toLocaleString('pt-BR')}
                </span>
                <span className="font-bold text-sm text-foreground">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
