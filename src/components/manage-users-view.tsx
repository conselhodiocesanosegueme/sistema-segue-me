"use client";

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UsersThree,
  User,
  Plus,
  Key,
  Copy,
  Check,
  ArrowsClockwise,
  Church,
  Lock,
  MagnifyingGlass,
  Funnel,
  Buildings,
  CheckCircle,
  WarningCircle,
  Eye,
  Info,
} from '@phosphor-icons/react';
import { DIOCESAN_SECTORS, getSectorForParish } from '@/lib/sectors';
import { Avatar, Modal, SubmitButton, Feedback } from '@/components/ui';
import type { Viewer } from '@/lib/types';

export interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'reviewer' | 'participant' | string;
  parish?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

interface ManageUsersViewProps {
  initialUsers: ManagedUser[];
  viewer: Viewer;
}

function cleanCityName(city: string = ''): string {
  return city
    .replace(/\s*-\s*GO/gi, '')
    .replace(/\s*\/GO/gi, '')
    .trim();
}

function cleanSlug(text: string = ''): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^par[oó]quias?\s+/i, '')
    .replace(/^santu[aá]rio\s+(diocesano\s+)?/i, '')
    .replace(/^quase-par[oó]quia\s+/i, '')
    .replace(/[-/]\s*go/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isHomonymousParish(parishName: string): boolean {
  const norm = cleanSlug(parishName);
  let count = 0;
  for (const s of DIOCESAN_SECTORS) {
    for (const p of s.parishes) {
      if (cleanSlug(p.name) === norm) {
        count++;
        if (count > 1) return true;
      }
    }
  }
  return false;
}

// Gera slug limpo para o email funcional da paróquia com diferenciação de cidade
function generateParishSlug(parishName: string, city?: string): string {
  let p = cleanSlug(parishName);
  // Atalhos mnemônicos elegantes para oragos comuns
  if (p.includes('nossasenhoradocarmo') || p === 'carmo') p = 'carmo';
  else if (p.includes('nossasenhoradabadia') || p === 'abadia') p = 'abadia';
  else if (p.includes('saofranciscodeassis') || p === 'saofrancisco') p = 'saofrancisco';
  else if (p.includes('saopedroesaopaulo') || p === 'pedropaulo') p = 'pedropaulo';
  else if (p.includes('santissimatrindade')) p = 'trindade';
  else if (p.includes('divinopaieterno')) p = 'paieterno';
  else if (p.includes('nossasenhoradefatima')) p = 'fatima';
  else if (p.includes('nossasenhoradelourdes')) p = 'lourdes';
  else if (p.includes('nossasenhoradasgracas')) p = 'gracas';
  else if (p.includes('nossasenhoraaparecida')) p = 'aparecida';
  else if (p.includes('sagradocoracaodejesus')) p = 'sagradocoracao';
  else if (p.includes('santateresinhadomeninojesus')) p = 'santateresinha';
  else if (p.includes('catedralbomjesus')) p = 'catedral';
  else if (p.includes('saojoseoperario')) p = 'saojoseoperario';
  else if (p.includes('saojose')) p = 'saojose';
  else if (p.includes('santoantonio')) p = 'santoantonio';
  else if (p.includes('saosebastiao')) p = 'saosebastiao';
  else p = p.slice(0, 18);

  const c = city ? cleanSlug(city).slice(0, 15) : '';
  if (c) {
    return `${p}.${c}`;
  }
  return p;
}

// Gera senha segura temporária inicial
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$';
  let pass = 'Segueme';
  for (let i = 0; i < 4; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function ManageUsersView({ initialUsers, viewer }: ManageUsersViewProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  // Modal de Criação
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSectorId, setCreateSectorId] = useState<string>('setor-1');
  const [createParishName, setCreateParishName] = useState<string>('');
  const [createName, setCreateName] = useState<string>('');
  const [createEmail, setCreateEmail] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('');
  const [createRole, setCreateRole] = useState<'reviewer' | 'admin'>('reviewer');
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdSuccessCreds, setCreatedSuccessCreds] = useState<{
    email: string;
    password: string;
    parish: string;
    name: string;
  } | null>(null);

  // Modal de Redefinição de Senha
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState<string>('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Clipboard
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const updateParishSelection = (sectorId: string, parishName: string) => {
    const sector = DIOCESAN_SECTORS.find((s) => s.id === sectorId);
    const parish = sector?.parishes.find((p) => p.name === parishName) || sector?.parishes[0];
    if (!parish) return;

    const cleanCity = cleanCityName(parish.city);
    const emailSlug = generateParishSlug(parish.name, cleanCity);

    setCreateSectorId(sectorId);
    setCreateParishName(parish.name);
    setCreateName(`Equipe Dirigente · ${parish.name} (${cleanCity})`);
    setCreateEmail(`dirigente.${emailSlug}@sistemasegueme.com.br`);
  };

  // Prepara modal de criação ao abrir
  const handleOpenCreateModal = () => {
    const firstSector = DIOCESAN_SECTORS[0];
    const firstParish = firstSector.parishes[0];
    updateParishSelection(firstSector.id, firstParish.name);
    setCreatePassword(generateSecurePassword());
    setCreateRole('reviewer');
    setCreateError(null);
    setCreatedSuccessCreds(null);
    setIsCreateOpen(true);
  };

  // Quando o setor muda no modal de criação
  const handleSectorChangeInCreate = (sectorId: string) => {
    setCreateSectorId(sectorId);
    const sector = DIOCESAN_SECTORS.find((s) => s.id === sectorId);
    if (sector && sector.parishes.length > 0) {
      updateParishSelection(sectorId, sector.parishes[0].name);
    }
  };

  // Quando a paróquia muda no modal de criação
  const handleParishChangeInCreate = (parishName: string) => {
    updateParishSelection(createSectorId, parishName);
  };

  // Submissão do novo usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateBusy(true);
    setCreateError(null);

    try {
      const sector = DIOCESAN_SECTORS.find((s) => s.id === createSectorId);
      const parishObj = sector?.parishes.find((p) => p.name === createParishName);
      const cleanCity = parishObj ? cleanCityName(parishObj.city) : '';
      const hasHomonym = parishObj ? isHomonymousParish(parishObj.name) : false;
      const storedParishName = hasHomonym && cleanCity
        ? `Paróquia ${createParishName} (${cleanCity})`
        : `Paróquia ${createParishName}`;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          full_name: createName,
          parish: createRole === 'reviewer' ? storedParishName : null,
          role: createRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar acesso de usuário.');
      }

      const newUser: ManagedUser = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role,
        parish: data.user.parish,
        created_at: data.user.created_at || new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);
      setCreatedSuccessCreds({
        email: createEmail,
        password: createPassword,
        parish: parishObj ? `${parishObj.name} (${cleanCity})` : createParishName,
        name: createName,
      });
    } catch (err: any) {
      setCreateError(err.message || 'Erro inesperado.');
    } finally {
      setCreateBusy(false);
    }
  };

  // Prepara modal de redefinição de senha
  const handleOpenResetModal = (user: ManagedUser) => {
    setResetUser(user);
    setResetPassword(generateSecurePassword());
    setResetError(null);
    setResetSuccess(null);
    setIsResetOpen(true);
  };

  // Submissão de redefinição de senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetBusy(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: resetPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao redefinir senha.');
      }

      setResetSuccess(`Nova senha definida com sucesso para ${resetUser.email}!`);
    } catch (err: any) {
      setResetError(err.message || 'Erro inesperado.');
    } finally {
      setResetBusy(false);
    }
  };

  // Métricas
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const parishUsers = users.filter((u) => u.role === 'reviewer' && u.parish);
  const coveredParishesCount = new Set(parishUsers.map((u) => u.parish)).size;

  // Filtragem
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Sector filter
      if (sectorFilter !== 'all') {
        if (!u.parish) return false;
        const sector = getSectorForParish(u.parish);
        if (sector?.id !== sectorFilter) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (u.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesParish = (u.parish || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesParish) return false;
      }

      return true;
    });
  }, [users, roleFilter, sectorFilter, searchQuery]);

  return (
    <div>
      {/* Cards de Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div className="stat-card stat-primary">
          <div className="stat-top">
            <span>Total de Acessos</span>
            <UsersThree size={20} />
          </div>
          <strong className="stat-number">{totalUsers}</strong>
          <div className="stat-bottom">
            <span>Contas cadastradas no sistema</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Coordenação Diocesana</span>
            <ShieldCheck size={20} color="#2563eb" />
          </div>
          <strong className="stat-number" style={{ color: '#2563eb' }}>
            {adminCount}
          </strong>
          <div className="stat-bottom">
            <span>Acesso Total (Administradores)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Equipes Dirigentes</span>
            <Church size={20} color="#b45309" />
          </div>
          <strong className="stat-number" style={{ color: '#b45309' }}>
            {parishUsers.length}
          </strong>
          <div className="stat-bottom">
            <span>Acesso Paroquial (Nível Dirigente)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Cobertura Paroquial</span>
            <Buildings size={20} color="#15803d" />
          </div>
          <strong className="stat-number" style={{ color: '#15803d' }}>
            {coveredParishesCount} / 43
          </strong>
          <div className="stat-bottom">
            <span>Paróquias com acesso ativo</span>
          </div>
        </div>
      </div>

      {/* Barra de Ações e Filtros */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          {/* Busca */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por equipe, paróquia ou e-mail..."
              className="filter-input"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
            />
            <MagnifyingGlass
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
            />
          </div>

          {/* Filtro Perfil */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-input"
            style={{ fontSize: '0.82rem' }}
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin">Coordenação Diocesana</option>
            <option value="reviewer">Equipe Dirigente (Paroquial)</option>
            <option value="participant">Participante</option>
          </select>

          {/* Filtro Setor */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="filter-input"
            style={{ fontSize: '0.82rem' }}
          >
            <option value="all">Todos os Setores</option>
            {DIOCESAN_SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roman})
              </option>
            ))}
          </select>
        </div>

        {/* Botão de Novo Acesso */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="button button-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <Plus size={18} />
          Novo Acesso de Equipe Dirigente
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="table-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong style={{ fontSize: '0.98rem' }}>Usuários e Credenciais de Acesso</strong>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Controle institucional: Equipes Dirigentes possuem perfil funcional com troca de senha a cada mandato de 2 anos.
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Exibindo {filteredUsers.length} de {users.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário / Equipe</th>
                <th>E-mail Funcional</th>
                <th>Perfil</th>
                <th>Paróquia Vinculada</th>
                <th>Nível de Permissão</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-subtle)' }}>
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const sector = u.parish ? getSectorForParish(u.parish) : null;
                  const isViewer = u.id === viewer.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={u.full_name || 'Usuário'} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.9rem' }}>{u.full_name || 'Sem nome informado'}</strong>
                              {isViewer && (
                                <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  Você
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                              Criado em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                            {u.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.email, `email-${u.id}`)}
                            title="Copiar e-mail"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: copiedKey === `email-${u.id}` ? '#15803d' : 'var(--text-subtle)',
                              padding: '2px',
                            }}
                          >
                            {copiedKey === `email-${u.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      <td>
                        {u.role === 'admin' ? (
                          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} />
                            Coordenação Diocesana
                          </span>
                        ) : u.role === 'reviewer' ? (
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Church size={14} />
                            Equipe Dirigente
                          </span>
                        ) : (
                          <span className="badge badge-neutral">Participante</span>
                        )}
                      </td>

                      <td>
                        {u.parish ? (
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {u.parish}
                            </span>
                            {sector && (
                              <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 600 }}>
                                {sector.name} ({sector.roman})
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                            {u.role === 'admin' ? 'Âmbito Diocesano Geral' : 'Geral'}
                          </span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {u.role === 'admin' ? (
                            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                              Total (Gerenciamento, Cadastros & Auditoria)
                            </span>
                          ) : u.role === 'reviewer' ? (
                            <span style={{ color: '#92400e', fontWeight: 500 }}>
                              Consulta restrita (Encontros, Jovens & Histórico)
                            </span>
                          ) : (
                            'Consulta própria'
                          )}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenResetModal(u)}
                          className="button button-secondary"
                          style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          title="Redefinir senha para nova equipe ou recuperação"
                        >
                          <Key size={14} />
                          Redefinir Senha
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO ACESSO DE EQUIPE DIRIGENTE */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Novo Acesso de Equipe Dirigente"
        description="Crie uma conta funcional para a Paróquia. O e-mail e as credenciais são institucionais, facilitando a transição a cada biênio (2 anos)."
        wide
      >
        {createdSuccessCreds ? (
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle size={28} color="#15803d" weight="fill" />
                <div>
                  <strong style={{ fontSize: '1.05rem', color: '#166534' }}>Conta Criada com Sucesso!</strong>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#15803d' }}>
                    Envie estas credenciais para o Pároco ou para o Casal Coordenador da Equipe Dirigente.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: '8px', padding: '14px', fontSize: '0.88rem' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Paróquia:</strong> {createdSuccessCreds.parish}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Nome do Acesso:</strong> {createdSuccessCreds.name}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>E-mail Institucional:</strong>{' '}
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {createdSuccessCreds.email}
                  </code>
                </div>
                <div>
                  <strong>Senha Inicial:</strong>{' '}
                  <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {createdSuccessCreds.password}
                  </code>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `Olá! Aqui estão as credenciais de acesso da Equipe Dirigente ao Sistema Segue-me (Diocese de Anápolis):\n\nParóquia: ${createdSuccessCreds.parish}\nE-mail: ${createdSuccessCreds.email}\nSenha: ${createdSuccessCreds.password}\n\nAcesse em: https://sistemasegueme.com.br/entrar`,
                      'creds-all'
                    )
                  }
                  className="button button-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedKey === 'creds-all' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey === 'creds-all' ? 'Copiado para Área de Transferência!' : 'Copiar Mensagem com Credenciais'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="button button-secondary"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {createError && <Feedback message={createError} error />}

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <Info size={20} color="#2563eb" />
              <span>
                As equipes dirigentes recebem <strong>perfil de consulta</strong> (visualizam métricas, histórico de jovens, mandatos e palestras, sem permissão de apagar ou criar dados novos).
              </span>
            </div>

            {/* Setor e Paróquia */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Setor Diocesano:
                </label>
                <select
                  value={createSectorId}
                  onChange={(e) => handleSectorChangeInCreate(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  {DIOCESAN_SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roman}) — {s.region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Paróquia Vinculada:
                </label>
                <select
                  value={createParishName}
                  onChange={(e) => handleParishChangeInCreate(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  {DIOCESAN_SECTORS.find((s) => s.id === createSectorId)?.parishes.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nome da Conta */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Nome de Exibição da Conta:
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="filter-input"
                style={{ width: '100%', padding: '8px 12px' }}
              />
            </div>

            {/* E-mail Institucional e Senha Inicial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  E-mail Funcional (Permanente):
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  className="filter-input"
                  style={{ width: '100%', padding: '8px 12px', fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Sugestão automática para evitar e-mails pessoais que se perdem.
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Senha Inicial:</label>
                  <button
                    type="button"
                    onClick={() => setCreatePassword(generateSecurePassword())}
                    style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.74rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowsClockwise size={12} />
                    Gerar Outra
                  </button>
                </div>
                <input
                  type="text"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  className="filter-input"
                  style={{ width: '100%', padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Mínimo de 6 dígitos. Pode ser alterada depois.
                </span>
              </div>
            </div>

            {/* Tipo de Perfil */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Nível de Acesso:
              </label>
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value as 'reviewer' | 'admin')}
                className="filter-input"
                style={{ width: '100%', padding: '8px 12px' }}
              >
                <option value="reviewer">Equipe Dirigente (Consulta Paroquial · Somente Leitura)</option>
                <option value="admin">Coordenação Diocesana (Administrador Total)</option>
              </select>
            </div>

            {/* Botões do Formulário */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="button button-secondary"
                disabled={createBusy}
              >
                Cancelar
              </button>

              <SubmitButton busy={createBusy}>
                Criar Acesso Institucional
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: REDEFINIR SENHA (NOVA GESTÃO BIÊNIO) */}
      <Modal
        open={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Redefinir Senha (Nova Gestão / Biênio)"
        description={resetUser ? `Redefinição de senha para: ${resetUser.full_name} (${resetUser.email})` : ''}
      >
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resetError && <Feedback message={resetError} error />}
          {resetSuccess && <Feedback message={resetSuccess} />}

          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: '#854d0e',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Key size={20} />
            <span>
              Ao trocar a equipe dirigente (a cada 2 anos), gere uma nova senha aqui e repasse à nova liderança paroquial. O e-mail permanece o mesmo.
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Nova Senha Temporária:</label>
              <button
                type="button"
                onClick={() => setResetPassword(generateSecurePassword())}
                style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.74rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowsClockwise size={12} />
                Gerar Outra
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                className="filter-input"
                style={{ flex: 1, padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}
              />

              <button
                type="button"
                onClick={() => copyToClipboard(resetPassword, 'reset-pass')}
                className="button button-secondary"
                style={{ padding: '0 12px' }}
                title="Copiar senha"
              >
                {copiedKey === 'reset-pass' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="button button-secondary"
              disabled={resetBusy}
            >
              Fechar
            </button>

            <SubmitButton busy={resetBusy}>
              Salvar Nova Senha
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
