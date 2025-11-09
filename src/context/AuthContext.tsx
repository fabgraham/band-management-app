import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { signInWithEmail, signOutUser, signUpWithEmail, sendPasswordResetEmail } from '../services/auth/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  errorMessage: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const SESSION_KEY = 'bandmate-session';

  const persistSession = async (session: Session | null) => {
    if (session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  };

  const applySession = async (session: Session | null) => {
    setUser(session?.user ?? null);
    await persistSession(session);
  };

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed: Session = JSON.parse(stored);
          await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          });
        }
      } catch (error) {
        console.warn('Failed to restore auth session', error);
      }
    };

    restoreSession();

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        void applySession(data.session ?? null);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      void applySession(session);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        throw error;
      }

      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      setErrorMessage(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await signUpWithEmail(email, password);

      if (error) {
        throw error;
      }

      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register';
      setErrorMessage(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await sendPasswordResetEmail(email);
      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset link';
      setErrorMessage(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      errorMessage,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [errorMessage, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
