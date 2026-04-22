import { useState } from 'react';
import { Menu, X, Home, Package, Users, BarChart3, LogOut, Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const navItems = [
  { to: '/dashboard' as const, label: 'Início (Painel Diário)', icon: Home },
  { to: '/products' as const, label: 'Produtos', icon: Package },
  { to: '/users' as const, label: 'Usuários', icon: Users },
  { to: '/reports' as const, label: 'Relatórios & Arquivados', icon: BarChart3 },
  { to: '/cash-register' as const, label: 'Controle de Caixa', icon: Wallet },
];

// 👇 Logo Corrigida (Caixa mais larga para não cortar o texto) 👇
export function SaltoGrandeLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 350 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fogo Laranja */}
      <path d="M30 40 C30 40 15 25 25 10 C25 10 35 20 38 5 C38 5 50 25 45 40 Z" fill="#ea580c" />
      {/* Base da Grelha */}
      <rect x="10" y="42" width="60" height="6" rx="2" fill="#1f2937" />
      <rect x="20" y="48" width="8" height="8" fill="#1f2937" />
      <rect x="52" y="48" width="8" height="8" fill="#1f2937" />
      {/* Texto Salto Grande */}
      <text x="80" y="32" fontFamily="sans-serif" fontWeight="900" fontSize="24" fill="currentColor">SALTO GRANDE</text>
      <text x="82" y="48" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="#ea580c" letterSpacing="0.15em">GRILL E PETISCARIA</text>
    </svg>
  );
}

export function AppHeader({ onNewOrder }: { onNewOrder: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout?.();
      toast.success('Você saiu do sistema.');
      setDrawerOpen(false);
      navigate({ to: '/' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao sair do sistema.');
    }
  };

  const currentPath = location.pathname?.replace(/\/$/, '');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-md border-b border-border transition-all print:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 text-foreground hover:text-primary transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300 text-foreground">
            {/* INSERINDO A LOGO AQUI */}
            <SaltoGrandeLogo />
          </div>

          <div className="w-10" />
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={onNewOrder}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,106,0,0.4)] hover:-translate-y-0.5 active:scale-95"
          >
            + Novo Pedido
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)} />

          <nav className="relative w-72 bg-card border-r border-border h-full flex flex-col shadow-2xl animate-slide-right">
            <div className="flex items-center justify-between p-4 border-b border-border text-foreground">
              {/* INSERINDO A LOGO AQUI NA SIDEBAR */}
              <SaltoGrandeLogo className="h-6 w-auto" />
              <button onClick={() => setDrawerOpen(false)} className="p-1 hover:text-primary transition-all hover:rotate-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 border-b border-border bg-background/50">
              <p className="text-sm text-muted-foreground mb-1">Operador Logado</p>
              <p className="font-bold text-lg text-primary">
                {user?.name ?? 'Usuário Admin'}
              </p>
            </div>

            <div className="flex-1 py-4 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`group flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all hover:bg-muted hover:pl-8 ${
                      isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-border bg-background/50">
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sair do Sistema
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}