import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
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
    let photoUrl = '';
    let vivenciouParish = '';
    let vivenciouYear = '';
    let vivenciouStage = '1ª Etapa';
    let condition = 'Jovem';
    let spouseName = '';
    let lgpdAccepted = false;

    if (isJson) {
      const body = await request.json().catch(() => ({}));
      name = (body.name || '').toString().trim();
      email = (body.email || '').toString().trim().toLowerCase();
      password = (body.password || '').toString();
      phone = (body.phone || '').toString().trim();
      parish = (body.parish || '').toString().trim();
      photoUrl = (body.photo_url || body.photoUrl || '').toString().trim();
      vivenciouParish = (body.vivenciou_parish || body.vivenciouParish || '').toString().trim();
      vivenciouYear = (body.vivenciou_year || body.vivenciouYear || '').toString().trim();
      vivenciouStage = (body.vivenciou_stage || body.vivenciouStage || '1ª Etapa').toString().trim();
      condition = (body.condition || 'Jovem').toString().trim();
      spouseName = (body.spouse_name || body.spouseName || '').toString().trim();
      lgpdAccepted = Boolean(body.lgpd_accepted ?? body.lgpdAccepted);
    } else {
      const formData = await request.formData().catch(() => new FormData());
      name = formData.get('name')?.toString().trim() || '';
      email = formData.get('email')?.toString().trim().toLowerCase() || '';
      password = formData.get('password')?.toString() || '';
      phone = formData.get('phone')?.toString().trim() || '';
      parish = formData.get('parish')?.toString().trim() || '';
      photoUrl = formData.get('photo_url')?.toString().trim() || '';
      vivenciouParish = formData.get('vivenciou_parish')?.toString().trim() || '';
      vivenciouYear = formData.get('vivenciou_year')?.toString().trim() || '';
      vivenciouStage = formData.get('vivenciou_stage')?.toString().trim() || '1ª Etapa';
      condition = formData.get('condition')?.toString().trim() || 'Jovem';
      spouseName = formData.get('spouse_name')?.toString().trim() || '';
      lgpdAccepted = formData.get('lgpd_accepted') === 'true' || formData.get('lgpd_accepted') === 'on';
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome completo, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      return NextResponse.json(
        { error: 'Por favor, informe seu nome e sobrenome completos (no mínimo duas palavras).' },
        { status: 400 }
      );
    }

    if (condition === 'Casal' && spouseName) {
      const spouseParts = spouseName.split(/\s+/).filter(Boolean);
      if (spouseParts.length < 2) {
        return NextResponse.json(
          { error: 'Por favor, informe o nome e sobrenome completos do seu cônjuge.' },
          { status: 400 }
        );
      }
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    if (!lgpdAccepted) {
      return NextResponse.json(
        { error: 'É necessário concordar com o termo da LGPD para prosseguir com o cadastro.' },
        { status: 400 }
      );
    }

    const contextParts = [
      `Vivência: ${vivenciouStage} em ${vivenciouParish || 'Paróquia não especificada'} (${vivenciouYear || 'Ano não informado'})`,
      condition ? `Condição: ${condition}${spouseName ? ` (Cônjuge: ${spouseName})` : ''}` : null,
      phone ? `WhatsApp/Telefone: ${phone}` : null,
      parish ? `Paróquia atual: ${parish}` : null,
      `Consentimento LGPD: Aceito em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    ].filter(Boolean);

    const fullContext = contextParts.join('\n');

    if (isDemoMode()) {
      const demoUserId = `demo-user-${Date.now()}`;
      await mutateDemo((state) => {
        state.reviews.unshift({
          id: `req-identity-${Date.now()}`,
          kind: 'identity',
          person_id: null,
          title: `Solicitação de cadastro: ${name.trim()}`,
          proposed_changes: {
            name: name.trim(),
            email,
            phone,
            parish: parish || vivenciouParish,
            condition,
            spouse_name: spouseName,
            photo_url: photoUrl || '',
          },
          evidence: {
            context: fullContext,
            vivenciou_stage: vivenciouStage,
            vivenciou_parish: vivenciouParish,
            vivenciou_year: vivenciouYear,
            photo_url: photoUrl || '',
            lgpd_accepted: true,
            lgpd_accepted_at: new Date().toISOString(),
            solicitante: email,
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          version: 1,
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Cadastro realizado com sucesso! Aguarde a validação do Conselho Diocesano.',
        user: { id: demoUserId, email, name },
      });
    }

    const admin = supabaseAdmin();

    // 1. Criar usuário no Supabase Auth
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone,
        parish: parish || vivenciouParish,
        photo_url: photoUrl || null,
        condition,
        spouse_name: spouseName || null,
        vivenciou_parish: vivenciouParish,
        vivenciou_year: vivenciouYear,
        vivenciou_stage: vivenciouStage,
        lgpd_accepted: true,
        lgpd_accepted_at: new Date().toISOString(),
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
    try {
      await admin
        .from('app_users')
        .upsert({
          id: userId,
          full_name: name,
          role: 'participant',
        });
    } catch (e) {
      console.warn('[SIGNUP] Falha ao atualizar app_users:', e);
    }

    // 3. Criar registro de validação no Conselho Diocesano (review_items)
    try {
      await admin.from('review_items').insert({
        kind: 'identity',
        requester_id: userId,
        title: `Solicitação de cadastro: ${name}`,
        status: 'pending',
        proposed_changes: {
          name,
          email,
          phone,
          parish: parish || vivenciouParish,
          condition,
          spouse_name: spouseName || '',
          photo_url: photoUrl || '',
        },
        evidence: {
          context: fullContext,
          vivenciou_stage: vivenciouStage,
          vivenciou_parish: vivenciouParish,
          vivenciou_year: vivenciouYear,
          photo_url: photoUrl || '',
          lgpd_accepted: true,
          lgpd_accepted_at: new Date().toISOString(),
          submitted_by_email: email,
          submitted_at: new Date().toISOString(),
        },
      });
    } catch (revError) {
      console.error('[SIGNUP] Erro ao criar item em review_items:', revError);
    }

    // 4. Disparar e-mails institucionais
    Promise.allSettled([
      sendWelcomeRegistrationEmail({
        to: email,
        name,
        parishName: parish || vivenciouParish,
        yearEncounter: `${vivenciouStage} - ${vivenciouYear || ''} (${vivenciouParish || ''})`,
      }),
      sendNewRegistrationAlertToDiocese({
        requesterName: name,
        requesterEmail: email,
        parishName: parish || vivenciouParish,
        details: fullContext,
      }),
    ]).catch((err) => {
      console.error('[SIGNUP] Erro ao disparar e-mails:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user: { id: userId, email, name },
    });
  } catch (err: any) {
    console.error('[SIGNUP] Erro inesperado:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao processar cadastro.' },
      { status: 500 }
    );
  }
}
