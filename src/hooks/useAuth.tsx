import { useState, useEffect, useCallback } from 'preact/hooks';
import { api } from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then((user) => {
          setState({ user, loading: false, error: null });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setState({ user: null, loading: false, error: null });
        });
    } else {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem('token', token);
      setState({ user, loading: false, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState((s) => ({ ...s, loading: false, error: message }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setState({ user: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}
