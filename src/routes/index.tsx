// @ts-ignore
import React from "react";

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
import { useState } from 'react';
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
      const success = await login(loginUser.trim(), loginPass);
      if (success) {
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
    if (regPass.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
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
        navigate({ to: '/dashboard' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const inputClass = "w-full bg-white text-black placeholder:text-gray-400 border border-border rounded-xl px-4 py-3.5 focus:border-primary focus:shadow-[0_0_10px_rgba(255,106,0,0.2)] outline-none transition-all font-medium";

  return (
    <div className="min-h-screen w-full flex bg-background">
      
      {/* LADO ESQUERDO: Banner com Imagem (Escondido no Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-end p-16 overflow-hidden">
        {/* Imagem de Fundo (Unsplash API) */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1999&auto=format&fit=crop"
            alt="Hambúrguer Artesanal"
            className="w-full h-full object-cover opacity-50 scale-105 hover:scale-100 transition-transform duration-[10s] ease-out"
          />
          {/* Gradiente escuro para garantir leitura do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Texto de Impacto */}
        <div className="relative z-10 animate-slide-up">
          <h1 className="text-5xl xl:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
            A agilidade que a sua <br/>
            <span className="text-primary">cozinha precisa.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-md font-medium leading-relaxed drop-shadow-md">
            Gestão inteligente de pedidos, PDV integrado e impressão automática. Tudo em uma única plataforma.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-hidden">
        
        {/* Efeito de luz (Glow) suave no fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          
          <div className="text-center mb-8">
            <img src={logoFull} alt="Gardens Lanches" className="w-48 h-48 mx-auto object-contain drop-shadow-2xl" width={512} height={512} />
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex mb-8 bg-background/80 rounded-xl p-1.5 border border-border shadow-inner">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  tab === 'login'
                    ? 'bg-primary text-black shadow-md scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Fazer Login
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                  tab === 'register'
                    ? 'bg-primary text-black shadow-md scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {tab === 'login' ? (
              <div className="space-y-4 animate-fade-in">
                <input
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  placeholder="Usuário"
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
                  className="w-full mt-4 py-4 rounded-xl bg-primary text-black font-black text-[15px] shadow-[0_0_20px_rgba(255,106,0,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-[0_0_25px_rgba(255,106,0,0.4)] hover:-translate-y-0.5"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? 'Autenticando...' : 'Acessar o Sistema'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <input
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Nome completo"
                  className={inputClass}
                />
                <input
                  value={regUser}
                  onChange={e => setRegUser(e.target.value)}
                  placeholder="Usuário"
                  className={inputClass}
                />
                <input
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
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
                  className="w-full mt-4 py-4 rounded-xl bg-primary text-black font-black text-[15px] shadow-[0_0_20px_rgba(255,106,0,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-[0_0_25px_rgba(255,106,0,0.4)] hover:-translate-y-0.5"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? 'Registrando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            )}
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
            &copy; {new Date().getFullYear()} Gardens Lanches. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}