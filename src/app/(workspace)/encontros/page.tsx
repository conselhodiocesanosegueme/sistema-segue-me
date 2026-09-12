import Link from 'next/link';
import { CalendarBlank, MapPin, UsersThree, Funnel, X, ArrowRight, Sparkle, Tag } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getEncounters, getFilterOptions } from '@/lib/data';
import { Badge, PageHeading, Pagination } from '@/components/ui';
import { number } from '@/lib/format';
import { EncountersHeaderActions } from '@/components/encounters-header-actions';
import { ENCOUNTER_TYPES, EncounterType } from '@/lib/encounter-config';

interface EncontrosPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EncontrosPage({ searchParams }: EncontrosPageProps) {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const rawParams = await searchParams;
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (value) filters[key] = value;
  }

  const isParochialReviewer = viewer.role === 'reviewer';
  const parochialParish = viewer.parish || 'Paróquia São Francisco de Assis';

  if (isParochialReviewer) {
    filters.parish = parochialParish;
  }

  const [result, options] = await Promise.all([
    getEncounters(filters),
    getFilterOptions(),
  ]);

  const hasActiveFilters = Boolean(filters.q || filters.year || filters.type || (filters.parish && !isParochialReviewer));

  // Helper para construir links preservando query params
  function buildFilterHref(newType?: string) {
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    if (filters.parish && !isParochialReviewer) p.set('parish', filters.parish);
    if (filters.year) p.set('year', filters.year);
    if (newType) p.set('type', newType);
    const qs = p.toString();
    return qs ? `/encontros?${qs}` : '/encontros';
  }

  return (
    <div className="page-enter">
      {isParochialReviewer ? (
        <PageHeading
          eyebrow={`ACESSO PAROQUIAL · ${parochialParish.toUpperCase()}`}
          title="Encontros da Paróquia"
          description={`Edições do Segue-me já realizadas na ${parochialParish}, com participantes, equipes de trabalho e atas oficiais.`}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link href="/" className="button button-secondary">
                Voltar ao Painel Paroquial
              </Link>
              <EncountersHeaderActions defaultParish={parochialParish} />
            </div>
          }
        />
      ) : (
        <PageHeading
          eyebrow="COORDENAÇÃO DIOCESANA · TODAS AS PARÓQUIAS"
          title="Encontros Cadastrados"
          description="Mapeamento completo das edições paroquiais e diocesanas (1ª Etapa, 2ª Etapa, Retiro Mariano e Congresso Eucarístico) na Diocese de Anápolis."
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <EncountersHeaderActions />
            </div>
          }
        />
      )}

      {/* Abas Rápidas por Tipo de Encontro */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        <Link
          href={buildFilterHref(undefined)}
          className={`button ${!filters.type ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
        >
          Todos os Encontros
        </Link>
        {(Object.keys(ENCOUNTER_TYPES) as EncounterType[]).map((typeKey) => {
          const info = ENCOUNTER_TYPES[typeKey];
          const isSelected = filters.type === typeKey;
          return (
            <Link
              key={typeKey}
              href={buildFilterHref(typeKey)}
              className={`button ${isSelected ? 'button-primary' : 'button-secondary'}`}
              style={{
                padding: '7px 14px',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: isSelected ? undefined : `${info.badgeColor}40`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: info.badgeColor,
                }}
              />
              {typeKey} ({info.level})
            </Link>
          );
        })}
      </div>

      <div className="table-card">
        {/* Barra de Filtros */}
        <form method="get" className="filter-bar">
          {filters.type && <input type="hidden" name="type" value={filters.type} />}

          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="search"
              name="q"
              defaultValue={filters.q || ''}
              placeholder="Buscar por nome do encontro, edição ou cidade…"
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

          <button type="submit" className="button button-secondary" style={{ padding: '8px 14px' }}>
            <Funnel size={16} />
            Filtrar
          </button>

          {hasActiveFilters && (
            <Link
              href={isParochialReviewer ? `/encontros?parish=${encodeURIComponent(parochialParish)}` : '/encontros'}
              className="button button-secondary"
              style={{ padding: '8px 14px', color: 'var(--text-muted)' }}
            >
              <X size={15} />
              Limpar
            </Link>
          )}
        </form>

        {/* Lista de Encontros */}
        <div style={{ padding: '20px 24px' }}>
          {result.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              Nenhum encontro encontrado com os filtros selecionados.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {result.items.map((encounter) => {
                const encType = (encounter.type as EncounterType) || '1ª Etapa';
                const typeInfo = ENCOUNTER_TYPES[encType] || ENCOUNTER_TYPES['1ª Etapa'];
                const level = encounter.level || typeInfo.level;

                return (
                  <Link
                    key={encounter.id}
                    href={`/encontros/${encounter.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '18px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-base)',
                      background: '#fff',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'var(--transition)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    className="stat-card"
                  >
                    {/* Badges de Tipo, Nível e Ano */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: typeInfo.badgeBg,
                            color: typeInfo.badgeColor,
                            border: `1px solid ${typeInfo.badgeColor}33`,
                          }}
                        >
                          {encType}
                        </span>
                        <span
                          className="badge badge-neutral"
                          style={{
                            fontSize: '0.70rem',
                            fontWeight: 600,
                          }}
                        >
                          {level}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-neutral" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {encounter.year ?? 'A confirmar'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          Edição: {encounter.edition}
                        </span>
                      </div>
                    </div>

                    <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-primary)', marginBottom: '4px' }}>
                      {encounter.name || `${encounter.edition} Encontro Segue-me`}
                    </strong>

                    {encounter.theme && (
                      <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--brand-secondary)', marginBottom: '6px' }}>
                        "{encounter.theme}"
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <MapPin size={14} />
                      {level === 'Diocesano' ? (encounter.parish ? `${encounter.parish} (Diocesano)` : 'Diocese de Anápolis (Diocesano)') : (encounter.parish || 'Paróquia não informada')}
                    </div>

                    {encounter.city && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
                        {encounter.city}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <UsersThree size={16} />
                        {number(encounter.participation_count || 0)} participações
                      </span>
                      <span className="text-link" style={{ fontSize: '0.8rem' }}>
                        Ver detalhes <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginação */}
        <Pagination
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          base="/encontros"
          filters={filters}
        />
      </div>
    </div>
  );
}
