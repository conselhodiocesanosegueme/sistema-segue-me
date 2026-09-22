import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { readDemo, demoPersonId } from '@/lib/demo';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';

export interface QuadrantMember {
  id: string;
  name: string;
  role: string;
  condition: string;
  kind?: string;
}

export interface QuadrantCircle {
  name: string;
  patron?: string | null;
  members: QuadrantMember[];
}

export interface QuadrantTeam {
  name: string;
  members: QuadrantMember[];
}

export interface QuadrantData {
  encounter: {
    id: string;
    name: string;
    edition: string;
    year: number | null;
    parish: string;
    city: string;
    date_text: string;
    notes?: string | null;
  };
  circles: QuadrantCircle[];
  direction: QuadrantMember[];
  speakers: QuadrantMember[];
  teams: QuadrantTeam[];
  totalMembers: number;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await getViewer();
    if (!viewer) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: encounterId } = await context.params;
    if (!encounterId) {
      return NextResponse.json({ error: 'ID do encontro é obrigatório' }, { status: 400 });
    }

    if (isDemoMode()) {
      const state = await readDemo();
      const encounter = state.encounters.find((e) => e.id === encounterId);
      if (!encounter) {
        return NextResponse.json({ error: 'Encontro não encontrado' }, { status: 404 });
      }

      // Se for usuário comum, verifica se ele participou deste encontro
      if (viewer.role === 'participant') {
        const userPersonId = viewer.id === '00000000-0000-4000-8000-000000000100' ? demoPersonId : viewer.id;
        const hasParticipated = state.participations.some(
          (p) => p.encounter_id === encounterId && p.person_id === userPersonId
        );

        if (!hasParticipated) {
          return NextResponse.json(
            { error: 'Você só pode visualizar o quadrante de encontros em que participou ou trabalhou.' },
            { status: 403 }
          );
        }
      }

      const parts = state.participations.filter((p) => p.encounter_id === encounterId);
      const peopleMap = new Map(state.people.map((p) => [p.id, p]));

      const circlesMap: Record<string, QuadrantCircle> = {};
      const direction: QuadrantMember[] = [];
      const speakers: QuadrantMember[] = [];
      const teamsMap: Record<string, QuadrantMember[]> = {};

      for (const p of parts) {
        const person = peopleMap.get(p.person_id);
        const personName = person?.name || 'Não identificado';
        const role = (p.role || p.kind || '').trim();
        const team = (p.team || '').trim();
        const circle = (p.circle || '').trim();
        const roleLower = role.toLowerCase();
        const teamLower = team.toLowerCase();
        const kindLower = (p.kind || '').toLowerCase();

        if (kindLower === 'palestrante' || roleLower.includes('palestra') || teamLower.includes('palestra')) {
          speakers.push({ id: p.id, name: personName, role: role || 'Palestrante', condition: p.condition, kind: p.kind });
        } else if (
          teamLower.includes('dirigente') ||
          teamLower === 'sala' ||
          teamLower.includes('comandante') ||
          teamLower.includes('diretor espiritual') ||
          teamLower === 'padre' ||
          p.condition === 'Padre'
        ) {
          direction.push({ id: p.id, name: personName, role: role || team, condition: p.condition, kind: p.kind });
        } else if (circle || teamLower === 'círculo' || teamLower === 'circulo') {
          const cName = circle || 'Círculo de Vivência';
          if (!circlesMap[cName]) {
            circlesMap[cName] = { name: cName, patron: p.patron, members: [] };
          }
          if (p.patron && !circlesMap[cName].patron) {
            circlesMap[cName].patron = p.patron;
          }
          circlesMap[cName].members.push({
            id: p.id,
            name: personName,
            role: role || (p.kind === 'Vivenciou' ? 'Vivenciando' : 'Membro'),
            condition: p.condition,
            kind: p.kind,
          });
        } else {
          const tName = team || 'Equipe Geral';
          if (!teamsMap[tName]) teamsMap[tName] = [];
          teamsMap[tName].push({ id: p.id, name: personName, role: role || 'Membro de Equipe', condition: p.condition, kind: p.kind });
        }
      }

      // Ordenar membros por nome
      const sortMembers = (a: QuadrantMember, b: QuadrantMember) => a.name.localeCompare(b.name, 'pt-BR');
      direction.sort(sortMembers);
      speakers.sort(sortMembers);

      const circles = Object.values(circlesMap).map((c) => ({
        ...c,
        members: c.members.sort((a, b) => {
          // Vivenciandos primeiro ou tios primeiro
          if (a.kind === 'Vivenciou' && b.kind !== 'Vivenciou') return 1;
          if (a.kind !== 'Vivenciou' && b.kind === 'Vivenciou') return -1;
          return a.name.localeCompare(b.name, 'pt-BR');
        }),
      }));

      const teams = Object.entries(teamsMap)
        .map(([name, members]) => ({ name, members: members.sort(sortMembers) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      const responseData: QuadrantData = {
        encounter: {
          id: encounter.id,
          name: encounter.name,
          edition: encounter.edition,
          year: encounter.year,
          parish: encounter.parish,
          city: encounter.city,
          date_text: encounter.date_text,
          notes: encounter.notes,
        },
        circles,
        direction,
        speakers,
        teams,
        totalMembers: parts.length,
      };

      return NextResponse.json(responseData);
    }

    const db = await supabaseServer();
    const admin = supabaseAdmin();

    // 1. Obter dados do encontro
    const { data: encounter, error: encErr } = await admin
      .from('encounters')
      .select('id, name, edition, year, parish, city, date_text, notes')
      .eq('id', encounterId)
      .maybeSingle();

    if (encErr || !encounter) {
      return NextResponse.json({ error: 'Encontro não encontrado' }, { status: 404 });
    }

    // 2. Verificação de permissão para usuário comum (participant)
    if (viewer.role === 'participant') {
      const { data: profileData } = await db.rpc('get_my_profile');
      const personId = (profileData as any)?.id;

      if (!personId) {
        return NextResponse.json(
          { error: 'Perfil do participante não vinculado a uma pessoa no sistema.' },
          { status: 403 }
        );
      }

      // Obter IDs da pessoa e do cônjuge se houver
      const personIds = [personId];
      const { data: coupleRows } = await admin
        .from('couples')
        .select('person_1_id, person_2_id')
        .or(`person_1_id.eq.${personId},person_2_id.eq.${personId}`);

      if (coupleRows && coupleRows.length > 0) {
        for (const c of coupleRows) {
          if (c.person_1_id && !personIds.includes(c.person_1_id)) personIds.push(c.person_1_id);
          if (c.person_2_id && !personIds.includes(c.person_2_id)) personIds.push(c.person_2_id);
        }
      }

      // Verificar se há participação deste participante ou cônjuge no encontro solicitado
      const { count, error: partCheckErr } = await admin
        .from('participations')
        .select('id', { count: 'exact', head: true })
        .eq('encounter_id', encounterId)
        .in('person_id', personIds);

      if (partCheckErr || !count || count === 0) {
        return NextResponse.json(
          { error: 'Você só pode visualizar o quadrante de encontros em que participou ou trabalhou.' },
          { status: 403 }
        );
      }
    }

    // 3. Buscar todas as participações do encontro selecionando APENAS id e nome de people (sem dados sensíveis)
    const { data: parts, error: partsErr } = await admin
      .from('participations')
      .select('id, kind, condition, team, circle, role, patron, people(id, name)')
      .eq('encounter_id', encounterId);

    if (partsErr) {
      console.error('[QUADRANT_API] Erro ao buscar participações do encontro:', partsErr);
      return NextResponse.json({ error: 'Erro ao carregar dados do quadrante.' }, { status: 500 });
    }

    const circlesMap: Record<string, QuadrantCircle> = {};
    const direction: QuadrantMember[] = [];
    const speakers: QuadrantMember[] = [];
    const teamsMap: Record<string, QuadrantMember[]> = {};

    for (const p of parts || []) {
      const personName = (p.people as any)?.name || 'Não identificado';
      const role = (p.role || p.kind || '').trim();
      const team = (p.team || '').trim();
      const circle = (p.circle || '').trim();
      const roleLower = role.toLowerCase();
      const teamLower = team.toLowerCase();
      const kindLower = (p.kind || '').toLowerCase();

      if (kindLower === 'palestrante' || roleLower.includes('palestra') || teamLower.includes('palestra')) {
        speakers.push({ id: p.id, name: personName, role: role || 'Palestrante', condition: p.condition, kind: p.kind });
      } else if (
        teamLower.includes('dirigente') ||
        teamLower === 'sala' ||
        teamLower.includes('comandante') ||
        teamLower.includes('diretor espiritual') ||
        teamLower === 'padre' ||
        p.condition === 'Padre'
      ) {
        direction.push({ id: p.id, name: personName, role: role || team, condition: p.condition, kind: p.kind });
      } else if (circle || teamLower === 'círculo' || teamLower === 'circulo') {
        const cName = circle || 'Círculo de Vivência';
        if (!circlesMap[cName]) {
          circlesMap[cName] = { name: cName, patron: p.patron, members: [] };
        }
        if (p.patron && !circlesMap[cName].patron) {
          circlesMap[cName].patron = p.patron;
        }
        circlesMap[cName].members.push({
          id: p.id,
          name: personName,
          role: role || (p.kind === 'Vivenciou' ? 'Vivenciando' : 'Membro'),
          condition: p.condition,
          kind: p.kind,
        });
      } else {
        const tName = team || 'Equipe Geral';
        if (!teamsMap[tName]) teamsMap[tName] = [];
        teamsMap[tName].push({ id: p.id, name: personName, role: role || 'Membro de Equipe', condition: p.condition, kind: p.kind });
      }
    }

    const sortMembers = (a: QuadrantMember, b: QuadrantMember) => a.name.localeCompare(b.name, 'pt-BR');
    direction.sort(sortMembers);
    speakers.sort(sortMembers);

    const circles = Object.values(circlesMap).map((c) => ({
      ...c,
      members: c.members.sort((a, b) => {
        if (a.kind === 'Vivenciou' && b.kind !== 'Vivenciou') return 1;
        if (a.kind !== 'Vivenciou' && b.kind === 'Vivenciou') return -1;
        return a.name.localeCompare(b.name, 'pt-BR');
      }),
    }));

    const teams = Object.entries(teamsMap)
      .map(([name, members]) => ({ name, members: members.sort(sortMembers) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const responseData: QuadrantData = {
      encounter: {
        id: encounter.id,
        name: encounter.name,
        edition: encounter.edition,
        year: encounter.year,
        parish: encounter.parish,
        city: encounter.city,
        date_text: encounter.date_text,
        notes: encounter.notes,
      },
      circles,
      direction,
      speakers,
      teams,
      totalMembers: (parts || []).length,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('[QUADRANT_API] Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno ao processar requisição' }, { status: 500 });
  }
}
