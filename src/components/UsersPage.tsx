import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function UsersPage() {
  const { users, addUser, deleteUser } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !username.trim() || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (password.length < 4) {
      toast.error('A senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    addUser({ name: name.trim(), username: username.trim(), password });
    toast.success('Usuário criado!');
    setName('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowForm(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" className="p-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-bold text-foreground">Usuários</h2>
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
              placeholder="Nome completo"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="Senha (mín. 4 dígitos)"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirmar senha"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Criar Usuário'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <button
                onClick={() => { deleteUser(u.id); toast.success(`"${u.name}" removido.`); }}
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
