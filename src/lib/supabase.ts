import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || 'https://ztouzjhajzfdezshuglx.supabase.co',
      import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    );
  }
  return supabase;
};

export default getSupabaseClient;