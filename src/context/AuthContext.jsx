import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/index.js';
import { TOKEN_KEY } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [status, setStatus] = useState(() => (localStorage.getItem(TOKEN_KEY) ? 'checking' : 'anonymous'));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const applySession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setStatus('anonymous');
      return () => { active = false; };
    }
    authApi
      .me()
      .then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setStatus('authenticated');
      })
      .catch(() => {
        if (active) clearSession();
      });
    return () => { active = false; };
  }, [token, clearSession]);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener('temu:unauthorized', onUnauthorized);
    return () => window.removeEventListener('temu:unauthorized', onUnauthorized);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const session = await authApi.login(credentials);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const session = await authApi.register(payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session is cleared even if the network call fails.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: status === 'authenticated' && user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, token, status, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
