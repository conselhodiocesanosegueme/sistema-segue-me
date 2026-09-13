import { NextResponse, type NextRequest } from 'next/server';
import { authorize, apiError, HttpError } from '@/lib/http';
import { getParticipations } from '@/lib/data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await authorize(request, ['reviewer', 'admin']);
    const { id } = await context.params;

    if (!id) {
      throw new HttpError(400, 'ID da pessoa não fornecido.');
    }

    const participations = await getParticipations(id);

    const vivenciou = participations.filter((p) => p.kind === 'Vivenciou').map((p) => ({
      id: p.id,
      encounter_name: p.encounter?.name || 'Encontro',
      encounter_edition: p.encounter?.edition,
      year: p.encounter?.year,
      parish: p.encounter?.parish,
      circle: p.circle,
      patron: p.patron,
    }));

    const worked = participations
      .filter((p) => p.kind === 'Trabalhou' && !p.role?.toLowerCase().includes('palestr') && !p.team?.toLowerCase().includes('palestr'))
      .map((p) => ({
        id: p.id,
        team: p.team || 'Equipe',
        role: p.role,
        encounter_name: p.encounter?.name || 'Encontro',
        encounter_edition: p.encounter?.edition,
        year: p.encounter?.year,
        parish: p.encounter?.parish,
      }));

    vivenciou.sort((a, b) => (b.year || 0) - (a.year || 0));
    worked.sort((a, b) => (b.year || 0) - (a.year || 0));

    return NextResponse.json({
      success: true,
      vivenciou,
      worked,
      totalWorked: worked.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
