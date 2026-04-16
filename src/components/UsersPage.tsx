import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, X, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

// Funções de auxílio visual (Mantidas como você gosta)
const getInitials = (name: string) => {
  return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
};

const getAvatarColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export function UsersPage() {
  // 1. Pegamos o fetchUsers do Store (vou configurar ele no seu próximo arquivo)
  const { users, deleteUser, fetchUsers } = useAppStore();
  const { register } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 2. Carrega a lista de usuários assim que abre a página
  useEffect(() => {
    if (fetchUsers) fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async () => {
    if (!name.trim() || !username.trim() || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    // 3. Cria o acesso oficial no Supabase Auth
    const success = await register(name.trim(), username.trim(), password);

    if (success) {
      // Pequeno delay para o banco processar o Trigger (gatilho) e a lista atualizar
      setTimeout(async () => {
        if (fetchUsers) await fetchUsers(); 
        toast.success('Operador cadastrado e liberado!');
        setName(''); setUsername(''); setPassword(''); setConfirmPassword('');
        setShowForm(false);
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white text-black placeholder:text-gray-400 border border-border rounded-xl px-4 py-3.5 focus:border-primary focus:shadow-[0_0_15px_rgba(255,106,0,0.3)] outline-none transition-all font-medium";

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-6 animate-fade-in">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm hover:-translate-x-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-3xl font-black text-primary drop-shadow-sm">Equipe e Acessos</h2>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-black font-black px-6 py-3 rounded-xl text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(255,106,0,0.3)]"
            >
              <Plus className="w-5 h-5" /> Adicionar Operador
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ backgroundColor: '#111' }} className="border border-gray-800 p-6 rounded-2xl shadow-2xl mb-8 relative overflow-hidden animate-fade-in text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl flex items-center gap-2"><ShieldCheck className="text-primary"/> Cadastrar Operador</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-destructive hover:bg-destructive/20 rounded-lg transition-all">
                <X className="w-6 h-6"/>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Nome completo</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Nome de usuário (Login)</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Ex: joao.silva" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Senha de Acesso</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Mínimo 6 dígitos" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Confirmar Senha</label>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Repita a senha" className={inputClass} />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 py-4 rounded-xl bg-primary text-black font-black text-[15px] shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Criando Acesso...
                </>
              ) : 'Confirmar Cadastro'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.length === 0 && !showForm && (
            <p className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-2xl border border-dashed border-border font-medium">
              Nenhum usuário cadastrado além do administrador.
            </p>
          )}
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner ${getAvatarColor(u.name)}`}>
                  {getInitials(u.name)}
                </div>
                <div>
                  <p className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{u.name}</p>
                  <p className="text-sm font-medium text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded-md mt-1">@{u.username}</p>
                </div>
              </div>
              <button
                onClick={async () => { 
                  if(confirm(`Deseja realmente excluir @${u.username}?`)) {
                    await deleteUser(u.id); 
                    toast.success(`"${u.name}" removido.`); 
                  }
                }}
                className="p-3 bg-muted text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all active:scale-90 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}