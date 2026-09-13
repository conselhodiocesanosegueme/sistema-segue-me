import { requireViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { PageHeading } from '@/components/ui';
import { ManageUsersView, type ManagedUser } from '@/components/manage-users-view';

export default async function GestaoPage() {
  const viewer = await requireViewer(['admin']);

  let users: ManagedUser[] = [];
  if (isDemoMode()) {
    users = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        full_name: 'Coordenação Diocesana',
        role: 'admin',
        parish: null,
        created_at: new Date().toISOString(),
        email: 'coordenacao.diocesana@example.invalid',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        full_name: 'Equipe Dirigente · São Francisco de Assis',
        role: 'reviewer',
        parish: 'Paróquia São Francisco de Assis',
        created_at: new Date().toISOString(),
        email: 'dirigente.saofrancisco@example.invalid',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        full_name: 'Participante Fictício',
        role: 'participant',
        parish: null,
        created_at: new Date().toISOString(),
        email: 'participante@example.invalid',
      },
    ];
  } else {
    try {
      const adminClient = supabaseAdmin();
      const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
      const { data: profiles } = await adminClient.from('app_users').select('*');
      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      users = (authData?.users || []).map((u) => {
        const p = profilesMap.get(u.id);
        return {
          id: u.id,
          email: u.email || '',
          full_name: p?.full_name || (u.user_metadata?.full_name as string) || 'Sem nome',
          role: p?.role || (u.user_metadata?.role as string) || 'reviewer',
          parish: p?.parish || (u.user_metadata?.parish as string) || null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at || null,
        };
      });
    } catch (err) {
      // Fallback caso ocorra alguma falha na chamada admin
      const db = await supabaseServer();
      const { data } = await db.from('app_users').select('*').order('created_at', { ascending: false });
      users = (data || []).map((p: any) => ({
        id: p.id,
        email: p.email || 'Cadastrado no Auth',
        full_name: p.full_name || 'Sem nome',
        role: p.role || 'reviewer',
        parish: p.parish || null,
        created_at: p.created_at,
      }));
    }
  }

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="SEGURANÇA E CONTROLE DE ACESSOS"
        title="Gestão de Acessos & Equipes Dirigentes"
        description="Controle institucional de acessos da Coordenação Diocesana e das 43 Equipes Dirigentes Paroquiais. Administre e-mails funcionais e rotação de senhas para transição de biênio."
      />

      <ManageUsersView initialUsers={users} viewer={viewer} />
    </div>
  );
}
