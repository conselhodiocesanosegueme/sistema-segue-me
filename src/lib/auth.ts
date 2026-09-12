import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from './supabase/server';
import { isConfigured, isDemoMode } from './config';
import type { Role, Viewer } from './types';

export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (isDemoMode()) {
    try {
      const cookieStore = await cookies();
      const role = cookieStore.get('demo_role')?.value;
      if (role === 'participant') {
        return {
          id: '00000000-0000-4000-8000-000000000100',
          name: 'Ana Clara de Almeida',
          email: 'anaclara.almeida@example.invalid',
          role: 'participant',
          demo: true,
          parish: 'Paróquia São Francisco de Assis',
        };
      }
      if (role === 'reviewer') {
        return {
          id: '00000000-0000-4000-8000-000000000002',
          name: 'Equipe Dirigente · São Francisco de Assis',
          email: 'dirigente.saofrancisco@example.invalid',
          role: 'reviewer',
          demo: true,
          parish: 'Paróquia São Francisco de Assis',
        };
      }
    } catch {
      // Cookies not available during static generation
    }
    return {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Coordenação Diocesana',
      email: 'coordenacao.diocesana@example.invalid',
      role: 'admin',
      demo: true,
      parish: null,
    };
  }
  if (!isConfigured()) return null;
  const db = await supabaseServer();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: roleError } = await db.from('app_users').select('full_name,role').eq('id', user.id).single();
  if (roleError || !profile) return null;
  return { id: user.id, name: profile.full_name || 'Participante', email: user.email || '', role: profile.role as Role, demo: false, parish: null };
});
export async function requireViewer(roles?: Role[]) {
  const viewer = await getViewer();
  if (!viewer) redirect('/entrar');
  if (roles && !roles.includes(viewer.role)) redirect('/me');
  return viewer;
}
