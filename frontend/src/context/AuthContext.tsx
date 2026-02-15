import { createContext, useContext, useState, useRef, type ReactNode, useEffect } from 'react';

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  getMasterKey: () => CryptoKey | null;
  login: (userData: User, authToken: string, masterKey: CryptoKey) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const masterKeyRef = useRef<CryptoKey | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Note: Master key cannot be restored from localStorage (it's not extractable)
      // User will need to re-enter password if page is refreshed
    }
  }, []);

  const login = (userData: User, authToken: string, masterKey: CryptoKey) => {
    setUser(userData);
    setToken(authToken);
    masterKeyRef.current = masterKey;
    
    // Persist to localStorage
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    masterKeyRef.current = null;
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const getMasterKey = (): CryptoKey | null => {
    return masterKeyRef.current;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        getMasterKey,
        login,
        logout,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
