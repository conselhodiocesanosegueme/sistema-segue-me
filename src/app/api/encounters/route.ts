import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { createEncounter } from '@/lib/data';
import type { EncounterType, EncounterLevel } from '@/lib/encounter-config';

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado. Apenas a Coordenação Diocesana (Administrador) pode cadastrar encontros.' }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();
    const edition = (body.edition || '').trim();
    const year = Number(body.year);
    const parish = (body.parish || '').trim();
    const city = (body.city || '').trim();
    const dateText = (body.date_text || '').trim();
    const type = (body.type || '1ª Etapa') as EncounterType;
    const level = (body.level || (type === '1ª Etapa' ? 'Paroquial' : 'Diocesano')) as EncounterLevel;
    const teams = Array.isArray(body.teams) ? body.teams.map((t: string) => String(t).trim()).filter(Boolean) : [];
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!year || isNaN(year)) {
      return NextResponse.json({ error: 'O ano do encontro é obrigatório.' }, { status: 400 });
    }

    if (level === 'Paroquial' && !parish) {
      return NextResponse.json({ error: 'A paróquia é obrigatória para encontros de 1ª Etapa.' }, { status: 400 });
    }

    const theme = body.theme ? String(body.theme).trim() : undefined;

    const encounter = await createEncounter({
      name: name || `${edition || '1º'} ${type} Segue-me`,
      edition: edition || '1º',
      year,
      parish: level === 'Diocesano' ? (parish || 'Diocese de Anápolis') : parish,
      city: city || (level === 'Diocesano' ? 'Anápolis - GO' : ''),
      date_text: dateText,
      type,
      level,
      teams,
      theme,
      notes: notes || undefined,
    });

    return NextResponse.json({ success: true, encounter }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao cadastrar encontro' }, { status: 500 });
  }
}
