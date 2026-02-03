import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars!',
    'VITE_SUPABASE_URL:', supabaseUrl ? 'set' : 'MISSING',
    'VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'set' : 'MISSING'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Custom lock function to prevent AbortError
      lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
        // Execute function directly without locking mechanism
        return await fn();
      },
    },
    global: {
      headers: {
        'x-client-info': 'deesse-pearls',
      },
    },
  }
);
