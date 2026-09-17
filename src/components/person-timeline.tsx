"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarBlank,
  MapPin,
  UsersThree,
  CheckCircle,
  Clock,
  Sparkle,
  ArrowUpRight,
  HandHeart,
  SuitcaseSimple,
  Buildings,
} from '@phosphor-icons/react';
import type { Participation } from '@/lib/types';
import { isMandateRecord, isExternalImplantation } from '@/lib/encounter-config';
import { getConditionMeta } from '@/components/encounter-detail-view';

interface PersonTimelineProps {
  participations: Participation[];
  isStaff: boolean;
}

export function PersonTimeline({ participations, isStaff }: PersonTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'vivenciou' | 'trabalhou' | 'palestrou'>('all');

  // Apenas participações reais em encontros (Vivência, Trabalho e Palestras), sem poluição de mandatos vigentes
  const realParticipations = useMemo(() => {
    return participations.filter(p => !isMandateRecord(p));
  }, [participations]);

  const vivenciouCount = useMemo(() => {
    return realParticipations.filter(p => p.kind === 'Vivenciou').length;
  }, [realParticipations]);

  const trabalhouCount = useMemo(() => {
    return realParticipations.filter(p => p.kind === 'Trabalhou').length;
  }, [realParticipations]);

  const palestrouCount = useMemo(() => {
    return realParticipations.filter(p => p.kind === 'Palestrou').length;
  }, [realParticipations]);

  const filteredItems = useMemo(() => {
    let items = realParticipations;
    if (filter === 'vivenciou') items = realParticipations.filter(p => p.kind === 'Vivenciou');
    else if (filter === 'trabalhou') items = realParticipations.filter(p => p.kind === 'Trabalhou');
    else if (filter === 'palestrou') items = realParticipations.filter(p => p.kind === 'Palestrou');

    return [...items].sort((a, b) => {
      const yA = a.encounter?.year || 0;
      const yB = b.encounter?.year || 0;
      if (yB !== yA) return yB - yA; // Mais recente primeiro (2026 -> 2011)

      const edA = typeof a.encounter?.edition === 'number' ? a.encounter.edition : Number(a.encounter?.edition || 0);
      const edB = typeof b.encounter?.edition === 'number' ? b.encounter.edition : Number(b.encounter?.edition || 0);
      return edB - edA;
    });
  }, [realParticipations, filter]);

  return (
    <section className="panel" style={{ padding: '24px' }}>
      {/* Cabeçalho da Trajetória com Abas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <span className="section-kicker">TRAJETÓRIA NO MOVIMENTO</span>
          <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', margin: '2px 0 0 0' }}>
            Histórico de Encontros ({realParticipations.length})
          </h2>
        </div>

        {/* Filtros da Linha do Tempo */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-canvas)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: filter === 'all' ? '#ffffff' : 'transparent',
              color: filter === 'all' ? 'var(--brand-primary)' : 'var(--text-muted)',
              boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Todos ({realParticipations.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('vivenciou')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: filter === 'vivenciou' ? '#ffffff' : 'transparent',
              color: filter === 'vivenciou' ? '#16a34a' : 'var(--text-muted)',
              boxShadow: filter === 'vivenciou' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            <HandHeart size={14} weight="bold" />
            Vivenciou ({vivenciouCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('trabalhou')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: filter === 'trabalhou' ? '#ffffff' : 'transparent',
              color: filter === 'trabalhou' ? '#2563eb' : 'var(--text-muted)',
              boxShadow: filter === 'trabalhou' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            <SuitcaseSimple size={14} weight="bold" />
            Trabalhou em Serviço ({trabalhouCount})
          </button>

          {palestrouCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('palestrou')}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: filter === 'palestrou' ? '#ffffff' : 'transparent',
                color: filter === 'palestrou' ? '#7c3aed' : 'var(--text-muted)',
                boxShadow: filter === 'palestrou' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkle size={14} weight="bold" />
              Palestrou ({palestrouCount})
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
          Nenhum registro correspondente ao filtro selecionado.
        </div>
      ) : (
        <div className="timeline" style={{ marginTop: '10px' }}>
          {filteredItems.map((part) => {
            const isVivenciou = part.kind === 'Vivenciou';
            const isPalestrou = part.kind === 'Palestrou';
            const condMeta = getConditionMeta(part.condition, part.role);

            const dotBorder = isVivenciou ? '#16a34a' : isPalestrou ? '#7c3aed' : '#2563eb';
            const cardBorder = isVivenciou ? '3.5px solid #16a34a' : isPalestrou ? '3.5px solid #7c3aed' : '3.5px solid #2563eb';

            return (
              <div key={part.id} className="timeline-item">
                <div
                  className="timeline-dot"
                  style={{
                    borderColor: dotBorder,
                    background: isVivenciou ? '#f0fdf4' : isPalestrou ? '#faf5ff' : '#eff6ff',
                  }}
                />
                <div
                  className="timeline-card"
                  style={{
                    borderLeft: cardBorder,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        {isExternalImplantation(part.encounter) && part.kind === 'Trabalhou' ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: '#cffafe',
                              color: '#0e7490',
                              border: '1px solid #a5f3fc',
                            }}
                          >
                            🌐 Missão de Implantação Externa
                          </span>
                        ) : isVivenciou ? (
                          <>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              ★ Vivenciou o encontro
                            </span>
                            {part.is_external_seed && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                }}
                              >
                                🌱 Remessa de Implantação
                              </span>
                            )}
                          </>
                        ) : part.kind === 'Palestrou' ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: '#f3e8ff',
                              color: '#7c3aed',
                              border: '1px solid #d8b4fe',
                            }}
                          >
                            🎤 Ministrou palestra
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            🛠️ Trabalhou em equipe de serviço
                          </span>
                        )}

                        {/* Etiqueta de Condição Diferenciada */}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: condMeta.badgeBg,
                            color: condMeta.badgeColor,
                            border: `1px solid ${condMeta.badgeBorder}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {condMeta.iconEmoji} {condMeta.conditionLabel}
                        </span>
                      </div>

                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                        {part.encounter ? (
                          <Link
                            href={`/encontros/${part.encounter.id}`}
                            style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            {part.encounter.name || `${part.encounter.edition}º Encontro Segue-me`}
                            <ArrowUpRight size={15} color="var(--brand-primary)" />
                          </Link>
                        ) : (
                          'Encontro Segue-me'
                        )}
                      </h3>
                    </div>

                    {part.encounter?.year && (
                      <span
                        className="badge badge-neutral"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CalendarBlank size={13} />
                        {part.encounter.year}
                      </span>
                    )}
                  </div>

                  {/* Informações detalhadas da atuação */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px 16px',
                      fontSize: '0.84rem',
                      background: 'var(--bg-canvas)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      margin: '10px 0',
                    }}
                  >
                    {part.team && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                          Equipe de Trabalho
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>{part.team}</strong>
                      </div>
                    )}

                    {part.role && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                          Função / Atuação
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>{part.role}</strong>
                      </div>
                    )}

                    {part.circle && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                          Círculo
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>Círculo {part.circle}</strong>
                      </div>
                    )}

                    {part.patron && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                          Padroeiro do Círculo
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>{part.patron}</strong>
                      </div>
                    )}
                  </div>

                  {/* Localização, Diocese e Paróquia */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {part.encounter?.target_diocese && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#0e7490', fontWeight: 600 }}>
                          <Buildings size={14} color="#0891b2" />
                          <span>Diocese: {part.encounter.target_diocese}</span>
                        </div>
                      )}

                      {part.encounter?.parish && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                          <MapPin size={14} color="var(--brand-primary)" />
                          <strong>{part.encounter.parish}</strong>
                          {part.encounter.city ? `· ${part.encounter.city}` : ''}
                        </div>
                      )}
                    </div>

                    {isStaff && part.source_page && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                        Documentado na pág. {part.source_page} do quadrante original
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
