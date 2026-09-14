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
  const { data: profile } = await db.from('app_users').select('*').eq('id', user.id).maybeSingle();
  const email = (user.email || '').trim().toLowerCase();
  const isDiocesanAdminEmail = email === 'conselhodiocesano.segueme@gmail.com' || email.startsWith('conselhodiocesano');

  let role: Role = 'reviewer';
  if (isDiocesanAdminEmail || profile?.role === 'admin' || user.user_metadata?.role === 'admin') {
    role = 'admin';
  } else if (profile?.role) {
    role = profile.role as Role;
  } else if (user.user_metadata?.role) {
    role = user.user_metadata.role as Role;
  }

  const fullName = isDiocesanAdminEmail
    ? 'Coordenação Diocesana'
    : (profile?.full_name || (user.user_metadata?.full_name as string) || 'Participante');

  const parish = role === 'admin' ? null : (profile?.parish || (user.user_metadata?.parish as string) || null);

  return { id: user.id, name: fullName, email: user.email || '', role, demo: false, parish };
});
export async function requireViewer(roles?: Role[]) {
  const viewer = await getViewer();
  if (!viewer) redirect('/entrar');
  if (roles && !roles.includes(viewer.role)) redirect('/me');
  return viewer;
}
