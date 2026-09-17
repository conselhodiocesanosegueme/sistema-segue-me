import Link from 'next/link';
import { ArrowRight, MagnifyingGlass, UserPlus, UsersThree, Funnel, X } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getFilterOptions, getPeople } from '@/lib/data';
import { Avatar, Badge, PageHeading, Pagination } from '@/components/ui';
import { number } from '@/lib/format';

interface PessoasPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PessoasPage({ searchParams }: PessoasPageProps) {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const rawParams = await searchParams;
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (value) filters[key] = value;
  }

  const isParochialReviewer = viewer.role === 'reviewer' && Boolean(viewer.parish);
  const parochialParish = viewer.parish || '';

  if (isParochialReviewer && parochialParish) {
    filters.parish = parochialParish;
  }

  const [result, options] = await Promise.all([
    getPeople(filters),
    getFilterOptions(),
  ]);

  const activeQuickFilter = filters.quickFilter || '';
  const currentParish = isParochialReviewer ? parochialParish : (filters.parish || '');
  const hasActiveFilters = Boolean(filters.q || (filters.parish && !isParochialReviewer) || filters.year || filters.team || filters.status || filters.quickFilter);

  const baseQueryParam = currentParish ? `parish=${encodeURIComponent(currentParish)}` : '';
  const makeUrl = (qf?: string) => {
    const params = new URLSearchParams();
    if (currentParish) params.set('parish', currentParish);
    if (qf) params.set('quickFilter', qf);
    if (filters.q) params.set('q', filters.q);
    const qs = params.toString();
    return `/pessoas${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="page-enter">
      {isParochialReviewer ? (
        <PageHeading
          eyebrow={`ACESSO PAROQUIAL · ${parochialParish.toUpperCase()}`}
          title="Participantes da Paróquia"
          description={`Documentação de todos os jovens que vivenciaram o Segue-me, pessoas que já trabalharam e casais atuantes na ${parochialParish}.`}
          actions={
            <Link href="/" className="button button-secondary">
              Voltar ao Painel Paroquial
            </Link>
          }
        />
      ) : (
        <PageHeading
          eyebrow="COORDENAÇÃO DIOCESANA · BASE GERAL"
          title="Pessoas que já vivenciaram o Segue-me"
          description="Documentação e controle de todos os participantes cadastrados nos encontros de todas as paróquias da Diocese de Anápolis."
          actions={
            <Link href="/pendencias" className="button button-secondary">
              <UsersThree size={18} />
              Ver duplicidades e revisões
            </Link>
          }
        />
      )}

      {/* Pílulas de Filtro Rápido Específicas do Segue-me */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
          Filtrar por:
        </span>
        <Link
          href={makeUrl()}
          className={`button ${!activeQuickFilter ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto' }}
        >
          Todos ({isParochialReviewer ? 'Paróquia' : 'Geral'})
        </Link>
        <Link
          href={makeUrl('youth_vivenciou')}
          className={`button ${activeQuickFilter === 'youth_vivenciou' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto' }}
        >
          Jovens que Vivenciaram
        </Link>
        <Link
          href={makeUrl('worked')}
          className={`button ${activeQuickFilter === 'worked' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto' }}
        >
          Trabalharam nas Equipes
        </Link>
        <Link
          href={makeUrl('couples')}
          className={`button ${activeQuickFilter === 'couples' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto' }}
        >
          Casais Atuantes / Tios
        </Link>
        <Link
          href={makeUrl('musicians')}
          className={`button ${activeQuickFilter === 'musicians' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto' }}
        >
          🎵 Músicos & Cantores
        </Link>
      </div>

      <div className="table-card">
        {/* Barra de Filtros */}
        <form method="get" className="filter-bar">
          {activeQuickFilter && (
            <input type="hidden" name="quickFilter" value={activeQuickFilter} />
          )}

          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="search"
              name="q"
              defaultValue={filters.q || ''}
              placeholder="Buscar por nome, código PES ou contato…"
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          {isParochialReviewer ? (
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--brand-light)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-border)', fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              {parochialParish}
              <input type="hidden" name="parish" value={parochialParish} />
            </div>
          ) : (
            <select name="parish" defaultValue={filters.parish || ''} className="filter-input">
              <option value="">Todas as paróquias</option>
              {options?.parishes?.map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          <select name="year" defaultValue={filters.year || ''} className="filter-input">
            <option value="">Todos os anos</option>
            {options?.years?.map((y: number) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          <select name="status" defaultValue={filters.status || ''} className="filter-input">
            <option value="">Todas as situações</option>
            <option value="Identificado">Identificado</option>
            <option value="Dados incompletos">Dados incompletos</option>
            <option value="Possível duplicidade">Possível duplicidade</option>
            <option value="Pendente">Pendente</option>
          </select>

          <button type="submit" className="button button-secondary" style={{ padding: '8px 14px' }}>
            <Funnel size={16} />
            Filtrar
          </button>

          {hasActiveFilters && (
            <Link
              href={isParochialReviewer ? `/pessoas?parish=${encodeURIComponent(parochialParish)}` : '/pessoas'}
              className="button button-secondary"
              style={{ padding: '8px 14px', color: 'var(--text-muted)' }}
            >
              <X size={15} />
              Limpar
            </Link>
          )}
        </form>

        {/* Tabela de Resultados */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Código</th>
                <th>Paróquia / Origem</th>
                <th>Participações</th>
                <th>Situação</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    Nenhuma pessoa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                result.items.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar name={person.name} src={person.photo_url} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Link
                              href={`/pessoas/${person.id}`}
                              style={{ fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}
                            >
                              {person.name}
                            </Link>
                            {person.skills?.sings && (
                              <span
                                title="Canta / Salmista / Coral"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: '#fdf2f8',
                                  color: '#be185d',
                                  border: '1px solid #fbcfe8',
                                  fontWeight: 600,
                                }}
                              >
                                🎤 Canto
                              </span>
                            )}
                            {person.skills?.instruments && person.skills.instruments.length > 0 && (
                              <span
                                title={person.skills.instruments.join(', ')}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  fontWeight: 600,
                                }}
                              >
                                🎸 {person.skills.instruments[0]}
                                {person.skills.instruments.length > 1 ? ` +${person.skills.instruments.length - 1}` : ''}
                              </span>
                            )}
                          </div>
                          {person.email && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {person.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                        {person.legacy_id || 'Sem código'}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {person.parish || 'Não informada'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {person.participation_count ?? 0} {person.participation_count === 1 ? 'encontro' : 'encontros'}
                      </span>
                    </td>
                    <td>
                      <Badge status={person.identification_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/pessoas/${person.id}`} className="text-link">
                        Ver histórico <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <Pagination
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          base="/pessoas"
          filters={filters}
        />
      </div>
    </div>
  );
}
