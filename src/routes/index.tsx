import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { NewOrderModal } from '@/components/NewOrderModal';
import { AppHeader } from '@/components/AppHeader';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNewOrder={() => setOrderModalOpen(true)} />
      <main className="pt-[120px] px-4 pb-8">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Painel Diário
        </h2>
        <KanbanBoard />
      </main>
      <NewOrderModal open={orderModalOpen} onClose={() => setOrderModalOpen(false)} />
    </div>
  );
}
