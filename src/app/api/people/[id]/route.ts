import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const viewer = await authorize(request);
    const { id: personId } = await context.params;
    const data = (await body(request)) as {
      name?: string;
      email?: string;
      phone?: string;
      birth_date_text?: string;
      parish?: string;
      sex?: string;
      is_speaker?: boolean;
    };

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const p = state.people.find((pe) => pe.id === personId);
        if (!p) throw new HttpError(404, 'Pessoa não encontrada.');

        if (data.name !== undefined) p.name = data.name.trim();
        if (data.email !== undefined) p.email = data.email.trim() || null;
        if (data.phone !== undefined) p.phone = data.phone.trim() || null;
        if (data.birth_date_text !== undefined) p.birth_date_text = data.birth_date_text.trim() || null;
        if (data.parish !== undefined) p.parish = data.parish.trim() || null;
        if (data.sex !== undefined) p.sex = data.sex || null;

        // Se informou is_speaker, salva no notes JSON
        if (data.is_speaker !== undefined) {
          let notesObj: Record<string, any> = {};
          try {
            if (p.notes) notesObj = JSON.parse(p.notes);
          } catch {}
          notesObj.is_speaker = Boolean(data.is_speaker);
          p.notes = JSON.stringify(notesObj);
        }

        p.version = (p.version || 1) + 1;
        (p as any).updated_at = new Date().toISOString();
      });

      return NextResponse.json({ ok: true, message: 'Dados atualizados no modo demonstração.' });
    }

    const db = await supabaseServer();
    const admin = supabaseAdmin();

    // Validação de permissão:
    // 1. Admin e Reviewer podem editar qualquer pessoa
    // 2. Participante comum pode editar se estiver vinculado a este personId
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
        throw new HttpError(403, 'Você só possui permissão para editar os dados do seu próprio cadastro.');
      }
    }

    // Busca dados atuais da pessoa
    const { data: currentPerson, error: fetchErr } = await admin
      .from('people')
      .select('id, name, email, phone, birth_date_text, parish, sex, notes, version')
      .eq('id', personId)
      .single();

    if (fetchErr || !currentPerson) {
      throw new HttpError(404, 'Pessoa não encontrada no banco de dados.');
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      version: (currentPerson.version || 1) + 1,
    };

    if (data.name !== undefined && data.name.trim()) {
      const parts = data.name.trim().split(/\s+/);
      if (parts.length < 2) {
        throw new HttpError(400, 'Por favor, informe nome e sobrenome completos.');
      }
      updatePayload.name = data.name.trim();
    }

    if (data.email !== undefined) {
      updatePayload.email = data.email.trim() ? data.email.trim().toLowerCase() : null;
    }

    if (data.phone !== undefined) {
      updatePayload.phone = data.phone.trim() || null;
    }

    if (data.birth_date_text !== undefined) {
      updatePayload.birth_date_text = data.birth_date_text.trim() || null;
    }

    if (data.parish !== undefined) {
      updatePayload.parish = data.parish.trim() || null;
    }

    if (data.sex !== undefined) {
      updatePayload.sex = data.sex || null;
    }

    if (data.is_speaker !== undefined) {
      let existingNotes: Record<string, any> = {};
      try {
        if (currentPerson.notes) {
          existingNotes = typeof currentPerson.notes === 'string'
            ? JSON.parse(currentPerson.notes)
            : currentPerson.notes;
        }
      } catch {
        existingNotes = { raw_notes: currentPerson.notes };
      }
      existingNotes.is_speaker = Boolean(data.is_speaker);
      updatePayload.notes = JSON.stringify(existingNotes);
    }

    const { error: updateErr } = await admin
      .from('people')
      .update(updatePayload)
      .eq('id', personId);

    if (updateErr) {
      console.error('[PEOPLE UPDATE] Erro ao atualizar:', updateErr);
      throw new HttpError(500, `Falha ao salvar dados: ${updateErr.message}`);
    }

    // Se alterou o nome e o usuário atual for o próprio participante, sincroniza app_users
    if (updatePayload.name && viewer.id) {
      try {
        await admin
          .from('app_users')
          .update({ full_name: updatePayload.name })
          .eq('id', viewer.id);

        await admin.auth.admin.updateUserById(viewer.id, {
          user_metadata: { full_name: updatePayload.name },
        });
      } catch (syncErr) {
        console.warn('[PEOPLE UPDATE] Aviso ao sincronizar nome com auth:', syncErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Dados atualizados com sucesso.',
      person: { ...currentPerson, ...updatePayload },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}
