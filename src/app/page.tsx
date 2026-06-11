import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * The root page component that redirects users based on their authentication status.
 * 
 * Initial state: Checks for an active session.
 * Final state: Redirects to /dashboard if a session exists, otherwise redirects to /login.
 */
export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
