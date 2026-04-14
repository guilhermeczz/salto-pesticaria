import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { ProductCategory } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const categoryLabels: Record<ProductCategory, string> = {
  lanches: '🍔 Lanches',
  porcoes: '🍟 Porções',
  bebidas: '🥤 Bebidas',
};

export function ProductsPage() {
  const { products, addProduct, deleteProduct } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('lanches');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !price) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    addProduct({ name: name.trim(), price: parseFloat(price), category });
    toast.success('Produto salvo!');
    setName('');
    setPrice('');
    setCategory('lanches');
    setShowForm(false);
    setLoading(false);
  };

  const handleDelete = (id: string, productName: string) => {
    deleteProduct(id);
    toast.success(`"${productName}" removido.`);
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-bold text-foreground">Produtos</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto p-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do produto"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={price}
              onChange={e => setPrice(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Preço (R$)"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ProductCategory)}
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="lanches">Lanches</option>
              <option value="porcoes">Porções</option>
              <option value="bebidas">Bebidas</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[p.category]} · R$ {p.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
