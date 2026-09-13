import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { deleteMandate } from '@/lib/data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado. Apenas a Coordenação Diocesana (Administrador) pode excluir mandatos.' }, { status: 403 });
    }

    const { id } = await params;
    await deleteMandate(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao remover mandato' }, { status: 500 });
  }
}
