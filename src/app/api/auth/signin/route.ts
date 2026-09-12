import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let email = '';
  let password = '';

  if (isJson) {
    const body = await request.json().catch(() => ({}));
    email = (body.email || '').toString().trim().toLowerCase();
    password = (body.password || '').toString();
  } else {
    const formData = await request.formData().catch(() => new FormData());
    email = formData.get('email')?.toString().trim().toLowerCase() || '';
    password = formData.get('password')?.toString() || '';
  }

  if (!email || !password) {
    if (isJson) {
      return NextResponse.json({ error: 'campos_obrigatorios' }, { status: 400 });
    }
    return NextResponse.redirect(new URL('/entrar?error=campos_obrigatorios', request.url), { status: 303 });
  }

  if (isDemoMode()) {
    if (isJson) {
      return NextResponse.json({ success: true, targetUrl: '/' });
    }
    return NextResponse.redirect(new URL('/', request.url), { status: 303 });
  }

  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      if (isJson) {
        return NextResponse.json({ error: 'credenciais_invalidas', details: error?.message }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/entrar?error=credenciais_invalidas', request.url), { status: 303 });
    }

    // Verificar perfil do usuário na tabela app_users
    const { data: profile } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const targetUrl = profile?.role === 'participant' ? '/me' : '/';

    if (isJson) {
      return NextResponse.json({ success: true, targetUrl, user: data.user });
    }
    return NextResponse.redirect(new URL(targetUrl, request.url), { status: 303 });
  } catch (err) {
    console.error('Erro na autenticação:', err);
    if (isJson) {
      return NextResponse.json({ error: 'erro_servidor' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/entrar?error=erro_servidor', request.url), { status: 303 });
  }
}
