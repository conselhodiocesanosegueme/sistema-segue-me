import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const viewer = await authorize(request, ['reviewer', 'admin']);
    const data = await body(request);

    const { source_id, target_id, reason, source_version, target_version } = data as {
      source_id: string;
      target_id: string;
      reason: string;
      source_version?: number;
      target_version?: number;
    };

    if (!source_id || !target_id || source_id === target_id) {
      throw new HttpError(400, 'Selecione duas pessoas distintas para mesclagem.');
    }
    if (!reason || reason.trim().length < 3) {
      throw new HttpError(400, 'A justificativa da mesclagem é obrigatória para auditoria.');
    }

    if (isDemoMode()) {
      await mutateDemo((state) => {
        // Encontra o source (pode ser por ID ou legacy_id)
        const source = state.people.find((p) => p.id === source_id || p.legacy_id === source_id);
        const target = state.people.find((p) => p.id === target_id || p.legacy_id === target_id);

        if (!source || !target) {
          throw new HttpError(404, 'Pessoa de origem ou destino não encontrada.');
        }

        if (source.id === target.id) {
          throw new HttpError(400, 'Origem e destino são o mesmo cadastro.');
        }

        // Marca a pessoa como mesclada
        source.merged_into = target.id;
        source.version += 1;
        target.version += 1;

        // Redireciona participações
        for (const part of state.participations) {
          if (part.person_id === source.id) {
            part.person_id = target.id;
          }
        }

        // Auditoria
        state.audit.push({
          id: `audit-${Date.now()}`,
          action: 'merge_people',
          reason,
          created_at: new Date().toISOString(),
          before: { source_id: source.id, target_id: target.id },
          after: { merged_into: target.id },
        });
      });

      return NextResponse.json({ ok: true, message: 'Mesclagem realizada no modo de demonstração.' });
    }

    const db = await supabaseServer();
    const { error } = await db.rpc('merge_people', {
      p_source_id: source_id,
      p_target_id: target_id,
      p_reason: reason,
      p_source_version: source_version ?? 1,
      p_target_version: target_version ?? 1,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, message: 'Mesclagem realizada com sucesso.' });
  } catch (error) {
    return apiError(error);
  }
}
