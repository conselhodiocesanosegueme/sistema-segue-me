import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isDemoMode } from '@/lib/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash') || searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  // Base URL segura: detecta localhost/127.0.0.1 em desenvolvimento ou força https://www.sistemasegueme.com.br em produção
  const host = request.headers.get('host') || '';
  const isLocal = process.env.NODE_ENV === 'development' || host.includes('localhost') || host.includes('127.0.0.1');
  const baseUrl = isLocal
    ? `http://${host || 'localhost:3000'}`
    : 'https://www.sistemasegueme.com.br';

  if (isDemoMode()) {
    return NextResponse.redirect(new URL(next, baseUrl));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                sameSite: 'lax',
                secure: baseUrl.startsWith('https'),
              });
            });
          } catch {
            // Contexto read-only
          }
        },
      },
    }
  );

  // 1. Suporte a PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, baseUrl));
    }
    console.error('[AUTH CONFIRM] Erro ao trocar code por sessão:', error);
  }

  // 2. Suporte a OTP / Token Hash (magic link, signup, recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, baseUrl));
    }
    console.error('[AUTH CONFIRM] Erro ao verificar token OTP:', error);
  }

  return NextResponse.redirect(new URL('/entrar?error=auth_failed', baseUrl));
}
