import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthUser {
  name: string;
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (username: string, _password: string) => {
    await new Promise(r => setTimeout(r, 1000));
    setUser({ name: username, username });
  }, []);

  const register = useCallback(async (name: string, username: string, _password: string) => {
    await new Promise(r => setTimeout(r, 1000));
    setUser({ name, username });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

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
