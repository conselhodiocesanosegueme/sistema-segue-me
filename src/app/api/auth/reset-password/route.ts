import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode, appOrigin } from '@/lib/config';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.toString().trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Por favor, informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'No modo de demonstração, a recuperação de senha é simulada.',
      });
    }

    const admin = supabaseAdmin();
    const origin = appOrigin() || new URL(request.url).origin;

    // Gera o token de recuperação de senha pelo Supabase Auth Admin
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/recuperar/redefinir`,
      },
    });

    if (linkError) {
      console.warn('[RESET PASSWORD] Erro ao gerar link para o email:', email, linkError.message);
      // Por segurança contra enumeração de emails, retornamos sucesso genérico
      return NextResponse.json({
        success: true,
        message: 'Se houver uma conta associada a este e-mail, as instruções foram enviadas para sua caixa de entrada.',
      });
    }

    // Buscar o nome da pessoa para personalizar o e-mail
    let personName: string | undefined;
    const { data: person } = await admin
      .from('people')
      .select('name')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (person?.name) {
      personName = person.name;
    } else {
      const { data: appUser } = await admin
        .from('app_users')
        .select('full_name')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      if (appUser?.full_name) {
        personName = appUser.full_name;
      }
    }

    // Montar o link oficial no próprio domínio
    const tokenHash = linkData?.properties?.hashed_token;
    const resetUrl = tokenHash
      ? `${origin}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=/recuperar/redefinir`
      : linkData?.properties?.action_link || `${origin}/recuperar/redefinir`;

    // Disparar o e-mail via Resend
    const emailRes = await sendPasswordResetEmail({
      to: email,
      name: personName,
      resetUrl,
    });

    if (!emailRes.success) {
      console.error('[RESET PASSWORD] Falha ao disparar e-mail via Resend:', emailRes);
    }

    return NextResponse.json({
      success: true,
      message: 'Instruções enviadas com sucesso! Verifique a sua caixa de entrada (e a pasta de spam).',
    });
  } catch (err: any) {
    console.error('[RESET PASSWORD] Erro inesperado:', err);
    return NextResponse.json(
      { error: 'Não foi possível processar a solicitação. Tente novamente.' },
      { status: 500 }
    );
  }
}
