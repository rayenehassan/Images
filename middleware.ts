import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = createMiddlewareClient(
    { req, res },
    supabaseUrl && supabaseAnon ? { supabaseUrl, supabaseKey: supabaseAnon } : undefined
  );
  const { data: { session } } = await supabase.auth.getSession();

  const protectedPaths = ['/dashboard', '/api/generate', '/api/projects', '/account'];
  const isProtected = protectedPaths.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + '/'));

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
