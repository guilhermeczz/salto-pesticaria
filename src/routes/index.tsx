// @ts-ignore
if (typeof window !== 'undefined' && !window.crypto.randomUUID) {
  // @ts-ignore
  window.crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';

export const Route = createFileRoute('/')({
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

 const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      // Agora verificamos se o retorno foi verdadeiro
      const success = await login(loginUser.trim(), loginPass);
      
      if (success) {
        // Só navega se o login for real
        navigate({ to: '/dashboard' });
      }
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
      const success = await register(regName.trim(), regUser.trim(), regPass);
      
      if (success) {
        // Após registrar, ele já loga e navega
        navigate({ to: '/dashboard' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const inputClass = "w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoFull} alt="Gardens Lanches" className="w-40 h-40 mx-auto object-contain" width={512} height={512} />
          <p className="text-sm text-muted-foreground mt-2">Gestão de Pedidos</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
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
