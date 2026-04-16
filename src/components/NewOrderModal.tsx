import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { OrderItem } from '@/lib/types';
import { toast } from 'sonner';
import { X, Search, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  editOrderId?: string | null;
  initialCustomerName?: string;
  initialCart?: Record<string, number>;
  initialNotes?: string;
}

export function NewOrderModal({ open, onClose, editOrderId, initialCustomerName, initialCart, initialNotes }: NewOrderModalProps) {
  const { products, categories, addOrder, updateOrder } = useAppStore();

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderType, setOrderType] = useState<'Local' | 'Delivery' | 'Retirada' | ''>('');
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustomerName(initialCustomerName ?? '');
    
    // Identifica e separa o tipo de pedido caso esteja editando
    let parsedNotes = initialNotes ?? '';
    let parsedType: any = '';
    if (parsedNotes.includes('[LOCAL]')) { parsedType = 'Local'; parsedNotes = parsedNotes.replace('[LOCAL]', '').trim(); }
    else if (parsedNotes.includes('[DELIVERY]')) { parsedType = 'Delivery'; parsedNotes = parsedNotes.replace('[DELIVERY]', '').trim(); }
    else if (parsedNotes.includes('[RETIRADA]')) { parsedType = 'Retirada'; parsedNotes = parsedNotes.replace('[RETIRADA]', '').trim(); }
    
    setNotes(parsedNotes);
    setOrderType(parsedType);
    setCart(initialCart ?? {});
    setSearch('');
    setShowSummary(false);
  }, [open, initialCustomerName, initialNotes, initialCart]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      return p.name.toLowerCase().includes(q) || (cat?.name?.toLowerCase().includes(q) ?? false);
    });
  }, [products, search, categories]);

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, p) => {
      if (!acc[p.categoryId]) acc[p.categoryId] = [];
      acc[p.categoryId].push(p);
      return acc;
    }, {} as Record<string, typeof filteredProducts>);
  }, [filteredProducts]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find(prod => prod.id === id);
      if (!p) return sum;
      return sum + Number(p.price) * qty;
    }, 0);
  }, [cart, products]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const p = products.find(prod => prod.id === id);
        if (!p) return null;
        return { productId: id, productName: p.name, quantity, unitPrice: Number(p.price) };
      })
      .filter(Boolean) as OrderItem[];
  }, [cart, products]);

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      const next = (prev[productId] || 0) + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleConfirm = async () => {
    if (!customerName.trim()) return toast.error('Informe o nome do cliente.');
    if (cartItems.length === 0) return toast.error('O carrinho está vazio.');
    if (!orderType) return toast.error('Selecione se o pedido é Local, Delivery ou Retirada.');
    
    setLoading(true);
    try {
      // Junta a tag do tipo com a observação para facilitar na cozinha
      const finalNotes = `[${orderType.toUpperCase()}] ${notes}`.trim();

      if (editOrderId) {
        await updateOrder(editOrderId, customerName.trim(), cartItems, finalNotes);
      } else {
        await addOrder(customerName.trim(), cartItems, finalNotes);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const getCategoryLabel = (catId: string) => categories.find(c => c.id === catId)?.name ?? 'Geral';
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-3xl h-full max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-background/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {showSummary && <button onClick={() => setShowSummary(false)} className="mr-2 hover:text-primary transition-all hover:-translate-x-1"><ArrowLeft className="w-5 h-5"/></button>}
            <ShoppingBag className="w-5 h-5 text-primary" />
            {editOrderId ? 'Editar Pedido' : 'Novo Pedido'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-destructive hover:text-white rounded-full transition-all hover:rotate-90"><X className="w-5 h-5" /></button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {showSummary ? (
            <div className="space-y-4 animate-fade-in">
              
              {/* === OPÇÕES DE TIPO DE PEDIDO (OBRIGATÓRIO) === */}
              <div className="bg-background p-5 rounded-xl border border-border shadow-sm">
                <h3 className="font-bold text-muted-foreground mb-3">Tipo de Pedido <span className="text-destructive">*</span></h3>
                <div className="grid grid-cols-3 gap-3">
                  {['Local', 'Delivery', 'Retirada'].map(type => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type as any)}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${
                        orderType === type 
                          ? 'bg-primary/20 border-primary text-primary shadow-md scale-[1.02]' 
                          : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-bold text-lg">{customerName}</p>
                {notes && <p className="text-sm italic mt-2 text-muted-foreground">Obs: {notes}</p>}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-muted-foreground mb-3">Itens do Pedido</h3>
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl transition-all hover:border-primary/50">
                    <div>
                      <span className="font-bold text-primary mr-3">{item.quantity}x</span>
                      <span className="font-medium">{item.productName}</span>
                    </div>
                    <span className="text-muted-foreground">{formatMoney(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Cliente e Busca */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Nome do Cliente</label>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="- Nome"
                    /* 👇 Fundo branco e texto preto 👇 */
                    className="w-full bg-white text-black placeholder:text-gray-400 border border-border rounded-xl px-4 py-3 focus:border-primary focus:shadow-[0_0_10px_rgba(255,106,0,0.2)] outline-none transition-all font-medium"
                  />
                </div>
                
                <div className="relative group">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar no cardápio..."
                    /* 👇 Fundo branco e texto preto 👇 */
                    className="w-full bg-white text-black placeholder:text-gray-400 border border-border rounded-xl pl-10 pr-4 py-3 focus:border-primary focus:shadow-[0_0_10px_rgba(255,106,0,0.2)] outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Lista de Produtos */}
              <div className="space-y-6 mt-6">
                {Object.entries(groupedProducts).map(([catId, prods]) => (
                  <div key={catId} className="space-y-3">
                    <h3 className="font-bold text-lg border-b border-border pb-2 text-primary">{getCategoryLabel(catId)}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {prods.map(p => {
                        const qty = cart[p.id] || 0;
                        return (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl transition-all hover:border-primary/50 hover:shadow-md">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{p.name}</span>
                              <span className="text-xs text-muted-foreground">{formatMoney(Number(p.price))}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-muted p-1 rounded-lg">
                              <button onClick={() => updateQty(p.id, -1)} className="w-8 h-8 flex items-center justify-center bg-background rounded-md shadow-sm hover:text-destructive hover:bg-destructive/10 transition-colors"><Minus className="w-4 h-4"/></button>
                              <span className="w-4 text-center font-bold">{qty}</span>
                              <button onClick={() => updateQty(p.id, 1)} className="w-8 h-8 flex items-center justify-center bg-primary text-black rounded-md shadow-sm hover:opacity-90 transition-transform active:scale-90"><Plus className="w-4 h-4"/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Observações do Pedido</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola..."
                  /* 👇 Fundo branco e texto preto 👇 */
                  className="w-full bg-white text-black placeholder:text-gray-400 border border-border rounded-xl px-4 py-3 focus:border-primary focus:shadow-[0_0_10px_rgba(255,106,0,0.2)] outline-none transition-all h-24 resize-none font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER FIXO */}
        <div className="p-4 border-t border-border bg-background/50">
          {!showSummary ? (
            <button 
              onClick={() => setShowSummary(true)} 
              className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl text-lg shadow-lg hover:shadow-[0_0_15px_rgba(255,106,0,0.4)] transition-all hover:-translate-y-1 active:scale-95 flex justify-between px-6"
            >
              <span>Revisar Pedido</span>
              <span>{formatMoney(total)}</span>
            </button>
          ) : (
            <button 
              onClick={handleConfirm} 
              disabled={loading || cartItems.length === 0}
              className="w-full py-4 bg-green-600 text-white font-black rounded-xl text-lg shadow-lg hover:bg-green-500 transition-all hover:-translate-y-1 active:scale-95 flex justify-between px-6 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <span>{loading ? 'Salvando...' : 'Confirmar e Enviar'}</span>
              <span>{formatMoney(total)}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}