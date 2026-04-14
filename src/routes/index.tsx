import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate({ to: '/dashboard' });
    return null;
  }

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      await login(loginUser.trim(), loginPass);
      toast.success('Bem-vindo!');
      navigate({ to: '/dashboard' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regUser.trim() || !regPass || !regConfirm) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (regPass.length < 4) {
      toast.error('A senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (regPass !== regConfirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await register(regName.trim(), regUser.trim(), regPass);
      toast.success('Conta criada com sucesso!');
      navigate({ to: '/dashboard' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🍔</span>
          <h1 className="text-2xl font-extrabold text-primary mt-2 tracking-tight">
            Gardens Lanches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de Pedidos</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {/* Tabs */}
          <div className="flex mb-6 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === 'login'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Fazer Login
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === 'register'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {tab === 'login' ? (
            <div className="space-y-4">
              <input
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="E-mail ou Usuário"
                className={inputClass}
              />
              <input
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                type="password"
                placeholder="Senha"
                className={inputClass}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="Nome completo"
                className={inputClass}
              />
              <input
                value={regUser}
                onChange={e => setRegUser(e.target.value)}
                placeholder="E-mail ou Usuário"
                className={inputClass}
              />
              <input
                value={regPass}
                onChange={e => setRegPass(e.target.value)}
                type="password"
                placeholder="Senha (mín. 4 caracteres)"
                className={inputClass}
              />
              <input
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
                type="password"
                placeholder="Confirmar senha"
                className={inputClass}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Criando...' : 'Criar Conta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
