"use client";

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowsClockwise,
  Buildings,
  CalendarBlank,
  ChartBar,
  CheckCircle,
  Church,
  Database,
  FileText,
  Globe,
  HandHeart,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkle,
  UsersThree,
  Eye
} from '@phosphor-icons/react';
import type { Encounter, Overview, ReviewItem, Viewer } from '@/lib/types';
import { Badge, date, EmptyState, number, PageHeading } from './ui';
import { DIOCESAN_SECTORS, getSectorForParish } from '@/lib/sectors';

export const reviewNames = {
  correction: 'Correção de cadastro',
  duplicate: 'Possível duplicidade',
  identity: 'Vínculo de acesso',
  import_conflict: 'Divergência na importação'
};

export function ReviewList({ items, compact = false }: { items: ReviewItem[]; compact?: boolean }) {
  return (
    <div className={`review-list${compact ? ' review-list-compact' : ''}`}>
      {items.map((item) => (
        <Link className="review-list-row" key={item.id} href={`/pendencias?item=${encodeURIComponent(item.id)}`}>
          <span className={`review-symbol review-symbol-${item.kind}`}>
            {item.kind === 'identity' ? (
              <UsersThree size={19} />
            ) : item.kind === 'duplicate' ? (
              <UsersThree size={19} weight="fill" />
            ) : item.kind === 'correction' ? (
              <FileText size={19} />
            ) : (
              <ArrowsClockwise size={19} />
            )}
          </span>
          <div>
            <span className="row-overline">{reviewNames[item.kind]}</span>
            <strong>{item.title}</strong>
            <span>{date(item.created_at, true)}</span>
          </div>
          <ArrowUpRight size={18} />
        </Link>
      ))}
    </div>
  );
}

export function EncounterRows({ items }: { items: Encounter[] }) {
  return (
    <div className="encounter-rows">
      {items.map((encounter) => (
        <Link key={encounter.id} href={`/encontros/${encounter.id}`} className="encounter-row">
          <span className="encounter-year">
            {encounter.year ?? '—'}
            <CalendarBlank size={15} />
          </span>
          <div className="encounter-row-text">
            <strong>{encounter.name || `${encounter.edition}º Encontro Segue-me`}</strong>
            <span>
              <MapPin size={13} />
              {encounter.parish || 'Paróquia não informada'}
              {encounter.city ? ` · ${encounter.city}` : ''}
            </span>
          </div>
          {encounter.participation_count !== undefined && (
            <span className="encounter-row-count">
              <UsersThree size={16} />
              {number(encounter.participation_count)}
            </span>
          )}
          <ArrowUpRight size={18} />
        </Link>
      ))}
    </div>
  );
}

interface OverviewViewProps {
  data: Overview;
  viewer?: Viewer;
  selectedParish?: string | null;
}

