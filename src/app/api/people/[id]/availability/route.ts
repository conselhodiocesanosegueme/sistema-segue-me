import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import type { PersonAvailability } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  return handleUpdate(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdate(request, context);
}

async function handleUpdate(request: Request, context: RouteContext) {
  try {
    const viewer = await authorize(request);
    const { id: personId } = await context.params;
    const data = (await body(request)) as { availability?: PersonAvailability };
    const availability = data.availability || {};

    // Adiciona timestamp da atualização
    availability.updated_at = new Date().toISOString();

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const person = state.people.find((p) => p.id === personId);
        if (!person) throw new HttpError(404, 'Pessoa não encontrada.');

        person.availability = availability;
        if (availability.status === 'disponivel') {
          person.engagement_status = 'disponivel';
        }

        let notesObj: Record<string, any> = {};
        try {
          if (person.notes) {
            notesObj = typeof person.notes === 'string' ? JSON.parse(person.notes) : person.notes;
          }
        } catch {}

        notesObj.availability = availability;
        if (availability.status === 'disponivel') {
          notesObj.engagement_status = 'disponivel';
        }
        person.notes = JSON.stringify(notesObj);
      });

      return NextResponse.json({ ok: true, availability });
    }

    const db = await supabaseServer();
    const admin = supabaseAdmin();

    // Validação de permissão:
    // 1. Administrador e revisor podem alterar qualquer pessoa
    // 2. Participante só pode alterar seu próprio cadastro
    if (viewer.role === 'participant') {
      let profilePersonId: string | null = null;
      try {
        const { data: profileData } = await db.rpc('get_my_profile');
        if (profileData && (profileData as any).id) {
          profilePersonId = (profileData as any).id;
        }
      } catch {}

      const linkRes = await admin
        .from('account_links')
        .select('id')
        .eq('user_id', viewer.id)
        .eq('person_id', personId)
        .eq('status', 'active')
        .maybeSingle();

      const isLinked = Boolean(linkRes.data) || profilePersonId === personId;
      if (!isLinked) {
        throw new HttpError(403, 'Você só pode atualizar a disponibilidade do seu próprio cadastro.');
      }
    }

    // Busca dados atuais para merge seguro em notes
    const { data: currentPerson, error: fetchErr } = await admin
      .from('people')
      .select('notes, engagement_status')
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

    existingNotesObj.availability = availability;
    if (availability.status === 'disponivel') {
      existingNotesObj.engagement_status = 'disponivel';
    }

    const updatePayload: Record<string, any> = {
      notes: JSON.stringify(existingNotesObj),
    };

    if (availability.status === 'disponivel') {
      updatePayload.engagement_status = 'disponivel';
    }

    // 1. Salva obrigatoriamente na coluna notes (garantia de persistência no Postgres)
    const { error: updateNotesErr } = await admin
      .from('people')
      .update(updatePayload)
      .eq('id', personId);

    if (updateNotesErr) {
      console.error('[AVAILABILITY] Erro ao salvar disponibilidade na coluna notes:', updateNotesErr);
      throw new HttpError(500, `Falha ao salvar disponibilidade: ${updateNotesErr.message}`);
    }

    // 2. Se a coluna 'availability' existir no schema, tenta atualizar diretamente
    try {
      await admin
        .from('people')
        .update({ availability })
        .eq('id', personId);
    } catch {}

    return NextResponse.json({ ok: true, availability });
  } catch (error) {
    return apiError(error);
  }
}
