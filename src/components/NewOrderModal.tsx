import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { OrderItem } from '@/lib/types';
import { toast } from 'sonner';
import { X, Search, Plus, Minus, ArrowLeft, Check } from 'lucide-react';
import logoCompact from '@/assets/logo-compact.png';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  editOrderId?: string | null;
  initialCustomerName?: string;
  initialCart?: Record<string, number>;
}

export function NewOrderModal({ open, onClose, editOrderId, initialCustomerName, initialCart }: NewOrderModalProps) {
  const { products, categories, addOrder, updateOrder } = useAppStore();
  const [customerName, setCustomerName] = useState(initialCustomerName || '');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>(initialCart || {});
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Reset state when opening with new data
  useMemo(() => {
    if (open) {
      setCustomerName(initialCustomerName || '');
      setCart(initialCart || {});
      setShowSummary(false);
      setSearch('');
    }
  }, [open, initialCustomerName, initialCart]);

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

  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof filteredProducts> = {};
    filteredProducts.forEach(p => {
      if (!groups[p.categoryId]) groups[p.categoryId] = [];
      groups[p.categoryId].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId)!;
      return { productId, productName: product.name, quantity, unitPrice: product.price };
    });
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

  const handleAdvance = () => {
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente ou mesa.');
      return;
    }
    if (total === 0) {
      toast.error('Adicione pelo menos um item ao pedido.');
      return;
    }
    setShowSummary(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const items: OrderItem[] = cartItems;

    if (editOrderId) {
      updateOrder(editOrderId, customerName.trim(), items);
      toast.success('Pedido atualizado com sucesso!');
    } else {
      addOrder(customerName.trim(), items);
      toast.success('Pedido criado com sucesso!');
    }
    setCustomerName('');
    setSearch('');
    setCart({});
    setShowSummary(false);
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? `${cat.emoji} ${cat.name}` : catId;
  };

  // Summary screen
  if (showSummary) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-bold text-primary">Resumo do Pedido</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Cliente / Mesa</p>
            <p className="text-base font-bold text-foreground">{customerName}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase mb-2">Itens do Pedido</p>
            {cartItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">{item.quantity}x {item.productName}</p>
                </div>
                <p className="text-sm font-bold text-foreground">R$ {(item.quantity * item.unitPrice).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 space-y-2 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSummary(false)}
              className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold text-base active:scale-[0.98] transition-transform"
            >
              Voltar e Editar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {loading ? 'Salvando...' : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={logoCompact} alt="Gardens Lanches" className="h-8 w-auto" />
          <h2 className="text-lg font-bold text-primary">{editOrderId ? 'Editar Pedido' : 'Novo Pedido'}</h2>
        </div>
        <button onClick={onClose} className="p-1 text-muted-foreground">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Cliente / Mesa *
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex: Carlos P. ou Mesa 4"
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {Object.entries(groupedProducts).map(([catId, prods]) => (
          <div key={catId}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
              {getCategoryLabel(catId)}
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

      <div className="border-t border-border px-4 py-3 space-y-2 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleAdvance}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-transform"
        >
          Revisar Pedido →
        </button>
      </div>
    </div>
  );
}