export function OverviewView({ data, viewer, selectedParish }: OverviewViewProps) {
  const isParochial = data.isParochial;
  const parishName = data.parishName || selectedParish || '';
  const currentSector = parishName ? getSectorForParish(parishName) : undefined;

  // 5 Métricas Paroquiais Solicitadas pelo usuário
  const parochialStats = [
    {
      title: 'Jovens que vivenciaram',
      value: data.youthVivenciouCount ?? 0,
      detail: 'Jovens com vivência confirmada',
      icon: UsersThree,
      link: `/pessoas?parish=${encodeURIComponent(parishName)}&quickFilter=youth_vivenciou`,
      className: 'stat-primary',
    },
    {
      title: 'Encontros já realizados',
      value: data.encounters,
      detail: `Edições em ${parishName}`,
      icon: CalendarBlank,
      link: `/encontros?parish=${encodeURIComponent(parishName)}`,
      className: '',
    },
    {
      title: 'Pessoas que já fizeram',
      value: data.peopleMadeCount ?? 0,
      detail: 'Total que vivenciou o encontro',
      icon: HandHeart,
      link: `/pessoas?parish=${encodeURIComponent(parishName)}&kind=Vivenciou`,
      className: '',
    },
    {
      title: 'Pessoas que já trabalharam',
      value: data.peopleWorkedCount ?? 0,
      detail: 'Integrantes em equipes e serviço',
      icon: ChartBar,
      link: `/pessoas?parish=${encodeURIComponent(parishName)}&quickFilter=worked`,
      className: '',
    },
    {
      title: 'Casais atuantes / tios',
      value: data.couplesCount ?? 0,
      detail: 'Casais em círculos, equipes e conselho',
      icon: Heart,
      link: `/pessoas?parish=${encodeURIComponent(parishName)}&quickFilter=couples`,
      className: '',
    },
  ];

  // Métricas da Coordenação Diocesana Geral - Dashboard com contagem expressa de Paróquias e Setores
  const diocesanStats = [
    {
      title: 'Setores Oficiais',
      value: 6,
      detail: 'Diocese de Anápolis',
      icon: Buildings,
      link: '/setores',
      className: '',
    },
    {
      title: 'Paróquias Cadastradas',
      value: DIOCESAN_SECTORS.reduce((acc, s) => acc + s.parishes.length, 0),
      detail: `${number(data.parishes)} paróquias que tiveram encontros`,
      icon: Church,
      link: '/setores',
      className: 'stat-primary',
    },
    {
      title: 'Encontros Cadastrados',
      value: data.encounters,
      detail: 'Edições na Diocese de Anápolis',
      icon: CalendarBlank,
      link: '/encontros',
      className: '',
    },
    {
      title: 'Total de Pessoas',
      value: data.people,
      detail: 'Cadastradas na Diocese de Anápolis',
      icon: UsersThree,
      link: '/pessoas',
      className: '',
    },
    {
      title: 'Jovens que vivenciaram',
      value: data.youthVivenciouCount ?? 0,
      detail: 'Total diocesano de encontristas',
      icon: Sparkle,
      link: '/pessoas?quickFilter=youth_vivenciou',
      className: '',
    },
    {
      title: 'Trabalharam em equipes',
      value: data.peopleWorkedCount ?? 0,
      detail: 'Voluntários e dirigentes diocesanos',
      icon: HandHeart,
      link: '/pessoas?quickFilter=worked',
      className: '',
    },
    {
      title: 'Casais no movimento',
      value: data.couplesCount ?? 0,
      detail: 'Casais atuantes em todas as paróquias',
      icon: Heart,
      link: '/pessoas?quickFilter=couples',
      className: '',
    },
    {
      title: 'Cadastros para análise',
      value: data.pending,
      detail: data.pending ? 'Aguardando validação da equipe' : 'Todos os cadastros validados',
      icon: ShieldCheck,
      link: '/pendencias',
      className: data.pending ? 'stat-attention' : '',
    },
  ];

  const stats = isParochial ? parochialStats : diocesanStats;
  const years = data.byYear.slice(-18);
  const max = Math.max(1, ...years.map((item) => item.total));
  const totalChart = years.reduce((total, item) => total + item.total, 0);

  return (
    <div className="page-enter">
      {/* Banner de Recorte Paroquial Ativo (apenas quando filtrado) */}
      {isParochial && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffdf8, #fef8e7)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Church size={20} weight="fill" />
            </span>
            <div>
              <strong style={{ fontSize: '0.98rem', color: 'var(--brand-text)', display: 'block' }}>
                Recorte Paroquial Ativo: {parishName}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentSector ? `${currentSector.name} · ${currentSector.region}` : 'Diocese de Anápolis'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/setores"
              className="button button-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Buildings size={15} />
              Ver Setores
            </Link>
            {viewer?.role === 'admin' && (
              <Link
                href="/"
                className="button button-primary"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                Voltar à Visão Geral Diocesana
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cabeçalho da Página */}
      {isParochial ? (
        <PageHeading
          eyebrow={viewer?.role === 'reviewer'
            ? `ACESSO PAROQUIAL · ${currentSector ? `${currentSector.name} · ` : ''}EQUIPE DIRIGENTE`
            : `COORDENAÇÃO DIOCESANA · ${currentSector ? `${currentSector.name} · ` : ''}RECORTE PAROQUIAL`}
          title={parishName}
          description="Acesso aos dados da paróquia: jovens que já vivenciaram o Segue-me, edições realizadas, pessoas que fizeram, pessoas que já trabalharam e casais atuantes."
          actions={
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href={`/pessoas?parish=${encodeURIComponent(parishName)}&quickFilter=youth_vivenciou`}
                className="button button-primary"
              >
                <UsersThree size={18} />
                Ver Jovens da Paróquia
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href={`/encontros?parish=${encodeURIComponent(parishName)}`}
                className="button button-secondary"
              >
                <CalendarBlank size={18} />
                Encontros da Paróquia
              </Link>
            </div>
          }
        />
      ) : (
        <PageHeading
          eyebrow="COORDENAÇÃO DIOCESANA · PAINEL EXECUTIVO GERAL"
          title="Dashboard do Movimento Segue-me"
          description="Acesso central aos dados consolidados da Diocese de Anápolis: participantes, encontros históricos, validações cadastrais e os 6 setores territoriais."
          actions={
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/setores" className="button button-primary">
                <Buildings size={18} />
                Setores e Paróquias (6)
                <ArrowUpRight size={16} />
              </Link>
              <Link href="/pessoas" className="button button-secondary">
                <UsersThree size={18} />
                Pessoas na base
              </Link>
            </div>
          }
        />
      )}

      {/* Grid de Estatísticas (Dashboard KPIs) */}
      <div className="stats-grid">
        {stats.map(({ title, value, detail, icon: Icon, link, className }) => (
          <Link href={link} className={`stat-card ${className}`} key={title}>
            <div className="stat-top">
              <span>{title}</span>
              <Icon size={22} weight="duotone" />
            </div>
            <strong className="stat-number">{number(value)}</strong>
            <div className="stat-bottom">
              <span>{detail}</span>
              <ArrowUpRight size={16} />
            </div>
          </Link>
        ))}
      </div>

      {/* Widget Panorâmico dos 6 Setores Diocesanos (Visão Executiva) */}
      {!isParochial && (
        <section className="overview-sectors-panel">
          <div className="overview-sectors-header">
            <div>
              <div className="section-kicker" style={{ marginBottom: '4px' }}>
                <span className="small-line" />
                DIOCESE DE ANÁPOLIS · EDITAL 2026
              </div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                Panorama dos 6 Setores da Diocese de Anápolis
              </h2>
            </div>
            <Link
              href="/setores"
              className="button button-secondary"
              style={{ fontSize: '0.84rem', gap: '8px' }}
            >
              <Buildings size={17} color="var(--brand-primary)" />
              Abrir Painel Completo de Setores e Paróquias
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="sectors-quick-grid">
            {DIOCESAN_SECTORS.map((s) => (
              <Link
                key={s.id}
                href="/setores"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-light)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                className="sector-quick-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--brand-light)',
                      color: 'var(--brand-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                    }}
                  >
                    {s.roman}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.2 }}>
                      {s.name}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {s.region.split('/')[0]}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#ffffff',
                      border: '1px solid var(--border-base)',
                      color: 'var(--text-muted)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {s.parishes.length} paróquias
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Seção Central */}
      <div className="overview-middle">
        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">
                <span className="small-line" />
                {isParochial ? `HISTÓRICO NA ${parishName.toUpperCase()}` : 'HISTÓRICO DIOCESANO AO LONGO DOS ANOS'}
              </div>
              <h2>Participações por edição</h2>
            </div>
            <span className="chart-legend">
              <span />
              Participações
            </span>
          </div>
          {years.length ? (
            <>
              <div className="chart-meta">
                <strong>{number(totalChart)}</strong>
                <span>
                  registros entre {years[0].year} e {years.at(-1)?.year}
                </span>
              </div>
              <div className="bar-chart-scroll">
                <div
                  className="bar-chart"
                  role="img"
                  aria-label={`Participações por ano: ${years.map((item) => `${item.year}: ${item.total}`).join('; ')}`}
                >
                  <div className="chart-guidelines" aria-hidden="true">
                    <span>{number(max)}</span>
                    <span>{number(Math.round(max / 2))}</span>
                    <span>0</span>
                  </div>
                  <div className="chart-bars">
                    {years.map((item, index) => (
                      <div
                        className="chart-column"
                        key={item.year}
                        title={`${item.year}: ${number(item.total)} participações`}
                      >
                        <div
                          className={`chart-bar${index === years.length - 1 ? ' chart-bar-current' : ''}`}
                          style={{ height: `${Math.max(2, (item.total / max) * 100)}%` }}
                        >
                          <span className="chart-tooltip">{number(item.total)}</span>
                        </div>
                        <span className="chart-year">{item.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart-footnote">
                <ChartBar size={16} />
                Cada registro documenta a vivência confirmada em um encontro.
              </div>
            </>
          ) : (
            <EmptyState
              title="Sem registros para o gráfico"
              description="As participações por edição aparecerão aqui conforme forem cadastradas na paróquia."
            />
          )}
        </section>

        <section className="panel care-panel">
          <div className="care-icon">
            <ShieldCheck size={27} weight="duotone" />
          </div>
          <span className="section-kicker">VALIDAÇÃO CADASTRAL</span>
          <h2>
            Análise da Equipe.<br />
            <em>Acesso Autorizado.</em>
          </h2>
          <p>
            Cada novo cadastro passa por análise prévia da nossa equipe para confirmar que a pessoa de fato já vivenciou o Segue-me.
          </p>
          <div className="care-divider" />
          <div className="care-metric">
            <span>Cadastros aguardando análise</span>
            <strong>{number(data.pending)}</strong>
          </div>
          <div className="care-metric">
            <span>Acessos autorizados e confirmados</span>
            <strong>{number(data.linkedAccounts)}</strong>
          </div>
          <Link href="/pendencias" className="button button-secondary care-button">
            {data.pending ? 'Analisar cadastros' : 'Ver validações'}
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>

      {/* Seção Inferior */}
      <div className="overview-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">
                {isParochial ? `ENCONTROS DA ${parishName.toUpperCase()}` : 'REGISTRO DE ENCONTROS DIOCESANOS'}
              </span>
              <h2>Encontros documentados</h2>
            </div>
            <Link className="text-link" href={isParochial ? `/encontros?parish=${encodeURIComponent(parishName)}` : '/encontros'}>
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          {data.latestEncounters.length ? (
            <EncounterRows items={data.latestEncounters.slice(0, 4)} />
          ) : (
            <EmptyState
              title="Nenhum encontro listado"
              description="Os encontros documentados aparecerão aqui."
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">FILA DE VALIDAÇÃO</span>
              <h2>Cadastros e pendências</h2>
            </div>
            <Link className="text-link" href="/pendencias">
              Ver fila <ArrowRight size={15} />
            </Link>
          </div>
          {data.recentReviews.length ? (
            <ReviewList items={data.recentReviews.slice(0, 3)} compact />
          ) : (
            <div className="all-clear">
              <CheckCircle size={37} weight="duotone" />
              <h3>Tudo em dia por aqui.</h3>
              <p>As novas solicitações de cadastro aparecerão neste espaço.</p>
            </div>
          )}
        </section>
      </div>

      <div className="sync-strip">
        <span className="sync-strip-icon">
          <Database size={21} />
        </span>
        <div>
          <strong>{data.lastImport ? 'Última importação da base' : 'Base de dados documentada'}</strong>
          <span>
            {data.lastImport
              ? date(data.lastImport.completed_at ?? data.lastImport.created_at)
              : isParochial
              ? `Documentação histórica da ${parishName}.`
              : 'Documentação oficial das edições e paróquias da Diocese de Anápolis.'}
          </span>
        </div>
        {data.lastImport && <Badge status={data.lastImport.status} />}
        {viewer?.role === 'admin' && (
          <Link href="/importacoes" className="text-link">
            Acompanhar importações <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
