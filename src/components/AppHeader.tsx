import { useState } from 'react';
import { Menu, X, Home, Package, Users, BarChart3, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const navItems = [
  { to: '/dashboard' as const, label: 'Início (Painel Diário)', icon: Home },
  { to: '/products' as const, label: 'Produtos', icon: Package },
  { to: '/users' as const, label: 'Usuários', icon: Users },
  { to: '/reports' as const, label: 'Relatórios & Arquivados', icon: BarChart3 },
];

export function AppHeader({ onNewOrder }: { onNewOrder: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Você saiu do sistema.');
    navigate({ to: '/' });
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-primary tracking-tight">🍔 Gardens Lanches</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-3">
          <button
            onClick={onNewOrder}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            + Novo Pedido
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <nav className="relative w-72 bg-sidebar h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <span className="font-bold text-sidebar-primary text-lg">🍔 Gardens</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-sidebar-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-sidebar-border">
              <p className="text-sm text-muted-foreground">Minha Conta</p>
              <p className="font-semibold text-sidebar-foreground">{user?.name || 'Usuário'}</p>
            </div>

            <div className="flex-1 py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-sidebar-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
