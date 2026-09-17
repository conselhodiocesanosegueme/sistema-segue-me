import Link from 'next/link';
import { ArrowRight, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getFilterOptions, getPeople } from '@/lib/data';
import { Avatar, Badge, PageHeading, Pagination } from '@/components/ui';
import { number } from '@/lib/format';
import { PeopleFilters } from '@/components/people-filters';

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

      <PeopleFilters
        parishes={options?.parishes || []}
        years={options?.years || []}
        filters={filters}
        isParochialReviewer={isParochialReviewer}
        parochialParish={parochialParish}
      />

      <div className="table-card">

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
