import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { NewOrderModal } from '@/components/NewOrderModal';
import { AppHeader } from '@/components/AppHeader';
import type { Order } from '@/lib/types';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const handleNewOrder = () => {
    setEditOrder(null);
    setOrderModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditOrder(order);
    setOrderModalOpen(true);
  };

  const handleCloseModal = () => {
    setOrderModalOpen(false);
    setEditOrder(null);
  };

  // Build initial cart from edit order
  const initialCart = editOrder
    ? Object.fromEntries(editOrder.items.map(item => [item.productId, item.quantity]))
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNewOrder={handleNewOrder} />
      <main className="pt-[120px] px-4 pb-8">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Painel Diário
        </h2>
        <KanbanBoard onEditOrder={handleEditOrder} />
      </main>
      <NewOrderModal
        open={orderModalOpen}
        onClose={handleCloseModal}
        editOrderId={editOrder?.id}
        initialCustomerName={editOrder?.customerName}
        initialCart={initialCart}
      />
    </div>
  );
}
