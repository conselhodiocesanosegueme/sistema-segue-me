import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { readDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer || (viewer.role !== 'admin' && viewer.role !== 'reviewer')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const isMatch = searchParams.get('match') === 'true';
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const matchName = (searchParams.get('name') || '').trim();
    const matchParish = (searchParams.get('parish') || '').trim();
    const matchSpouse = (searchParams.get('spouse') || '').trim();
    const matchPhone = (searchParams.get('phone') || '').replace(/\D/g, '');
    const excludeId = searchParams.get('excludeId') || '';

    // MODO SMART MATCH (Sugestão Inteligente)
    if (isMatch && matchName) {
      const normApplicantName = normalize(matchName);
      const nameParts = normApplicantName.split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      let pool: Array<{ id: string; legacy_id?: string | null; name: string; phone?: string | null; parish?: string | null }> = [];

      if (isDemoMode()) {
        const state = await readDemo();
        pool = state.people.filter(p => !p.merged_into && p.id !== excludeId);
      } else {
        const db = await supabaseServer();
        const orConditions = [];
        if (firstName.length >= 2) orConditions.push(`name.ilike.%${firstName}%`);
        if (lastName.length >= 2) orConditions.push(`name.ilike.%${lastName}%`);
        if (matchPhone.length >= 8) orConditions.push(`phone.ilike.%${matchPhone.slice(-8)}%`);

        if (orConditions.length) {
          const { data } = await db
            .from('people')
            .select('id, legacy_id, name, phone, parish')
            .is('merged_into', null)
            .neq('id', excludeId || '00000000-0000-0000-0000-000000000000')
            .or(orConditions.join(','))
            .limit(50);
          pool = data || [];
        }
      }

      // Algoritmo de Pontuação de Similaridade (0 a 100)
      const scored = pool.map(candidate => {
        const normCandName = normalize(candidate.name);
        const candParts = normCandName.split(/\s+/).filter(Boolean);
        let score = 0;
        const reasons: string[] = [];

        // 1. Similaridade do Nome
        if (normCandName === normApplicantName) {
          score += 60;
          reasons.push('Nome idêntico');
        } else {
          const sharedTokens = nameParts.filter(p => candParts.includes(p));
          const overlapRatio = sharedTokens.length / Math.max(nameParts.length, candParts.length);
          if (overlapRatio >= 0.75) {
            score += Math.round(overlapRatio * 50);
            reasons.push(`${sharedTokens.length} sobrenomes coincidentes`);
          } else if (nameParts[0] === candParts[0] && nameParts[nameParts.length - 1] === candParts[candParts.length - 1]) {
            score += 40;
            reasons.push('Primeiro e último sobrenome idênticos');
          } else if (normCandName.includes(normApplicantName) || normApplicantName.includes(normCandName)) {
            score += 35;
            reasons.push('Nome correspondente');
          } else if (sharedTokens.length >= 2) {
            score += sharedTokens.length * 12;
            reasons.push(`${sharedTokens.length} nomes em comum`);
          }
        }

        // 2. Paróquia
        if (matchParish && candidate.parish) {
          const normMatchParish = normalize(matchParish).replace(/paroquia/g, '').trim();
          const normCandParish = normalize(candidate.parish).replace(/paroquia/g, '').trim();
          const parishWords = normMatchParish.split(/\s+/).filter(w => w.length > 3);
          const hasParishOverlap = parishWords.some(w => normCandParish.includes(w));
          if (hasParishOverlap) {
            score += 25;
            reasons.push(`Paróquia compatível (${candidate.parish.replace('Paróquia ', '')})`);
          }
        }

        // 3. Telefone
        if (matchPhone && candidate.phone) {
          const candPhoneDigits = candidate.phone.replace(/\D/g, '');
          if (candPhoneDigits && (candPhoneDigits.endsWith(matchPhone.slice(-8)) || matchPhone.endsWith(candPhoneDigits.slice(-8)))) {
            score += 25;
            reasons.push('Telefone correspondente');
          }
        }

        const finalScore = Math.min(99, Math.max(0, score));
        return {
          ...candidate,
          score: finalScore,
          reasons,
        };
      });

      const topMatches = scored
        .filter(s => s.score >= 40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return NextResponse.json({
        match: topMatches[0] || null,
        candidates: topMatches,
      });
    }

    // MODO BUSCA NORMAL (q)
    if (!q || q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    if (isDemoMode()) {
      const state = await readDemo();
      const items = state.people
        .filter(p => {
          if (p.id === excludeId || p.merged_into) return false;
          const searchStr = `${p.name} ${p.legacy_id || ''} ${p.phone || ''}`.toLowerCase();
          return searchStr.includes(q);
        })
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          legacy_id: p.legacy_id,
          name: p.name,
          phone: p.phone,
          parish: p.parish,
        }));
      return NextResponse.json({ items });
    }

    const db = await supabaseServer();
    const clean = q.replace(/[%_(),]/g, ' ').slice(0, 80);
    const { data, error } = await db
      .from('people')
      .select('id, legacy_id, name, phone, parish')
      .is('merged_into', null)
      .neq('id', excludeId || '00000000-0000-0000-0000-000000000000')
      .or(`name.ilike.%${clean}%,legacy_id.ilike.%${clean}%,phone.ilike.%${clean}%`)
      .order('name')
      .limit(10);

    if (error) {
      console.error('Error searching people:', error);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('API Error in people search:', err);
    return NextResponse.json({ error: 'Erro ao buscar pessoas' }, { status: 500 });
  }
}
