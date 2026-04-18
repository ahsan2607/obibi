// middleware.ts  (in your project root)

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Create a response object so we can modify cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Update the request cookies (for this request)
            request.cookies.set(name, value);
            // Update the response cookies (so browser gets them)
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // This is crucial — it refreshes the session if the access token is expired
  const { data: { session } } = await supabase.auth.getSession();

  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/chat',
    '/obat',
    '/jadwal-obat',
    '/laporan-kepatuhan',
    '/interaksi-obat',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If user tries to access protected route without session → redirect to login
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and tries to access /login → redirect to dashboard/chat
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

// Optional: Configure which routes the middleware runs on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};