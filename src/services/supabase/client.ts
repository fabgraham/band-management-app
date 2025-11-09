import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { supabaseUrl, supabaseAnonKey } = (Constants.expoConfig?.extra ??
  {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Add supabaseUrl and supabaseAnonKey to app.json > expo.extra.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
