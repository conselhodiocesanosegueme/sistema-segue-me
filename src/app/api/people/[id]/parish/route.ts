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
    const newParish = (body.parish || '').trim();
    const reason = (body.reason || '').trim();

    if (!newParish) {
      return NextResponse.json({ error: 'A nova paróquia é obrigatória' }, { status: 400 });
    }

    const now = new Date().toLocaleDateString('pt-BR');

    if (isDemoMode()) {
      await mutateDemo((state) => {
        const p = state.people.find(x => x.id === personId);
        if (p) {
          const oldParish = p.parish || 'Sem paróquia de referência';
          p.parish = newParish;
          const log = `Transferência de paróquia registrada em ${now}: de "${oldParish}" para "${newParish}"${reason ? ` (${reason})` : ''} por ${viewer.name}.`;
          p.notes = p.notes ? `${p.notes}\n${log}` : log;
        }
      });
      return NextResponse.json({ success: true, parish: newParish });
    }

    const db = supabaseAdmin();
    const { data: person, error: fetchErr } = await db
      .from('people')
      .select('name, parish, notes')
      .eq('id', personId)
      .single();

    if (fetchErr || !person) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 });
    }

    const oldParish = person.parish || 'Sem paróquia de referência';
    const log = `Transferência de paróquia registrada em ${now}: de "${oldParish}" para "${newParish}"${reason ? ` (${reason})` : ''} por ${viewer.name}.`;
    const updatedNotes = person.notes ? `${person.notes}\n${log}` : log;

    const { error: updateErr } = await db
      .from('people')
      .update({
        parish: newParish,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', personId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, parish: newParish });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao transferir paróquia' }, { status: 500 });
  }
}
