import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { OrderItem } from '@/lib/types';
import { toast } from 'sonner';
import { X, Search, Plus, Minus, Check, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import logoCompact from '@/assets/logo-compact.png';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  editOrderId?: string | null;
  initialCustomerName?: string;
  initialCart?: Record<string, number>;
  initialNotes?: string;
}

export function NewOrderModal({ 
  open, 
  onClose, 
  editOrderId, 
  initialCustomerName, 
  initialCart,
  initialNotes 
}: NewOrderModalProps) {
  const { products, categories, addOrder, updateOrder } = useAppStore();
  
  // Estados do Formulário
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Sincronizar dados ao abrir o modal (especialmente para edição)
  useEffect(() => {
    if (open) {
      setCustomerName(initialCustomerName || '');
      setNotes(initialNotes || '');
      setCart(initialCart || {});
      setShowSummary(false);
      setSearch('');
    }
  }, [open, initialCustomerName, initialCart, initialNotes]);

  // Filtro de Busca
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      categories.find(c => c.id === p.categoryId)?.name.toLowerCase().includes(q)
    );
  }, [products, search, categories]);

  // Agrupamento por Categoria
  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof filteredProducts> = {};
    filteredProducts.forEach(p => {
      if (!groups[p.categoryId]) groups[p.categoryId] = [];
      groups[p.categoryId].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Cálculo do Total
  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return sum + (p ? Number(p.price) * qty : 0);
    }, 0);
  }, [cart, products]);

  // Transformar cart em lista de itens para o banco
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => {
      const p = products.find(prod => prod.id === id)!;
      return { 
        productId: id, 
        productName: p.name, 
        quantity, 
        unitPrice: Number(p.price) 
      };
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

  const handleConfirm = async () => {
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente ou mesa.');
      return;
    }
    setLoading(true);
    try {
      if (editOrderId) {
        await updateOrder(editOrderId, customerName.trim(), cartItems, notes.trim());
      } else {
        await addOrder(customerName.trim(), cartItems, notes.trim());
      }
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar o pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? `${cat.emoji} ${cat.name}` : 'Geral';
  };

  // --- TELA DE RESUMO ---
  if (showSummary) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <h2 className="text-lg font-black text-primary uppercase italic">Revisar Pedido</h2>
          <button onClick={() => setShowSummary(false)} className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-4">
            <p className="text-[10px] font-black text-primary uppercase">Cliente / Mesa</p>
            <p className="text-xl font-black text-foreground">{customerName}</p>
          </div>

          <div className="bg-card border-2 border-border rounded-2xl p-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase mb-3 font-mono">Itens Escolhidos</p>
            <div className="space-y-3">
              {cartItems.map((item, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                  <span className="text-sm font-bold text-foreground leading-tight">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-sm font-black text-primary ml-4">
                    R$ {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {notes.trim() && (
            <div className="bg-orange-500/10 border-2 border-orange-500/20 rounded-2xl p-4">
              <p className="text-[10px] font-black text-orange-600 uppercase flex items-center gap-1 mb-1">
                <MessageSquare className="w-3 h-3" /> Observações Especiais
              </p>
              <p className="text-sm font-medium text-foreground italic">"{notes}"</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border space-y-3 shadow-2xl">
          <div className="flex justify-between items-center">
            <span className="font-bold text-muted-foreground uppercase text-xs">Total do Pedido</span>
            <span className="text-3xl font-black text-primary">R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSummary(false)} className="flex-1 py-4 bg-secondary rounded-xl font-black uppercase text-xs">Voltar</button>
            <button 
              onClick={handleConfirm} 
              disabled={loading} 
              className="flex-[2] py-4 bg-primary text-white rounded-xl font-black uppercase shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA DE SELEÇÃO ---
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src={logoCompact} alt="logo" className="h-8" />
          <h2 className="text-lg font-black text-primary uppercase italic">
            {editOrderId ? 'Editar' : 'Novo'} Pedido
          </h2>
        </div>
        <button onClick={onClose} className="p-2 bg-secondary rounded-full"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Nome do Cliente */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Cliente / Mesa *</label>
          <input 
            value={customerName} 
            onChange={e => setCustomerName(e.target.value)} 
            placeholder="Ex: Mesa 10 ou Guilherme" 
            className="w-full p-4 rounded-xl bg-input border-2 border-border focus:border-primary outline-none font-bold text-lg" 
          />
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar lanche, bebida..." 
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-input border-2 border-border focus:border-primary outline-none" 
          />
        </div>

        {/* Cardápio */}
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([catId, prods]) => (
            <div key={catId} className="space-y-3">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
                {getCategoryLabel(catId)}
              </h3>
              <div className="grid gap-3">
                {prods.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-card border-2 border-border rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex-1">
                      <p className="text-base font-bold text-foreground leading-tight">{p.name}</p>
                      <p className="text-sm font-black text-primary">R$ {Number(p.price).toFixed(2)}</p>
                    </div>
                    
                    {/* --- BOTÃO MELHORADO AQUI --- */}
                    <div className="ml-2">
                      {(cart[p.id] || 0) > 0 ? (
                        <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/50 shadow-inner">
                          <button 
                            onClick={() => updateQty(p.id, -1)} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm border border-border hover:bg-destructive hover:text-white hover:border-destructive transition-all active:scale-90"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <span className="w-6 text-center font-black text-sm text-foreground">
                            {cart[p.id]}
                          </span>
                          
                          <button 
                            onClick={() => updateQty(p.id, 1)} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:brightness-110 transition-all active:scale-90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => updateQty(p.id, 1)} 
                          className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {/* --------------------------- */}
                    
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Observações */}
        <div className="pt-6 border-t-2 border-dashed border-border space-y-2 pb-10">
          <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> Observações do Pedido
          </label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder="Ex: Sem cebola, ponto da carne mal passado, extra molho..." 
            className="w-full p-4 rounded-2xl bg-input border-2 border-border focus:border-primary outline-none font-medium text-sm h-32 resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-card border-t-2 border-border space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center px-1">
          <span className="font-bold text-muted-foreground uppercase text-[10px]">Subtotal</span>
          <span className="text-2xl font-black text-primary">R$ {total.toFixed(2)}</span>
        </div>
        <button 
          onClick={() => {
            if (total === 0) return toast.error('Adicione itens ao carrinho!');
            if (!customerName.trim()) return toast.error('Nome do cliente obrigatório!');
            setShowSummary(true);
          }}
          className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm tracking-widest"
        >
          Revisar Pedido →
        </button>
      </div>
    </div>
  );
}