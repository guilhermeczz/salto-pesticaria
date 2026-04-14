import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { OrderItem } from '@/lib/types';
import { toast } from 'sonner';
import { X, Search, Plus, Minus } from 'lucide-react';

export function NewOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, addOrder } = useAppStore();
  const [customerName, setCustomerName] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [productId, qty]) => {
      const product = products.find(p => p.id === productId);
      return sum + (product ? product.price * qty : 0);
    }, 0);
  }, [cart, products]);

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleConfirm = async () => {
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente ou mesa.');
      return;
    }
    if (total === 0) {
      toast.error('Adicione pelo menos um item ao pedido.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const items: OrderItem[] = Object.entries(cart).map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId)!;
      return {
        productId,
        productName: product.name,
        quantity,
        unitPrice: product.price,
      };
    });

    addOrder(customerName.trim(), items);
    toast.success('Pedido criado com sucesso!');
    setCustomerName('');
    setSearch('');
    setCart({});
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  const categoryLabels: Record<string, string> = {
    lanches: '🍔 Lanches',
    porcoes: '🍟 Porções',
    bebidas: '🥤 Bebidas',
  };

  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof filteredProducts> = {};
    filteredProducts.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filteredProducts]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-primary">Novo Pedido</h2>
        <button onClick={onClose} className="p-1 text-muted-foreground">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Customer name */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Cliente / Mesa *
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex: Carlos P. ou Mesa 4"
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Products by category */}
        {Object.entries(groupedProducts).map(([cat, prods]) => (
          <div key={cat}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
              {categoryLabels[cat] || cat}
            </h3>
            <div className="space-y-1.5">
              {prods.map(product => {
                const qty = cart[product.id] || 0;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-card rounded-lg px-3 py-2.5 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-primary font-bold">R$ {product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {qty > 0 && (
                        <>
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center text-foreground">{qty}</span>
                        </>
                      )}
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:scale-90 transition-transform"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 space-y-2 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Salvando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}
