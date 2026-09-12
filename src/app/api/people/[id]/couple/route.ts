import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const viewer = await getViewer();
    if (!viewer || (viewer.role !== 'admin' && viewer.role !== 'reviewer')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: personId } = await params;
    const body = await request.json();
    const spouseId = (body.spouse_id || '').trim();
    const startText = body.start_text ? String(body.start_text).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!spouseId) {
      return NextResponse.json({ error: 'Identificador do cônjuge é obrigatório' }, { status: 400 });
    }

    if (spouseId === personId) {
      return NextResponse.json({ error: 'A pessoa não pode ser cônjuge de si mesma' }, { status: 400 });
    }

    if (isDemoMode()) {
      const newCouple = await mutateDemo((state) => {
        state.couples = (state.couples || []).filter(
          c => c.person_1_id !== personId && c.person_2_id !== personId &&
               c.person_1_id !== spouseId && c.person_2_id !== spouseId
        );

        const nextNum = (state.couples.length + 1).toString().padStart(5, '0');
        const couple = {
          id: `demo-couple-${Date.now()}`,
          legacy_id: `CAS-${nextNum}`,
          person_1_id: personId,
          person_2_id: spouseId,
          start_text: startText,
          end_text: null,
          notes: notes || 'Vínculo atualizado pela coordenação',
        };
        state.couples.push(couple);
        return couple;
      });
      return NextResponse.json({ success: true, couple: newCouple });
    }

    const db = supabaseAdmin();

    // 1. Verificar se a pessoa já tem um casal cadastrado
    const { data: existingCouples } = await db
      .from('couples')
      .select('*')
      .or(`person_1_id.eq.${personId},person_2_id.eq.${personId}`);

    if (existingCouples && existingCouples.length > 0) {
      const current = existingCouples[0];
      // Atualizar o parceiro mantendo o casal
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (current.person_1_id === personId) {
        updatePayload.person_2_id = spouseId;
      } else {
        updatePayload.person_1_id = spouseId;
      }
      if (startText !== undefined) updatePayload.start_text = startText;
      if (notes !== undefined) updatePayload.notes = notes;

      const { data: updated, error } = await db
        .from('couples')
        .update(updatePayload)
        .eq('id', current.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating couple:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, couple: updated });
    }

    // 2. Não tem casal ainda: criar novo casal
    const { count } = await db.from('couples').select('id', { count: 'exact', head: true });
    const nextNum = ((count || 0) + 1).toString().padStart(5, '0');

    const { data: inserted, error } = await db
      .from('couples')
      .insert({
        legacy_id: `CAS-${nextNum}`,
        person_1_id: personId,
        person_2_id: spouseId,
        start_text: startText,
        notes: notes || 'Vínculo registrado pela coordenação',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating couple:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, couple: inserted });
  } catch (err) {
    console.error('API Error in couple link:', err);
    return NextResponse.json({ error: 'Erro ao vincular cônjuge' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const viewer = await getViewer();
    if (!viewer || (viewer.role !== 'admin' && viewer.role !== 'reviewer')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: personId } = await params;

    if (isDemoMode()) {
      await mutateDemo((state) => {
        state.couples = (state.couples || []).filter(
          c => c.person_1_id !== personId && c.person_2_id !== personId
        );
      });
      return NextResponse.json({ success: true });
    }

    const db = supabaseAdmin();
    const { error } = await db
      .from('couples')
      .delete()
      .or(`person_1_id.eq.${personId},person_2_id.eq.${personId}`);

    if (error) {
      console.error('Error deleting couple:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API Error in couple delete:', err);
    return NextResponse.json({ error: 'Erro ao desvincular casal' }, { status: 500 });
  }
}
