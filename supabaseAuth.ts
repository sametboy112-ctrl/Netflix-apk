const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const authHeaders = {
  apikey: supabaseAnonKey,
  'Content-Type': 'application/json',
};

export interface SupabaseSessionUser {
  id: string;
  email: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
}

export const supabaseAuth = {
  async signInWithPassword(email: string, password: string) {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.error_description || error?.msg || 'Failed to sign in with Supabase.');
    }
    return res.json();
  },

  async signUp(email: string, password: string, name: string) {
    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ email, password, data: { full_name: name } }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.error_description || error?.msg || 'Failed to create Supabase account.');
    }
    return res.json();
  },

  signInWithGoogle() {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const url = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    window.location.href = url;
  },
};
