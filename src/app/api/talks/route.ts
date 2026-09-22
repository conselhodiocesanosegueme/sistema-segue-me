import { NextResponse, type NextRequest } from 'next/server';
import { authorize, apiError, HttpError } from '@/lib/http';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';
import { DIOCESAN_SECTORS } from '@/lib/sectors';

export async function POST(request: NextRequest) {
  try {
    const viewer = await authorize(request);
    const body = await request.json().catch(() => ({}));

    const personId = (body.person_id || '').toString().trim();
    const theme = (body.theme || body.role || '').toString().trim();
    let encounterId = (body.encounter_id || '').toString().trim();
    const parish = (body.parish || '').toString().trim();
    const year = Number(body.year) || new Date().getFullYear();
    const condition = (body.condition || 'Jovem').toString().trim();
    const notes = (body.notes || '').toString().trim();

    if (!personId) {
      throw new HttpError(400, 'Pessoa é obrigatória.');
    }
    if (!theme) {
      throw new HttpError(400, 'Tema da palestra é obrigatório.');
    }

    if (viewer.role === 'participant') {
      const db = await supabaseServer();
      const admin = supabaseAdmin();
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
        throw new HttpError(403, 'Você só possui permissão para registrar palestras do seu próprio histórico.');
      }
    }

    if (isDemoMode()) {
      let isDuplicate = false;
      await mutateDemo((state) => {
        const alreadyExists = state.participations.some(
          (p) => p.person_id === personId && p.kind === 'Palestrou' && (p.role || '').toLowerCase() === theme.toLowerCase()
        );
        if (alreadyExists) {
          isDuplicate = true;
          return;
        }

        let encId = encounterId;
        if (!encId) {
          const matchedEnc = state.encounters.find((e) => e.parish === parish && e.year === year);
          encId = matchedEnc ? matchedEnc.id : state.encounters[0]?.id || `enc-${Date.now()}`;
        }

        state.participations.unshift({
          id: `part-talk-${Date.now()}`,
          person_id: personId,
          encounter_id: encId,
          kind: 'Palestrou',
          team: 'Palestrantes',
          role: theme,
          condition,
          circle: '',
          patron: '',
          source_page: '',
          notes: notes || null,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      });

      return NextResponse.json({
        success: true,
        message: 'Palestra registrada com sucesso (modo de demonstração).',
      });
    }

    const admin = supabaseAdmin();

    // Se encounterId não foi informado, buscar com precisão ou criar o encontro da paróquia
    if (!encounterId) {
      const rawParish = (parish || '').toString().trim();
      const cleanParish = rawParish.replace(/\s*\(.*?\)\s*/g, ' ').trim();
      const cityHint = (rawParish.match(/\((.*?)\)/) || [])[1]?.trim() || '';

      // Localiza a paróquia canônica no mapeamento diocesano
      const allSectorParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes);
      const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const matchedSector = allSectorParishes.find((p) => {
        const pNameNorm = norm(p.name);
        const rawNorm = norm(rawParish);
        const cleanNorm = norm(cleanParish);
        if (rawNorm.includes(pNameNorm) || cleanNorm.includes(pNameNorm)) return true;
        return p.dbNames.some((dbn) => norm(dbn) === rawNorm || norm(dbn) === cleanNorm || rawNorm.includes(norm(dbn)));
      });

      // Lista de candidatos de nome de paróquia para busca no banco
      const candidateParishNames = new Set<string>();
      if (cleanParish) candidateParishNames.add(cleanParish);
      if (rawParish) candidateParishNames.add(rawParish);
      if (matchedSector) {
        candidateParishNames.add(matchedSector.name);
        matchedSector.dbNames.forEach((n) => {
          candidateParishNames.add(n);
          candidateParishNames.add(n.replace(/\s*\(.*?\)\s*/g, ' ').trim());
        });
      }

      let foundEnc: { id: string; parish: string; city: string; name: string } | null = null;

      // 1. Busca por ano e nome da paróquia
      for (const candidate of candidateParishNames) {
        if (!candidate || candidate.length < 3) continue;
        const { data } = await admin
          .from('encounters')
          .select('id, parish, city, name')
          .eq('year', year)
          .ilike('parish', `%${candidate}%`)
          .limit(1)
          .maybeSingle();

        if (data) {
          foundEnc = data;
          break;
        }
      }

      // 2. Se não encontrou pelo nome, tenta pela cidade correspondente
      if (!foundEnc && (matchedSector?.city || cityHint)) {
        const targetCity = (matchedSector?.city || cityHint).replace(/\s*[\/-]\s*GO/i, '').trim();
        if (targetCity) {
          const { data } = await admin
            .from('encounters')
            .select('id, parish, city, name')
            .eq('year', year)
            .ilike('city', `%${targetCity}%`)
            .limit(1)
            .maybeSingle();

          if (data) {
            foundEnc = data;
          }
        }
      }

      // 3. Se ainda assim não existe encontro para esse ano, CRIA o encontro daquela paróquia para aquele ano
      // (NUNCA associar a um encontro de outra paróquia)
      if (!foundEnc) {
        const canonicalParish = matchedSector?.dbNames.find((n) => !n.includes('('))
          || (cleanParish.startsWith('Paróquia') || cleanParish.startsWith('Santuário') ? cleanParish : `Paróquia ${cleanParish}`);
        const canonicalCity = matchedSector?.city || cityHint || 'Diocese de Anápolis';
        const newEncounterName = `Encontro de Jovens com Cristo Segue-me (${year})`;

        const { data: newEnc, error: createEncErr } = await admin
          .from('encounters')
          .insert({
            name: newEncounterName,
            parish: canonicalParish,
            city: canonicalCity,
            year: year,
            edition: '1ª',
            date_text: year.toString(),
            extraction_status: 'Autodeclarado',
            notes: 'Encontro gerado para registro de palestra diocesana',
            version: 1,
          })
          .select('id, parish, city, name')
          .single();

        if (createEncErr || !newEnc) {
          console.error('[TALKS] Erro ao criar encontro para a paróquia:', createEncErr);
          throw new HttpError(500, `Não foi possível localizar ou criar o encontro da paróquia ${canonicalParish} (${year}).`);
        }

        foundEnc = newEnc;
      }

      encounterId = foundEnc.id;
    }

    // Verificar se a palestra já foi registrada para esta pessoa
    const { data: existingPart } = await admin
      .from('participations')
      .select('id')
      .eq('person_id', personId)
      .eq('kind', 'Palestrou')
      .ilike('role', theme)
      .maybeSingle();

    if (existingPart) {
      return NextResponse.json({
        success: true,
        id: existingPart.id,
        message: 'Palestra já registrada anteriormente.',
      });
    }

    // Inserir registro na tabela participations
    const { data: participation, error: partError } = await admin
      .from('participations')
      .insert({
        person_id: personId,
        encounter_id: encounterId,
        kind: 'Palestrou',
        team: 'Palestrantes',
        role: theme,
        condition,
        notes: notes || null,
      })
      .select('id')
      .single();

    if (partError) {
      console.error('[TALKS] Erro ao registrar participação de palestra:', partError);
      throw new HttpError(500, `Erro ao salvar palestra: ${partError.message}`);
    }

    // Tentar também registrar nas tabelas talks e talk_speakers caso existam
    try {
      const { data: newTalk } = await admin
        .from('talks')
        .insert({
          encounter_id: encounterId,
          title: theme,
          location: parish || null,
          notes: notes || null,
        })
        .select('id')
        .maybeSingle();

      if (newTalk?.id) {
        await admin
          .from('talk_speakers')
          .insert({
            talk_id: newTalk.id,
            person_id: personId,
          });
      }
    } catch (tblErr) {
      // Ignora erro secundário caso talks/talk_speakers exijam constraints adicionais
      console.warn('[TALKS] Aviso ao salvar em talk_speakers:', tblErr);
    }

    return NextResponse.json({
      success: true,
      id: participation?.id,
      message: 'Palestra registrada com sucesso!',
    });
  } catch (error) {
    return apiError(error);
  }
}
