import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isConfigured, isDemoMode } from '@/lib/config';

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  // Forçar redirecionamento canônico para https://www.sistemasegueme.com.br
  if (host === 'sistemasegueme.com.br' || (host.includes('sistemasegueme.com.br') && proto === 'http')) {
    const url = request.nextUrl.clone();
    url.host = 'www.sistemasegueme.com.br';
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  let response = NextResponse.next({ request });
  if (!isConfigured() || isDemoMode()) return response;

  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await db.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|offline.html).*)'] };
