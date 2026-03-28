import { createContext, useContext, useState, useCallback } from 'react';
import { getToken, setToken, clearToken } from '../api/cmsApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());

  const login = useCallback((t) => {
    setToken(t);
    setTokenState(t);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
