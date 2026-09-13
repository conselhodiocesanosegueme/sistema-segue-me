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
    // Forçar estritamente HTTPS e WWW no domínio de produção para garantir SSL ativo e cookies seguros
    const origin = process.env.NODE_ENV === 'development' && request.headers.get('host')?.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://www.sistemasegueme.com.br';

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

    // Buscar o nome correto da pessoa/conta para personalizar o e-mail
    let personName: string | undefined;

    if (email === 'conselhodiocesano.segueme@gmail.com') {
      personName = 'Coordenação Diocesana';
    } else if (linkData?.user) {
      // 1. Verificar em app_users pelo ID do usuário
      const { data: appUser } = await admin
        .from('app_users')
        .select('full_name')
        .eq('id', linkData.user.id)
        .maybeSingle();

      if (appUser?.full_name) {
        personName = appUser.full_name;
      } else if (linkData.user.user_metadata?.full_name) {
        personName = linkData.user.user_metadata.full_name;
      }

      // 2. Se não achou em app_users, verificar se há vínculo em account_links
      if (!personName) {
        const { data: link } = await admin
          .from('account_links')
          .select('person:people(name)')
          .eq('user_id', linkData.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if ((link as any)?.person?.name) {
          personName = (link as any).person.name;
        }
      }
    }

    // 3. Fallback pela tabela people caso ainda não tenha sido identificado
    if (!personName) {
      const { data: person } = await admin
        .from('people')
        .select('name')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      if (person?.name) {
        personName = person.name;
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
