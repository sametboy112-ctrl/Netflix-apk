import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { supabaseAuth } from './supabaseAuth';

interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  watchHistory?: any[];
  socialLinks?: any[];
  preferences?: any;
  setupComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'flixvzn_session';

const saveSession = (user: User, token: string) => localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessTokenFromHash = hashParams.get('access_token');
      const refreshTokenFromHash = hashParams.get('refresh_token');
      if (accessTokenFromHash) {
        const profileRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessTokenFromHash}`,
          },
        });
        const profile = await profileRes.json();
        const oauthUser = {
          id: profile.id,
          email: profile.email,
          name: profile.user_metadata?.full_name || profile.user_metadata?.name || 'User',
          avatarUrl: profile.user_metadata?.avatar_url || '',
          setupComplete: false,
          watchHistory: [],
          socialLinks: [],
          bio: '',
          preferences: { theme: 'dark', autoplay: true },
        };
        setUser(oauthUser);
        setToken(accessTokenFromHash);
        localStorage.setItem('token', accessTokenFromHash);
        saveSession(oauthUser, accessTokenFromHash);
        if (refreshTokenFromHash) localStorage.setItem('supabase_refresh_token', refreshTokenFromHash);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        setLoading(false);
        return;
      }

      const localSession = localStorage.getItem(SESSION_KEY);
      if (localSession) {
        try {
          const parsed = JSON.parse(localSession);
          if (parsed?.user && parsed?.token) {
            setUser(parsed.user);
            setToken(parsed.token);
            localStorage.setItem('token', parsed.token);
            axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          const res = await axios.get('/api/user/me');
          setUser(res.data);
          setToken(storedToken);
          saveSession(res.data, storedToken);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (user?.preferences?.theme) {
      document.documentElement.classList.toggle('light', user.preferences.theme === 'light');
      document.documentElement.classList.toggle('dark', user.preferences.theme !== 'light');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const session = await supabaseAuth.signInWithPassword(normalizedEmail, password);
    const safeUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
      avatarUrl: session.user.user_metadata?.avatar_url || '',
      setupComplete: false,
      watchHistory: [],
      socialLinks: [],
      bio: '',
      preferences: { theme: 'dark', autoplay: true },
    };
    setToken(session.access_token);
    setUser(safeUser);
    localStorage.setItem('token', session.access_token);
    if (session.refresh_token) localStorage.setItem('supabase_refresh_token', session.refresh_token);
    saveSession(safeUser, session.access_token);
    axios.defaults.headers.common.Authorization = `Bearer ${session.access_token}`;
  };

  const register = async (email: string, password: string, name: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    await supabaseAuth.signUp(normalizedEmail, password, name.trim());
  };

  const googleLogin = async () => {
    supabaseAuth.signInWithGoogle();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('isAdmin');
    delete axios.defaults.headers.common.Authorization;
  };

  const value = useMemo(
    () => ({ user, token, login, register, googleLogin, logout, loading }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
