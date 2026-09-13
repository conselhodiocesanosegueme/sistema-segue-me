import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash') || searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (isDemoMode()) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = await supabaseServer();

  // 1. Suporte a PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
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
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error('[AUTH CONFIRM] Erro ao verificar token OTP:', error);
  }

  return NextResponse.redirect(new URL('/entrar?error=auth_failed', request.url));
}
