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
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>Pessoa</th>
                <th style={{ minWidth: '95px', whiteSpace: 'nowrap' }}>Código</th>
                <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Paróquia / Origem</th>
                <th className="col-participations" style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Participações</th>
                <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Situação</th>
                <th style={{ textAlign: 'right', minWidth: '70px', whiteSpace: 'nowrap' }}>Ações</th>
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                        <Avatar name={person.name} src={person.photo_url} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
                            <Link
                              href={`/pessoas/${person.id}`}
                              className="person-table-name"
                              style={{ fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }}
                            >
                              {person.name}
                            </Link>
                            {Boolean(
                              (person.skills?.other_skills || []).some(s => s.toLowerCase().includes('palestr') || s.toLowerCase().includes('prega')) ||
                              (typeof person.notes === 'string' && person.notes.includes('"is_speaker":true')) ||
                              (typeof person.notes === 'object' && (person.notes as any)?.is_speaker)
                            ) && (
                              <span
                                title="Palestrante / Pregador do Segue-me"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🎙️ Palestrante
                              </span>
                            )}
                            {person.availability?.status === 'disponivel' && (
                              <span
                                title="Disponível para servir nos próximos encontros"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🟢 Disponível
                              </span>
                            )}
                            {person.availability?.second_stage_status === 'desejo_vivenciar' && (
                              <span
                                title="Tem interesse em vivenciar a 2ª Etapa"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: '#fef9c3',
                                  color: '#854d0e',
                                  border: '1px solid #fde047',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🌟 2ª Etapa
                              </span>
                            )}
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
                                  whiteSpace: 'nowrap',
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
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🎸 {person.skills.instruments[0]}
                                {person.skills.instruments.length > 1 ? ` +${person.skills.instruments.length - 1}` : ''}
                              </span>
                            )}
                            {person.skills?.other_skills && person.skills.other_skills.filter(s => !s.toLowerCase().includes('palestr') && !s.toLowerCase().includes('prega')).length > 0 && (
                              <span
                                title={person.skills.other_skills.filter(s => !s.toLowerCase().includes('palestr') && !s.toLowerCase().includes('prega')).join(', ')}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: '#f3e8ff',
                                  color: '#7e22ce',
                                  border: '1px solid #e9d5ff',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ✨ {person.skills.other_skills.filter(s => !s.toLowerCase().includes('palestr') && !s.toLowerCase().includes('prega'))[0]}
                                {person.skills.other_skills.filter(s => !s.toLowerCase().includes('palestr') && !s.toLowerCase().includes('prega')).length > 1 ? ` +${person.skills.other_skills.filter(s => !s.toLowerCase().includes('palestr') && !s.toLowerCase().includes('prega')).length - 1}` : ''}
                              </span>
                            )}
                          </div>
                          {person.email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {person.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <code style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {person.legacy_id || 'Sem código'}
                      </code>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {person.parish || 'Não informada'}
                      </span>
                    </td>
                    <td className="col-participations" style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-neutral" style={{ whiteSpace: 'nowrap' }}>
                        {person.participation_count ?? 0} {person.participation_count === 1 ? 'encontro' : 'encontros'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Badge status={person.identification_status} />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link href={`/pessoas/${person.id}`} className="person-action-link" title="Ver histórico completo">
                        <span className="person-action-label">Ver histórico</span>
                        <ArrowRight size={15} />
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
