import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const viewer = await authorize(request);
    const data = await body(request);

    const { person_id, changes, reason } = data as {
      person_id: string;
      changes: Record<string, string | null>;
      reason: string;
    };

    if (!person_id) throw new HttpError(400, 'Identificador da pessoa é obrigatório.');
    if (!changes || Object.keys(changes).length === 0) throw new HttpError(400, 'Nenhuma alteração informada.');
    if (!reason || reason.trim().length < 3) throw new HttpError(400, 'A justificativa é obrigatória.');

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const person = state.people.find((p) => p.id === person_id);
        state.reviews.unshift({
          id: `req-corr-${Date.now()}`,
          kind: 'correction',
          person_id,
          title: `Atualização de dados: ${person?.name || 'Cadastro'}`,
          proposed_changes: changes,
          evidence: { reason: reason.trim(), solicitante: viewer.email },
          status: 'pending',
          created_at: new Date().toISOString(),
          version: 1,
        });
      });

      return NextResponse.json({ ok: true, message: 'Correção enviada para análise com sucesso.' });
    }

    const db = await supabaseServer();
    const { data: result, error } = await db.rpc('submit_correction', {
      p_person_id: person_id,
      p_changes: changes,
      p_reason: reason.trim(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, id: result });
  } catch (error) {
    return apiError(error);
  }
}
