import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const viewer = await authorize(request, ['admin']);
    const data = await body(request);

    const { audit_id, reason } = data as { audit_id: string; reason: string };

    if (!audit_id) throw new HttpError(400, 'Identificador de auditoria obrigatório.');
    if (!reason || reason.trim().length < 3) throw new HttpError(400, 'Justificativa da reversão obrigatória.');

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const audit = state.audit.find((a) => a.id === audit_id);
        if (!audit) throw new HttpError(404, 'Registro de auditoria não localizado.');

        // Reverte pessoas
        const before = audit.before as { source_id?: string };
        if (before?.source_id) {
          const person = state.people.find((p) => p.id === before.source_id);
          if (person) person.merged_into = null;
        }

        state.audit.push({
          id: `audit-${Date.now()}`,
          action: 'reverse_merge',
          reason,
          created_at: new Date().toISOString(),
          before: audit,
          after: { reversed: true },
        });
      });

      return NextResponse.json({ ok: true, message: 'Reversão concluída no modo de demonstração.' });
    }

    const db = await supabaseServer();
    const { error } = await db.rpc('reverse_merge', {
      p_audit_id: audit_id,
      p_reason: reason,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, message: 'Reversão de mesclagem concluída.' });
  } catch (error) {
    return apiError(error);
  }
}
