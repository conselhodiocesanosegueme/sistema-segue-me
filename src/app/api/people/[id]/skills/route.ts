import { NextResponse } from 'next/server';
import { apiError, authorize, body, HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/config';
import { mutateDemo, readDemo } from '@/lib/demo';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import type { PersonSkills } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const viewer = await authorize(request);
    const { id: personId } = await context.params;
    const data = (await body(request)) as { skills?: PersonSkills };
    const skills = data.skills || {};

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const person = state.people.find((p) => p.id === personId);
        if (!person) throw new HttpError(404, 'Pessoa não encontrada.');
        person.skills = skills;
      });
      return NextResponse.json({ ok: true, skills });
    }

    const db = await supabaseServer();
    const admin = supabaseAdmin();

    // Validação de permissão:
    // 1. Administrador ou Dirigente pode alterar qualquer pessoa
    // 2. Participante comum só pode alterar suas próprias habilidades (se vinculado)
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
        throw new HttpError(403, 'Você só pode editar as habilidades do seu próprio perfil.');
      }
    }

    // Busca dados atuais da pessoa para merge seguro de notes se necessário
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

    existingNotesObj.skills = skills;

    // 1. Salva obrigatoriamente na coluna notes (garantia de persistência no Postgres)
    const { error: updateNotesErr } = await admin
      .from('people')
      .update({ notes: JSON.stringify(existingNotesObj) })
      .eq('id', personId);

    if (updateNotesErr) {
      console.error('[SKILLS] Erro ao salvar skills na coluna notes:', updateNotesErr);
      throw new HttpError(500, `Falha ao salvar habilidades: ${updateNotesErr.message}`);
    }

    // 2. Se a coluna 'skills' existir no schema, tenta atualizar diretamente
    try {
      await admin
        .from('people')
        .update({ skills })
        .eq('id', personId);
    } catch {}

    return NextResponse.json({ ok: true, skills });
  } catch (error) {
    return apiError(error);
  }
}
