import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

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
          } else if (item.kind === 'identity' && person_id) {
            item.person_id = person_id;
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

    if (person_id) {
      const assign = await db.rpc('assign_identity_candidate', {
        p_review_id: id,
        p_person_id: person_id,
        p_expected_version: expected_version ?? 1,
      });
      if (assign.error) throw assign.error;
    }

    const { error } = await db.rpc('resolve_review', {
      p_review_id: id,
      p_decision: decision,
      p_reason: reason,
      p_expected_version: expected_version ?? 1,
    });

    if (error) throw error;

    // Disparar e-mail de aprovação caso seja uma solicitação de cadastro/identidade
    if (decision === 'approved') {
      try {
        const { data: rev } = await db
          .from('review_items')
          .select('kind, proposed_changes, requester_id')
          .eq('id', id)
          .maybeSingle();

        if (rev?.kind === 'identity') {
          const recipientEmail = rev.proposed_changes?.email;
          const recipientName = rev.proposed_changes?.name || 'Participante';

          if (recipientEmail) {
            const { sendAccessApprovedEmail } = await import('@/lib/email');
            await sendAccessApprovedEmail({
              to: recipientEmail,
              name: recipientName,
            });
          }
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
