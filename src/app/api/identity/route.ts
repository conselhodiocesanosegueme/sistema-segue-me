import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const viewer = await authorize(request);
    const data = await body(request);

    const { name, context } = data as { name: string; context: string };

    if (!name || name.trim().length < 2) {
      throw new HttpError(400, 'Informe seu nome completo.');
    }
    if (!context || context.trim().length < 3) {
      throw new HttpError(400, 'Informe informações de contexto (encontro, ano, paróquia).');
    }

    if (isDemoMode()) {
      await mutateDemo((state) => {
        state.reviews.unshift({
          id: `req-identity-${Date.now()}`,
          kind: 'identity',
          person_id: null,
          title: `Solicitação de acesso: ${name.trim()}`,
          proposed_changes: { name: name.trim() },
          evidence: { context: context.trim(), solicitante: viewer.email },
          status: 'pending',
          created_at: new Date().toISOString(),
          version: 1,
        });
      });

      return NextResponse.json({ ok: true, message: 'Solicitação registrada com sucesso.' });
    }

    const db = await supabaseServer();
    const { data: result, error } = await db.rpc('submit_identity_request', {
      p_name: name.trim(),
      p_context: context.trim(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, id: result });
  } catch (error) {
    return apiError(error);
  }
}
