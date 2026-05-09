import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || 'https://ztouzjhajzfdezshuglx.supabase.co',
      import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          headers: { 'x-application-name': 'lin-collection' },
        },
        // Only attempt to connect to WebSocket if we have a valid-looking key
        // and aren't in a broken state.
        db: {
          schema: 'public',
        },
      }
    );
  }
  return supabase;
};

// Internal flag to prevent excessive connection checks if it keeps failing
let lastCheckTime = 0;
let lastCheckResult = true;
const CHECK_COOLDOWN = 30000; // 30 seconds

/**
 * Checks if the Supabase client is properly configured and reachable
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN) {
    return lastCheckResult;
  }

  try {
    const client = getSupabaseClient();
    // Test connection with a simple health check or small query
    const { error } = await client.from('products').select('id').limit(1);
    
    lastCheckTime = now;
    if (error) {
      console.warn('⚠️ Supabase connection check failed:', error.message);
      lastCheckResult = false;
      return false;
    }
    
    lastCheckResult = true;
    return true;
  } catch (err) {
    lastCheckTime = now;
    console.error('❌ Supabase connection error:', err);
    lastCheckResult = false;
    return false;
  }
};

export default getSupabaseClient;