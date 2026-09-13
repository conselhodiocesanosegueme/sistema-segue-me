import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await authorize(request, ['reviewer', 'admin']);
    const { id } = await context.params;
    const data = await body(request);

    const { decision, reason, expected_version, person_id } = data as {
      decision: 'approved' | 'rejected';
      reason: string;
      expected_version?: number;
      person_id?: string;
    };

    if (!['approved', 'rejected'].includes(decision)) {
      throw new HttpError(400, 'Decisão inválida.');
    }
    if (!reason || reason.trim().length < 3) {
      throw new HttpError(400, 'Justificativa obrigatória (mínimo 3 caracteres).');
    }

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const item = state.reviews.find((r) => r.id === id);
        if (!item) throw new HttpError(404, 'Pendência não encontrada.');

        if (decision === 'approved') {
          if (item.kind === 'correction' && item.person_id) {
            const person = state.people.find((p) => p.id === item.person_id);
            if (person) {
              Object.assign(person, item.proposed_changes);
              person.version += 1;
            }
          } else if (item.kind === 'identity') {
            if (person_id === 'create_new' || !person_id) {
              const newPersonId = `person-${Date.now()}`;
              state.people.push({
                id: newPersonId,
                name: (item.proposed_changes as any)?.name || item.title.replace(/^Validação.*?: /, ''),
                email: (item.proposed_changes as any)?.email || null,
                phone: (item.proposed_changes as any)?.phone || null,
                parish: (item.proposed_changes as any)?.parish || null,
                legacy_id: `PES-${Math.floor(1000 + Math.random() * 9000)}`,
                version: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any);
              item.person_id = newPersonId;
            } else {
              item.person_id = person_id;
            }
          }
        }

        item.status = decision;
        item.resolution = reason;
        item.version = (item.version || 1) + 1;

        state.audit.push({
          id: `audit-${Date.now()}`,
          action: 'resolve_review',
          reason,
          created_at: new Date().toISOString(),
          before: { status: 'pending' },
          after: { status: decision, resolution: reason },
        });
      });

      return NextResponse.json({ ok: true, message: 'Decisão registrada no modo de demonstração.' });
    }

    const db = await supabaseServer();
    const admin = supabaseAdmin();

    // 1. Obter detalhes da pendência atual
    const { data: rev, error: revErr } = await admin
      .from('review_items')
      .select('id, kind, person_id, requester_id, proposed_changes, evidence, version')
      .eq('id', id)
      .single();

    if (revErr || !rev) {
      throw new HttpError(404, 'Pendência não encontrada.');
    }

    let targetPersonId = person_id || rev.person_id;
    let didAssignCandidate = false;

    // Se for aprovação de identidade:
    if (decision === 'approved' && rev.kind === 'identity') {
      // Se solicitou criar nova pessoa ou se targetPersonId for 'create_new' ou vazio
      if (targetPersonId === 'create_new' || (!targetPersonId && !rev.person_id)) {
        const applicantName = (rev.proposed_changes as any)?.name || 'Participante';
        const applicantEmail = (rev.proposed_changes as any)?.email || null;
        const applicantPhone = (rev.proposed_changes as any)?.phone || null;
        const applicantParish = (rev.proposed_changes as any)?.parish || null;
        const legacyCode = `PES-${Math.floor(10000 + Math.random() * 90000)}`;

        const { data: createdPerson, error: createPersonErr } = await admin
          .from('people')
          .insert({
            name: applicantName,
            email: applicantEmail,
            phone: applicantPhone,
            parish: applicantParish,
            legacy_id: legacyCode,
          })
          .select('id')
          .single();

        if (createPersonErr || !createdPerson) {
          console.error('[REVIEWS] Erro ao criar registro de pessoa:', createPersonErr);
          throw new HttpError(500, `Falha ao criar ficha cadastral: ${createPersonErr?.message}`);
        }

        targetPersonId = createdPerson.id;
      } else if (targetPersonId && !targetPersonId.includes('-') && targetPersonId.length < 20) {
        // Se foi passado um código PES ou legacy_id
        const { data: matchedPerson } = await admin
          .from('people')
          .select('id')
          .ilike('legacy_id', targetPersonId.trim())
          .is('merged_into', null)
          .maybeSingle();

        if (matchedPerson?.id) {
          targetPersonId = matchedPerson.id;
        }
      }

      // Garantir que o usuário solicitante tenha email_confirmed_at preenchido no auth
      if (rev.requester_id) {
        try {
          await admin.auth.admin.updateUserById(rev.requester_id, {
            email_confirm: true,
          });
        } catch (confirmErr) {
          console.warn('[REVIEWS] Aviso ao confirmar e-mail do requester:', confirmErr);
        }
      }
    }

    // Se temos um person_id para atribuir antes de resolver
    if (targetPersonId && targetPersonId !== rev.person_id) {
      const assign = await db.rpc('assign_identity_candidate', {
        p_review_id: id,
        p_person_id: targetPersonId,
        p_expected_version: expected_version ?? rev.version ?? 1,
      });
      if (assign.error) {
        console.error('[REVIEWS] Erro assign_identity_candidate:', assign.error);
        throw assign.error;
      }
      didAssignCandidate = true;
    }

    const currentVersion = didAssignCandidate
      ? (rev.version + 1)
      : (expected_version ?? rev.version ?? 1);

    const { error: resolveErr } = await db.rpc('resolve_review', {
      p_review_id: id,
      p_decision: decision,
      p_reason: reason,
      p_expected_version: currentVersion,
    });

    if (resolveErr) {
      console.error('[REVIEWS] Erro resolve_review:', resolveErr);
      throw resolveErr;
    }

    // Disparar e-mail de aprovação caso seja uma solicitação de cadastro/identidade
    if (decision === 'approved' && rev.kind === 'identity') {
      try {
        const recipientEmail = (rev.proposed_changes as any)?.email;
        const recipientName = (rev.proposed_changes as any)?.name || 'Participante';

        if (recipientEmail) {
          const { sendAccessApprovedEmail } = await import('@/lib/email');
          await sendAccessApprovedEmail({
            to: recipientEmail,
            name: recipientName,
          });
        }
      } catch (emailErr) {
        console.error('[REVIEWS] Erro ao enviar e-mail de aprovação:', emailErr);
      }
    }

    return NextResponse.json({ ok: true, message: 'Decisão registrada com sucesso.' });
  } catch (error) {
    return apiError(error);
  }
}
