import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { readDemo } from '@/lib/demo';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer || (viewer.role !== 'admin' && viewer.role !== 'reviewer')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const excludeId = searchParams.get('excludeId') || '';

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
