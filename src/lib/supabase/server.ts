// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates and returns a Supabase server client for use in Server Components and API routes.
 * 
 * Initial state: Retrieves cookies from the current request.
 * Final state: Returns a configured Supabase server client with cookie handling.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.log(error)
            // This is called from Server Components where you cannot set cookies.
            // It's safe to ignore — middleware will handle session refresh instead.
          }
        },
      },
    }
  );
}
