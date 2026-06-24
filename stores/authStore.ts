import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Per-app membership gate (shared auth.users; each app needs its own row in
// public.app_memberships). Email login is gated; OAuth sign-in auto-joins
// (choosing to sign in to this app via Google IS the registration here).
const APP = 'braingame';

async function hasMembership(userId: string): Promise<boolean> {
  const { data } = await supabase
    .schema('public')
    .from('app_memberships')
    .select('app')
    .eq('user_id', userId)
    .eq('app', APP)
    .maybeSingle();
  return !!data;
}

async function ensureMembership(userId: string): Promise<void> {
  await supabase
    .schema('public')
    .from('app_memberships')
    .upsert({ user_id: userId, app: APP }, { onConflict: 'user_id,app', ignoreDuplicates: true });
}

// While true, onAuthStateChange ignores transient sessions. Email sign-in must
// authenticate (to read the membership row) BEFORE we know if the account is a
// BrainGame member — without this gate the UI flashes "logged in" then signs
// out for non-members ("masuk sebentar lalu keluar").
let gatingSignIn = false;

interface AuthState {
  user: User | null;
  session: Session | null;
  username: string;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithProvider: (provider: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Anonymous/guest play — no Supabase account required. */
  playAsGuest: (username: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  username: 'Guest',
  loading: false,
  initialized: false,

  init: async () => {
    if (!isSupabaseConfigured) {
      set({ initialized: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      username:
        (data.session?.user?.user_metadata?.username as string) ??
        data.session?.user?.email?.split('@')[0] ??
        'Guest',
      initialized: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (gatingSignIn) return; // ignore transient session during membership gate
      set({
        session,
        user: session?.user ?? null,
        username:
          (session?.user?.user_metadata?.username as string) ??
          session?.user?.email?.split('@')[0] ??
          'Guest',
      });
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    gatingSignIn = true; // hold back UI until membership is verified
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      gatingSignIn = false;
      set({ loading: false });
      return { error: error?.message ?? 'Gagal masuk.' };
    }
    if (!(await hasMembership(data.user.id))) {
      await supabase.auth.signOut();
      gatingSignIn = false;
      set({ loading: false, user: null, session: null, username: 'Guest' });
      return { error: 'Email belum terdaftar di BrainGame. Daftar dulu ya.' };
    }
    // Member confirmed — reflect the session now (gate kept the UI from flashing).
    gatingSignIn = false;
    set({
      loading: false,
      session: data.session,
      user: data.user,
      username:
        (data.user.user_metadata?.username as string) ??
        data.user.email?.split('@')[0] ??
        'Guest',
    });
    return { error: null };
  },

  signUp: async (email, password, username) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, app: APP } },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        const { data: si, error: se } = await supabase.auth.signInWithPassword({ email, password });
        if (se || !si.user) {
          set({ loading: false });
          return { error: 'Email sudah dipakai akun lain. Password salah?' };
        }
        await ensureMembership(si.user.id);
        set({ loading: false });
        return { error: null };
      }
      set({ loading: false });
      return { error: error.message };
    }
    if (data.session && data.user) await ensureMembership(data.user.id);
    set({ loading: false });
    return { error: null };
  },

  signInWithGoogle: () => get().signInWithProvider('google'),

  signInWithProvider: async (provider: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
    set({ loading: true });
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        set({ loading: false });
        return { error: error?.message ?? 'Could not start Google sign-in' };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        set({ loading: false });
        return { error: result.type === 'cancel' ? null : 'Google sign-in cancelled' };
      }

      // PKCE flow → ?code=...  | implicit flow → #access_token=...
      const url = result.url;
      const code = Linking.parse(url).queryParams?.code as string | undefined;
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exErr) {
          const { data: u } = await supabase.auth.getUser();
          if (u.user) await ensureMembership(u.user.id);
        }
        set({ loading: false });
        return { error: exErr?.message ?? null };
      }

      const fragment = url.includes('#') ? url.split('#')[1] : '';
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!setErr) {
          const { data: u } = await supabase.auth.getUser();
          if (u.user) await ensureMembership(u.user.id);
        }
        set({ loading: false });
        return { error: setErr?.message ?? null };
      }

      set({ loading: false });
      return { error: 'No session returned from Google' };
    } catch (e: any) {
      set({ loading: false });
      return { error: e?.message ?? 'Google sign-in failed' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, username: 'Guest' });
  },

  playAsGuest: (username) => set({ username: username || 'Guest' }),
}));
