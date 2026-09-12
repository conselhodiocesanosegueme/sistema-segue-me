import { GearSix, ShieldCheck, User, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { supabaseServer } from '@/lib/supabase/server';
import { Avatar, Badge, PageHeading } from '@/components/ui';

export default async function GestaoPage() {
  const viewer = await requireViewer(['admin']);

  let users: any[] = [];
  if (isDemoMode()) {
    users = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        full_name: 'Equipe de demonstração',
        role: 'admin',
        created_at: new Date().toISOString(),
        email: 'demonstracao@example.invalid',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        full_name: 'Revisor Fictício',
        role: 'reviewer',
        created_at: new Date().toISOString(),
        email: 'revisor@example.invalid',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        full_name: 'Participante Fictício',
        role: 'participant',
        created_at: new Date().toISOString(),
        email: 'participante@example.invalid',
      },
    ];
  } else {
    const db = await supabaseServer();
    const { data } = await db.from('app_users').select('*').order('created_at', { ascending: false });
    users = data || [];
  }

  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    reviewer: 'Revisor',
    participant: 'Participante',
  };

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="SEGURANÇA E PERMISSÕES"
        title="Gestão de Acessos"
        description="Controle de perfis e permissões dos usuários do sistema. Cada alteração de perfil é registrada na trilha de auditoria."
      />

      <div className="table-card">
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '1rem' }}>Usuários e Perfis de Acesso</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Total: {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil Atual</th>
                <th>Permissões</th>
                <th style={{ textAlign: 'right' }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={u.full_name || 'Usuário'} />
                      <div>
                        <strong>{u.full_name || 'Sem nome informado'}</strong>
                        {u.id === viewer.id && (
                          <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'var(--brand-light)', color: 'var(--brand-primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Você
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {u.email || 'Cadastrado'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'reviewer' ? 'badge-amber' : 'badge-neutral'}`}>
                      {roleNames[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {u.role === 'admin'
                        ? 'Acesso total: auditoria, importações, mesclagens e permissões'
                        : u.role === 'reviewer'
                        ? 'Pesquisa na base, revisão de pendências e confirmação de vínculos'
                        : 'Consulta do próprio histórico e solicitação de correções'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge badge-green">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
