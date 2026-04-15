import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
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

  // --- PERSISTÊNCIA: Recupera o usuário ao abrir o site ---
  useEffect(() => {
    const savedUser = localStorage.getItem('gardens_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // Consulta real no banco buscando nome e senha
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.error("Erro Supabase:", error);
        toast.error("Erro técnico ao conectar ao banco.");
        return false;
      }

      if (!data) {
        toast.error("Usuário ou senha incorretos.");
        return false;
      }

      const userData: AuthUser = { 
        id: data.id, 
        name: data.nome, 
        username: data.username 
      };

      // Salva no estado e no navegador (Persistência)
      setUser(userData);
      localStorage.setItem('gardens_user', JSON.stringify(userData));
      
      toast.success(`Bem-vindo, ${data.nome}!`);
      return true;
    } catch (err) {
      toast.error("Falha na rede ou servidor.");
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, username: string, password: string): Promise<boolean> => {
    try {
      // 1. Verifica se já existe esse login
      const { data: existing } = await supabase
        .from('usuarios')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        toast.error("Este nome de usuário já está em uso!");
        return false;
      }

      // 2. Insere o novo usuário
      const { error } = await supabase.from('usuarios').insert([{
        nome: name,
        username: username,
        password: password
      }]);

      if (error) {
        toast.error("Erro ao criar conta no banco.");
        return false;
      }

      toast.success("Conta criada! Agora faça o login.");
      return true;
    } catch (err) {
      toast.error("Erro ao processar cadastro.");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('gardens_user');
    toast.info("Você saiu do sistema.");
  }, []);

  // Enquanto estiver checando o localStorage, não renderiza nada para evitar "piscada" de tela
  if (isInitializing) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}