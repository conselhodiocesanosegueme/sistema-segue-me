import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { sendWelcomeRegistrationEmail, sendNewRegistrationAlertToDiocese } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const viewer = await authorize(request);
    const data = await body(request);

    const {
      name,
      phone,
      parish,
      condition,
      spouse_name,
      vivenciou_stage,
      vivenciou_parish,
      vivenciou_year,
      vivenciou_circle,
      worked_history,
      mandates_history,
      notes,
    } = data as Record<string, string | undefined>;

    if (!name || name.trim().length < 2) {
      throw new HttpError(400, 'Informe seu nome completo.');
    }

    // Montar descrição legível e detalhada para os quadrantes
    const contextParts = [
      `Vivência: ${vivenciou_stage || '1ª Etapa'} em ${vivenciou_parish || 'Paróquia não especificada'} (${vivenciou_year || 'Ano não informado'})`,
      vivenciou_circle ? `Círculo: ${vivenciou_circle}` : null,
      condition ? `Condição: ${condition}${spouse_name ? ` (Cônjuge: ${spouse_name})` : ''}` : null,
      worked_history ? `Equipes em que trabalhou: ${worked_history}` : null,
      mandates_history ? `Mandatos exercidos: ${mandates_history}` : null,
      phone ? `WhatsApp/Telefone: ${phone}` : null,
      parish ? `Paróquia atual: ${parish}` : null,
      notes ? `Observações: ${notes}` : null,
    ].filter(Boolean);

    const fullContext = contextParts.join('\n');

    if (isDemoMode()) {
      await mutateDemo((state) => {
        state.reviews.unshift({
          id: `req-identity-${Date.now()}`,
          kind: 'identity',
          person_id: null,
          title: `Solicitação de histórico: ${name.trim()}`,
          proposed_changes: {
            name: name.trim(),
            email: viewer.email,
            phone,
            parish,
            condition,
            spouse_name,
          },
          evidence: {
            context: fullContext,
            vivenciou_stage,
            vivenciou_parish,
            vivenciou_year,
            solicitante: viewer.email,
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          version: 1,
        });
      });

      return NextResponse.json({ ok: true, message: 'Solicitação registrada com sucesso (modo de demonstração).' });
    }

    const db = await supabaseServer();

    // 1. Chamar a RPC para garantir segurança e validação
    const { data: reviewId, error: rpcError } = await db.rpc('submit_identity_request', {
      p_name: name.trim(),
      p_context: fullContext,
    });

    if (rpcError) throw rpcError;

    // 2. Atualizar dados estruturados usando supabaseAdmin para enriquecer os detalhes da pendência
    try {
      const admin = supabaseAdmin();
      await admin
        .from('review_items')
        .update({
          proposed_changes: {
            name: name.trim(),
            email: viewer.email,
            phone: phone || '',
            parish: parish || '',
            condition: condition || 'Jovem',
            spouse_name: spouse_name || '',
          },
          evidence: {
            context: fullContext,
            vivenciou_stage: vivenciou_stage || '1ª Etapa',
            vivenciou_parish: vivenciou_parish || '',
            vivenciou_year: vivenciou_year || '',
            vivenciou_circle: vivenciou_circle || '',
            worked_history: worked_history || '',
            mandates_history: mandates_history || '',
            notes: notes || '',
            submitted_by_email: viewer.email,
            submitted_at: new Date().toISOString(),
          },
        })
        .eq('id', reviewId);

      // Atualizar também na app_users
      await admin
        .from('app_users')
        .update({
          full_name: name.trim(),
        })
        .eq('id', viewer.id);
    } catch (updateErr) {
      console.error('[IDENTITY] Erro ao enriquecer review_item:', updateErr);
    }

    // 3. Disparar e-mails via Resend em background
    Promise.allSettled([
      sendWelcomeRegistrationEmail({
        to: viewer.email,
        name: name.trim(),
        parishName: parish || vivenciou_parish,
        yearEncounter: `${vivenciou_stage || '1ª Etapa'} - ${vivenciou_year || ''} (${vivenciou_parish || ''})`,
      }),
      sendNewRegistrationAlertToDiocese({
        requesterName: name.trim(),
        requesterEmail: viewer.email,
        parishName: parish || vivenciou_parish,
        details: fullContext,
      }),
    ]).catch((err) => {
      console.error('[IDENTITY] Erro ao disparar e-mails:', err);
    });

    return NextResponse.json({ ok: true, id: reviewId });
  } catch (error) {
    return apiError(error);
  }
}
