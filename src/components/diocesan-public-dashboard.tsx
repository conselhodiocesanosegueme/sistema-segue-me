"use client";

import Link from 'next/link';
import {
  BookOpen,
  Buildings,
  CalendarBlank,
  ChartBar,
  Church,
  Compass,
  Heart,
  Info,
  Path,
  ShieldCheck,
  Sparkle,
  UsersThree,
} from '@phosphor-icons/react';
import type { PublicDiocesanStats, Viewer } from '@/lib/types';
import { Badge, number } from './ui';

interface DiocesanPublicDashboardProps {
  stats: PublicDiocesanStats;
  viewer: Viewer;
}

export function DiocesanPublicDashboard({ stats, viewer }: DiocesanPublicDashboardProps) {
  const maxYearEncounters = Math.max(...stats.byYear.map(y => y.encounters), 1);

  return (
    <div className="content-stack" style={{ gap: '2rem' }}>
      {/* 1. HERO BANNER */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(163, 44, 45, 0.08) 0%, rgba(199, 137, 58, 0.08) 100%)',
          border: '1.5px solid var(--border-soft)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fff',
                border: '2px solid var(--brand-primary)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <img
                src="/logo-segue-me.png"
                alt="Logo Segue-me"
                width={52}
                height={52}
                style={{ objectFit: 'contain', borderRadius: '50%' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Badge variant="neutral">Diocese de Anápolis</Badge>
                <Badge variant="success">Painel Diocesano</Badge>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                Movimento Segue-me
              </h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '640px', lineHeight: 1.45 }}>
                Visão consolidada dos frutos e da história do movimento em nossa diocese. Mapeamento histórico preservando a privacidade e comunhão fraterna de todos os seguimistas.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/me"
              className="button button-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 2px 8px rgba(163, 44, 45, 0.25)',
              }}
            >
              <BookOpen size={18} weight="bold" />
              <span>Ver Meu Histórico no Segue-me</span>
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={16} color="var(--brand-primary)" weight="fill" />
          <span>
            Olá, <strong>{viewer.name}</strong>! Este painel exibe números consolidados em nível diocesano. Informações de contato e dados pessoais são estritamente restritos.
          </span>
        </div>
      </section>

      {/* 2. KPI METRICS CARDS */}
      <section>
        <div className="section-head" style={{ marginBottom: '1rem' }}>
          <div>
            <span className="section-overline">NÚMEROS GERAIS DA DIOCESE</span>
            <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0' }}>Dimensão e Abrangência do Movimento</h2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Jovens Vivenciandos */}
          <div
            className="kpi-card"
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-soft)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Jovens Vivenciantes
              </span>
              <span style={{ padding: '6px', borderRadius: '8px', background: 'rgba(163, 44, 45, 0.1)', color: 'var(--brand-primary)' }}>
                <Sparkle size={20} weight="fill" />
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1 }}>
              {number(stats.totalYouthVivenciou)}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Jovens que já viveram o encontro nas paróquias
            </p>
          </div>

          {/* Casais */}
          <div
            className="kpi-card"
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-soft)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Casais Seguimistas
              </span>
              <span style={{ padding: '6px', borderRadius: '8px', background: 'rgba(199, 137, 58, 0.15)', color: 'var(--brand-secondary)' }}>
                <Heart size={20} weight="fill" />
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {number(stats.totalCouples)}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Tios e casais doadores que servem e sustentam as etapas
            </p>
          </div>

          {/* Paróquias */}
          <div
            className="kpi-card"
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-soft)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Paróquias Integradas
              </span>
              <span style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 142, 60, 0.1)', color: '#2e7d32' }}>
                <Church size={20} weight="fill" />
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stats.totalParishes}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Comunidades paroquiais distribuídas nos 6 setores
            </p>
          </div>

          {/* Setores Pastorais */}
          <div
            className="kpi-card"
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-soft)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Setores Pastorais
              </span>
              <span style={{ padding: '6px', borderRadius: '8px', background: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}>
                <Compass size={20} weight="fill" />
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stats.totalSectors}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Divisões pastorais cobrindo Anápolis e municípios vizinhos
            </p>
          </div>

          {/* Encontros Catalogados */}
          <div
            className="kpi-card"
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-soft)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Encontros Catalogados
              </span>
              <span style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 31, 162, 0.1)', color: '#7b1fa2' }}>
                <CalendarBlank size={20} weight="fill" />
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stats.totalEncounters}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Edições conferidas e preservadas na base histórica
            </p>
          </div>
        </div>
      </section>

      {/* 3. ENCONTROS POR ETAPA E MODALIDADE */}
      <section>
        <div className="section-head" style={{ marginBottom: '1rem' }}>
          <div>
            <span className="section-overline">MODALIDADES E ETAPAS</span>
            <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0' }}>Encontros Diocesanos e Paroquiais</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* 1ª Etapa */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  Encontros Paroquiais
                </span>
                <Badge variant="success">{stats.byStage.firstStage} Realizados</Badge>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>1ª Etapa Segue-me</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Porta de entrada do movimento. Realizado em nível paroquial para despertar a juventude para Cristo através de testemunhos, círculos e serviço.
              </p>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)', paddingTop: '0.75rem' }}>
              ✓ Base ativa e catalogada em 31 paróquias
            </div>
          </div>

          {/* 2ª Etapa */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>
                  Aprofundamento Diocesano
                </span>
                <Badge variant="neutral">
                  {stats.byStage.secondStage > 0 ? `${stats.byStage.secondStage} Catalogados` : 'Em Catalogação'}
                </Badge>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>2ª Etapa Segue-me</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Etapa vocacional e de compromisso cristão para jovens que já vivenciaram a 1ª etapa e atuam ativamente em suas comunidades.
              </p>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)', paddingTop: '0.75rem' }}>
              ✓ Coordenação Diocesana
            </div>
          </div>

          {/* Retiro Mariano */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1976d2', textTransform: 'uppercase' }}>
                  Espiritualidade Mariana
                </span>
                <Badge variant="neutral">
                  {stats.byStage.retiroMariano > 0 ? `${stats.byStage.retiroMariano} Catalogados` : 'Em Catalogação'}
                </Badge>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>Retiro Mariano</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Fim de semana dedicado à oração profunda, silêncio interior e consagração filial a Nossa Senhora, Mãe da Igreja e Padroeira do Segue-me.
              </p>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)', paddingTop: '0.75rem' }}>
              ✓ Encontro de Espiritualidade
            </div>
          </div>

          {/* Congresso Eucarístico */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7b1fa2', textTransform: 'uppercase' }}>
                  Adoração e Unidade
                </span>
                <Badge variant="neutral">
                  {stats.byStage.congressoEucaristico > 0 ? `${stats.byStage.congressoEucaristico} Catalogados` : 'Em Catalogação'}
                </Badge>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>Congresso Eucarístico</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Grande celebração diocesana reunindo jovens e casais de todos os 6 setores em torno do banquete da Eucaristia e comunhão eclesial.
              </p>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)', paddingTop: '0.75rem' }}>
              ✓ Unidade Diocesana
            </div>
          </div>
        </div>
      </section>

      {/* 4. OS 6 SETORES PASTORAIS */}
      <section>
        <div className="section-head" style={{ marginBottom: '1rem' }}>
          <div>
            <span className="section-overline">ORGANIZAÇÃO PASTORAL</span>
            <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0' }}>Os 6 Setores da Diocese de Anápolis</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {stats.bySector.map((s) => (
            <div
              key={s.id}
              style={{
                padding: '1.25rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.85rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      background: 'rgba(163, 44, 45, 0.1)',
                      color: 'var(--brand-primary)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    SETOR {s.roman}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {s.encountersCount} {s.encountersCount === 1 ? 'encontro' : 'encontros'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{s.name}</h3>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {s.region}
                </p>

                {/* Lista das Paróquias Envolvidas */}
                {s.parishes && s.parishes.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'block',
                        marginBottom: '0.45rem',
                      }}
                    >
                      Paróquias Envolvidas ({s.parishes.length}):
                    </span>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      {s.parishes.map((p, pIdx) => (
                        <li
                          key={pIdx}
                          style={{
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            padding: '4px 8px',
                            borderRadius: '5px',
                            background: 'var(--bg-base)',
                            border: '1px solid rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--brand-primary)', marginRight: '6px' }}>•</span>
                            {p.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {p.city}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid var(--border-soft)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.35rem',
                }}
              >
                <span>{s.parishCount} paróquias integrantes</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Diocese de Anápolis</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. LINHA DO TEMPO ANUAL */}
      {stats.byYear.length > 0 && (
        <section
          style={{
            padding: '1.5rem',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border-soft)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div className="section-head" style={{ marginBottom: '1.5rem' }}>
            <div>
              <span className="section-overline">HISTÓRICO TEMPORAL</span>
              <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0' }}>Encontros Realizados por Ano</h2>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.85rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              minHeight: '160px',
            }}
          >
            {stats.byYear.map((item) => {
              const heightPct = Math.max(15, Math.round((item.encounters / maxYearEncounters) * 100));
              return (
                <div
                  key={item.year}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    flex: '1 0 54px',
                    minWidth: '54px',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {item.encounters}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${heightPct}px`,
                      background: 'linear-gradient(180deg, var(--brand-primary) 0%, rgba(163, 44, 45, 0.6) 100%)',
                      borderRadius: '6px 6px 2px 2px',
                      transition: 'all 0.2s ease',
                    }}
                    title={`${item.encounters} encontros em ${item.year}`}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {item.year}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. AVISO DE PRIVACIDADE E PROTEÇÃO DE DADOS */}
      <footer
        style={{
          padding: '1.25rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <ShieldCheck size={26} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
            Compromisso Diocesano com a Privacidade e Segurança de Dados
          </strong>
          Este painel é de caráter estatístico diocesano. Informações de telefone, e-mail, data de nascimento e anotações particulares dos participantes não são públicas e permanecem salvaguardadas sob estrito sigilo pastoral e conformidade legal. Para consultar os encontros nos quais você participou ou trabalhou, acesse{' '}
          <Link href="/me" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'underline' }}>
            Meu Histórico
          </Link>.
        </div>
      </footer>
    </div>
  );
}
