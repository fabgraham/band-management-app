import { supabase } from '../supabase/client';

export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const sendPasswordResetEmail = async (email: string) => {
  return supabase.auth.resetPasswordForEmail(email);
};

export const signOutUser = async () => {
  return supabase.auth.signOut();
};
