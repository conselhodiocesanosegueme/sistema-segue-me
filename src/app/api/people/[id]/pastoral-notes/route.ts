import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    // Apenas Dirigentes e Conselho Diocesano têm permissão para ver e editar notas pastorais
    const viewer = await authorize(request, ['admin', 'reviewer']);
    const { id: personId } = await context.params;
    const data = (await body(request)) as { pastoral_notes?: string; engagement_status?: string };

    const pastoral_notes = data.pastoral_notes?.trim() || '';
    const engagement_status = data.engagement_status || 'neutro';

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const person = state.people.find((p) => p.id === personId);
        if (!person) throw new HttpError(404, 'Pessoa não encontrada.');
        person.pastoral_notes = pastoral_notes;
        person.engagement_status = engagement_status;
      });
      return NextResponse.json({ ok: true, pastoral_notes, engagement_status });
    }

    const admin = supabaseAdmin();

    const { data: currentPerson, error: fetchErr } = await admin
      .from('people')
      .select('notes')
      .eq('id', personId)
      .single();

    if (fetchErr || !currentPerson) {
      throw new HttpError(404, 'Pessoa não encontrada.');
    }

    let existingNotesObj: Record<string, any> = {};
    try {
      if (currentPerson.notes) {
        existingNotesObj = typeof currentPerson.notes === 'string'
          ? JSON.parse(currentPerson.notes)
          : currentPerson.notes;
      }
    } catch {
      existingNotesObj = { raw_notes: currentPerson.notes };
    }

    existingNotesObj.pastoral_notes = pastoral_notes;
    existingNotesObj.engagement_status = engagement_status;
    existingNotesObj.last_updated_by = viewer.email;
    existingNotesObj.last_updated_at = new Date().toISOString();

    const updatePayload: Record<string, any> = {
      notes: JSON.stringify(existingNotesObj),
    };

    try {
      const { error: directErr } = await admin
        .from('people')
        .update({
          pastoral_notes,
          engagement_status,
          ...updatePayload,
        })
        .eq('id', personId);

      if (directErr && directErr.message?.includes('does not exist')) {
        await admin.from('people').update(updatePayload).eq('id', personId);
      }
    } catch {
      await admin.from('people').update(updatePayload).eq('id', personId);
    }

    return NextResponse.json({ ok: true, pastoral_notes, engagement_status });
  } catch (error) {
    return apiError(error);
  }
}
