import { NextResponse, type NextRequest } from 'next/server';
import { authorize, apiError, HttpError } from '@/lib/http';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';

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

    // Se encounterId não foi informado, buscar ou vincular um encontro correspondente
    if (!encounterId) {
      if (parish) {
        const { data: matchedEnc } = await admin
          .from('encounters')
          .select('id')
          .ilike('parish', `%${parish}%`)
          .eq('year', year)
          .maybeSingle();

        if (matchedEnc) {
          encounterId = matchedEnc.id;
        }
      }

      // Se ainda não encontrou encontro pelo ano e paróquia, buscar o mais recente da paróquia ou criar registro
      if (!encounterId && parish) {
        const { data: anyEnc } = await admin
          .from('encounters')
          .select('id')
          .ilike('parish', `%${parish}%`)
          .order('year', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (anyEnc) {
          encounterId = anyEnc.id;
        }
      }

      // Fallback para o primeiro encontro disponível se nenhum foi encontrado
      if (!encounterId) {
        const { data: firstEnc } = await admin
          .from('encounters')
          .select('id')
          .order('year', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (firstEnc) {
          encounterId = firstEnc.id;
        }
      }
    }

    if (!encounterId) {
      throw new HttpError(400, 'Não foi possível associar um encontro a esta palestra.');
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
