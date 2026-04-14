import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Pencil, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function ProductsPage() {
  const { products, categories, addProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useAppStore();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [loading, setLoading] = useState(false);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('📦');
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const handleSubmitProduct = async () => {
    if (!name.trim() || !price || !categoryId) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    addProduct({ name: name.trim(), price: parseFloat(price), categoryId });
    toast.success('Produto salvo!');
    setName('');
    setPrice('');
    setShowForm(false);
    setLoading(false);
  };

  const handleSubmitCategory = () => {
    if (!catName.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }
    if (editCatId) {
      updateCategory({ id: editCatId, name: catName.trim(), emoji: catEmoji });
      toast.success('Categoria atualizada!');
    } else {
      addCategory({ name: catName.trim(), emoji: catEmoji });
      toast.success('Categoria criada!');
    }
    setCatName('');
    setCatEmoji('📦');
    setEditCatId(null);
    setShowCatForm(false);
  };

  const startEditCategory = (cat: { id: string; name: string; emoji: string }) => {
    setCatName(cat.name);
    setCatEmoji(cat.emoji);
    setEditCatId(cat.id);
    setShowCatForm(true);
  };

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? `${cat.emoji} ${cat.name}` : '';
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" className="p-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-bold text-foreground">Produtos</h2>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'products' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Lista de Produtos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'categories' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Categorias
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="p-2 rounded-lg bg-primary text-primary-foreground"
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
                  className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="Preço (R$)"
                  className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleSubmitProduct}
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
                      {getCategoryLabel(p.categoryId)} · R$ {p.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => { deleteProduct(p.id); toast.success(`"${p.name}" removido.`); }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => { setShowCatForm(!showCatForm); setEditCatId(null); setCatName(''); setCatEmoji('📦'); }}
                className="p-2 rounded-lg bg-primary text-primary-foreground"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {showCatForm && (
              <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={catEmoji}
                    onChange={e => setCatEmoji(e.target.value)}
                    placeholder="Emoji"
                    className="w-16 px-3 py-2.5 rounded-lg bg-input border border-border text-foreground text-base text-center focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={4}
                  />
                  <input
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    placeholder="Nome da categoria"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  {editCatId && (
                    <button
                      onClick={() => { setShowCatForm(false); setEditCatId(null); }}
                      className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleSubmitCategory}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
                  >
                    {editCatId ? 'Atualizar' : 'Criar Categoria'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditCategory(cat)}
                      className="p-2 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { deleteCategory(cat.id); toast.success(`"${cat.name}" removida.`); }}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
