import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { getMandates, createMandate } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const body = searchParams.get('body') || undefined;
    const parish = searchParams.get('parish') || undefined;
    const sector_id = searchParams.get('sector_id') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const year = searchParams.get('year') || undefined;
    const page = Number(searchParams.get('page') || 1);

    const result = await getMandates({ body, parish, sector_id, condition, year }, page);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar mandatos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado. Apenas a Coordenação Diocesana (Administrador) pode cadastrar mandatos.' }, { status: 403 });
    }

    const payload = await request.json();
    const personId = (payload.person_id || '').trim();
    const bodyName = (payload.body || '').trim();
    const role = (payload.role || '').trim();
    const condition = (payload.condition || 'Jovem').trim();
    const startYear = Number(payload.start_year);
    const endYear = payload.end_year ? Number(payload.end_year) : startYear + 1;
    const parish = payload.parish ? String(payload.parish).trim() : null;
    const sectorId = payload.sector_id ? String(payload.sector_id).trim() : null;
    const notes = payload.notes ? String(payload.notes).trim() : null;

    if (!personId) {
      return NextResponse.json({ error: 'Identificador da pessoa é obrigatório' }, { status: 400 });
    }
    if (!bodyName) {
      return NextResponse.json({ error: 'Órgão de mandato é obrigatório' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: 'Pasta ou cargo é obrigatório' }, { status: 400 });
    }
    if (!startYear || isNaN(startYear)) {
      return NextResponse.json({ error: 'Ano inicial é obrigatório' }, { status: 400 });
    }

    const mandate = await createMandate({
      person_id: personId,
      body: bodyName,
      role,
      condition,
      start_year: startYear,
      end_year: endYear,
      parish,
      sector_id: sectorId,
      notes,
    });

    return NextResponse.json({ success: true, mandate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao cadastrar mandato' }, { status: 500 });
  }
}
