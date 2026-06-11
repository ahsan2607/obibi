import { createBrowserClient, SupabaseClient } from '@supabase/ssr';

/**
 * Creates and returns a Supabase browser client, ensuring a single instance is used.
 * 
 * Initial state: Checks for environment variables and existing global instances.
 * Final state: Returns a configured SupabaseClient for browser usage.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  // Use globalThis for a truly robust singleton across all environments and HMR
  const globalSupabase = globalThis as unknown as { supabaseBrowserClient?: SupabaseClient };
  
  if (typeof window !== 'undefined') {
    if (globalSupabase.supabaseBrowserClient) {
      return globalSupabase.supabaseBrowserClient;
    }
  }

  console.log('[Supabase] Initializing new browser client with cookie storage and lock bypass...');

  const client = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lockType: 'custom',
      async acquireLock() {
        return true;
      },
      async releaseLock() {
      },
    },
  });

  if (typeof window !== 'undefined') {
    globalSupabase.supabaseBrowserClient = client;
  }

  return client;
}

export const supabase = typeof window !== 'undefined' ? createClient() : (null as unknown as SupabaseClient);
