import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';
import { sendWelcomeRegistrationEmail, sendNewRegistrationAlertToDiocese } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let name = '';
    let email = '';
    let password = '';
    let phone = '';
    let parish = '';
    let encounterInfo = '';

    if (isJson) {
      const body = await request.json().catch(() => ({}));
      name = (body.name || '').toString().trim();
      email = (body.email || '').toString().trim().toLowerCase();
      password = (body.password || '').toString();
      phone = (body.phone || '').toString().trim();
      parish = (body.parish || '').toString().trim();
      encounterInfo = (body.encounterInfo || body.encounter_info || '').toString().trim();
    } else {
      const formData = await request.formData().catch(() => new FormData());
      name = formData.get('name')?.toString().trim() || '';
      email = formData.get('email')?.toString().trim().toLowerCase() || '';
      password = formData.get('password')?.toString() || '';
      phone = formData.get('phone')?.toString().trim() || '';
      parish = formData.get('parish')?.toString().trim() || '';
      encounterInfo = formData.get('encounterInfo')?.toString().trim() || '';
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Solicitação de cadastro registrada com sucesso (modo de demonstração).',
      });
    }

    const admin = supabaseAdmin();

    // 1. Criar usuário no Supabase Auth
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Já confirmado ou validado via e-mail oficial
      user_metadata: {
        full_name: name,
        phone,
        parish,
      },
    });

    if (createError) {
      console.error('[SIGNUP] Erro ao criar auth user:', createError);
      if (createError.message.includes('already registered') || createError.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado. Acesse a tela de login ou recupere sua senha.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Erro ao criar cadastro: ${createError.message}` },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    // 2. Garantir registro na tabela app_users com role participant
    await admin
      .from('app_users')
      .upsert({
        id: userId,
        full_name: name,
        role: 'participant',
      })
      .select()
      .maybeSingle();

    // 3. Registrar na tabela pending_reviews para validação do Conselho
    await admin.from('pending_reviews').insert({
      kind: 'identity',
      title: `Validação de cadastro: ${name}`,
      requester_id: userId,
      proposed_changes: {
        name,
        email,
        phone,
        parish,
      },
      evidence: {
        context: encounterInfo || 'Solicitação direta de novo participante pelo portal.',
        registered_at: new Date().toISOString(),
      },
      status: 'pending',
    });

    // 4. Enviar e-mails automáticos via Resend (em background sem travar o retorno)
    Promise.allSettled([
      sendWelcomeRegistrationEmail({
        to: email,
        name,
        parishName: parish,
        yearEncounter: encounterInfo,
      }),
      sendNewRegistrationAlertToDiocese({
        requesterName: name,
        requesterEmail: email,
        parishName: parish,
        details: encounterInfo,
      }),
    ]).catch((err) => {
      console.error('[SIGNUP] Erro ao disparar e-mails via Resend:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Cadastro solicitado com sucesso! Enviamos um e-mail de confirmação para você.',
    });
  } catch (err: any) {
    console.error('[SIGNUP] Erro inesperado:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao processar cadastro.' },
      { status: 500 }
    );
  }
}
