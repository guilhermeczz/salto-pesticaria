import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode
} from 'react';

import { supabase } from './supabase';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  name: string;
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (name: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Função auxiliar para formatar o usuário vindo do Supabase
  const formatUser = (supabaseUser: any): AuthUser => ({
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || 'Operador',
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
  });

  // 🔒 VERIFICAÇÃO DE SESSÃO ATIVA
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(formatUser(session.user));
      }
      setIsInitializing(false);
    };

    initializeAuth();

    // Escuta mudanças de estado (Login, Logout, aba fechada)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(formatUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🚪 LOGIN
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const cleanUsername = username.toLowerCase().trim();
      const email = `${cleanUsername}@gardens.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Erro 400 ou 401 cai aqui
        toast.error('Usuário ou senha inválidos.');
        return false;
      }

      if (data.user) {
        setUser(formatUser(data.user));
        toast.success(`Bem-vindo, ${data.user.user_metadata?.full_name || cleanUsername}!`);
      }
      
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      toast.error('Erro inesperado ao conectar ao servidor.');
      return false;
    }
  }, []);

  // 📝 CADASTRO (REGISTER)
  const register = useCallback(async (name: string, username: string, password: string): Promise<boolean> => {
    try {
      const cleanUsername = username.toLowerCase().trim();
      const email = `${cleanUsername}@gardens.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            username: cleanUsername,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este nome de usuário já está em uso.');
        } else {
          toast.error('Erro: A senha precisa ter no mínimo 6 dígitos.');
        }
        return false;
      }

      if (data.user) {
        toast.success('Conta criada com sucesso!');
        // O onAuthStateChange cuidará do login automático se o Supabase estiver configurado para auto-confirm
      }
      
      return true;
    } catch (err) {
      console.error('Erro no cadastro:', err);
      toast.error('Erro inesperado no cadastro.');
      return false;
    }
  }, []);

  // 📤 LOGOUT
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.info('Sessão encerrada.');
  }, []);

  // Tela de carregamento enquanto o Supabase verifica se você já está logado
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-primary font-medium">Iniciando sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return ctx;
}