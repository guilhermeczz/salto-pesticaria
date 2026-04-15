import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Pencil, X, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function ProductsPage() {
  const { products, categories, addProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useAppStore();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  // --- CORREÇÃO: Garante que o categoryId não fique vazio ao carregar ---
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('📦');
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const handleSubmitProduct = async () => {
    // Validação rigorosa
    if (!name.trim()) {
      toast.error('Informe o nome do produto.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Informe um preço válido.');
      return;
    }
    if (!categoryId) {
      toast.error('Selecione uma categoria.');
      return;
    }

    setLoading(true);
    try {
      // Chama o store e espera o resultado real do Supabase
      const success = await addProduct({ 
        name: name.trim(), 
        price: parseFloat(price), 
        categoryId 
      });

      if (success) {
        setName('');
        setPrice('');
        setShowForm(false);
        // O toast de sucesso já vem do store.tsx
      }
    } catch (error) {
      toast.error("Erro ao processar produto.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCategory = async () => {
    if (!catName.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }
    
    if (editCatId) {
      await updateCategory({ id: editCatId, name: catName.trim(), emoji: catEmoji });
    } else {
      await addCategory({ name: catName.trim(), emoji: catEmoji });
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
    return cat ? `${cat.emoji} ${cat.name}` : 'Sem categoria';
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" className="p-1 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-bold text-foreground">Gestão do Cardápio</h2>
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
                className="p-2 rounded-lg bg-primary text-primary-foreground active:scale-95 transition-transform"
              >
                {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {showForm && (
              <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome do lanche (ex: X-Salada)"
                  className={inputClass}
                />
                <input
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  placeholder="Preço R$ (ex: 20.00)"
                  className={inputClass}
                />
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleSubmitProduct}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Salvando no Banco...' : 'Salvar Produto'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {products.length === 0 && !loading && (
                <p className="text-center py-10 text-muted-foreground text-sm">Nenhum produto cadastrado.</p>
              )}
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getCategoryLabel(p.categoryId)} · <span className="text-primary font-medium">R$ {Number(p.price).toFixed(2)}</span>
                    </p>
                  </div>
                  <button
                    onClick={async () => { 
                      if(confirm(`Deseja remover ${p.name}?`)) {
                        await deleteProduct(p.id); 
                        toast.success("Removido."); 
                      }
                    }}
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
          // ... (mesmo código de categorias, mas garanta que o addCategory use await)
          <div className="space-y-4">
            <div className="flex justify-end mb-3">
              <button
                onClick={() => { setShowCatForm(!showCatForm); setEditCatId(null); setCatName(''); setCatEmoji('📦'); }}
                className="p-2 rounded-lg bg-primary text-primary-foreground"
              >
                {showCatForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {showCatForm && (
              <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={catEmoji}
                    onChange={e => setCatEmoji(e.target.value)}
                    className="w-16 px-3 py-2.5 rounded-lg bg-input border border-border text-center text-xl"
                    maxLength={2}
                  />
                  <input
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    placeholder="Nome da categoria"
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={handleSubmitCategory}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
                >
                  {editCatId ? 'Atualizar Categoria' : 'Criar Categoria'}
                </button>
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
                    <button onClick={() => startEditCategory(cat)} className="p-2 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}