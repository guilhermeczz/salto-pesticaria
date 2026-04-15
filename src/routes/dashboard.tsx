import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { NewOrderModal } from '@/components/NewOrderModal';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import type { Order } from '@/lib/types';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { isAuthenticated, logout, user } = useAuth();
  // 1. Puxamos os "products" também para poder achar o ID correto na hora de editar
  const { orders, products } = useAppStore(); 
  
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  // --- SEGURANÇA: Se não estiver logado, volta para o login ---
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

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

  // 2. A MÁGICA ACONTECE AQUI: Prepara o carrinho inicial achando o ID real do produto
  const initialCart: Record<string, number> = {};
  if (editOrder) {
    editOrder.items.forEach(item => {
      // Procura no cardápio qual é o produto que tem esse nome
      const originalProduct = products.find(p => p.name === item.productName);
      
      if (originalProduct) {
        initialCart[originalProduct.id] = item.quantity;
      } else if (item.productId) {
        // Fallback caso seja um produto que já foi deletado do cardápio
        initialCart[item.productId] = item.quantity;
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNewOrder={handleNewOrder} />
      
      <main className="pt-[120px] px-4 pb-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Painel Diário
            </h2>
            <p className="text-2xl font-bold text-foreground">
              Olá, {user?.name || 'Operador'}! 👋
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-xs text-muted-foreground block uppercase">Pedidos Hoje</span>
            <span className="text-xl font-bold text-primary">{orders.length}</span>
          </div>
        </div>

        <KanbanBoard onEditOrder={handleEditOrder} />
      </main>

      <NewOrderModal
        open={orderModalOpen}
        onClose={handleCloseModal}
        editOrderId={editOrder?.id}
        initialCustomerName={editOrder?.customerName}
        initialCart={initialCart}
        initialNotes={editOrder?.notes} /* 3. Faltava essa linha para puxar a observação! */
      />
    </div>
  );
}