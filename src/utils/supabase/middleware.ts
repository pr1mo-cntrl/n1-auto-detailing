import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value,}) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  
const t0 = performance.now();
const {
  data: { user },
} = await supabase.auth.getUser();
const t1 = performance.now();
console.log(`[PERF][Middleware:auth.getUser] Took ${(t1 - t0).toFixed(2)}ms | path: ${request.nextUrl.pathname}`);
console.log('--- MIDDLEWARE RUN ---', {
  path: request.nextUrl.pathname,
  hasUser: !!user,
});

const isLoginPage = request.nextUrl.pathname.startsWith('/login');
const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

if (!user && isDashboardPage) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  const redirectResponse = NextResponse.redirect(url);
  
  // Copy all updated cookies from supabaseResponse to the redirect response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return redirectResponse;
}

if (user && isLoginPage) {
  const url = request.nextUrl.clone();
  url.pathname = '/dashboard';
  const redirectResponse = NextResponse.redirect(url);

  // Copy all updated cookies from supabaseResponse to the redirect response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return redirectResponse;
}

return supabaseResponse;
}