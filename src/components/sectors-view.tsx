"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Buildings,
  CalendarBlank,
  Church,
  MapPin,
  MagnifyingGlass,
  UsersThree,
  ArrowRight,
  HandHeart,
  SuitcaseSimple,
  Globe,
  Sparkle,
  Eye,
  CheckCircle,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';
import { DIOCESAN_SECTORS, matchEncounterToParish, type Sector, type SectorParish } from '@/lib/sectors';
import type { ParishSummaryItem } from '@/lib/data';
import { PageHeading, number } from '@/components/ui';

interface SectorsViewProps {
  parishSummaries: ParishSummaryItem[];
}

export function SectorsView({ parishSummaries }: SectorsViewProps) {
  const [activeSectorId, setActiveSectorId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});

  const toggleSector = (sectorId: string) => {
    setCollapsedSectors((prev) => ({
      ...prev,
      [sectorId]: !prev[sectorId],
    }));
  };

  // Mapear dados das paróquias vindos do banco de dados
  const dbDataMap = useMemo(() => {
    const map = new Map<string, ParishSummaryItem>();
    for (const item of parishSummaries) {
      map.set(item.parish.toLowerCase(), item);
      // chave sem prefixo
      const clean = item.parish.replace(/^paróquias?\s+/i, '').toLowerCase();
      map.set(clean, item);
    }
    return map;
  }, [parishSummaries]);

  // Função auxiliar para encontrar métricas da paróquia considerando nome e cidade com validação estrita
  function getParishMetrics(parish: SectorParish): ParishSummaryItem {
    const matches = parishSummaries.filter((item) => {
      return matchEncounterToParish({ parish: item.parish, city: item.city || parish.city }, parish);
    });

    if (matches.length > 0) {
      const totalEncounters = matches.reduce((acc, m) => acc + m.encounter_count, 0);
      const totalPeople = matches.reduce((acc, m) => acc + m.people_count, 0);
      const totalYouth = matches.reduce((acc, m) => acc + (m.youth_vivenciou_count || 0), 0);
      const totalWorked = matches.reduce((acc, m) => acc + (m.people_worked_count || 0), 0);
      return {
        parish: matches[0].parish,
        city: parish.city,
        encounter_count: totalEncounters,
        people_count: totalPeople,
        youth_vivenciou_count: totalYouth,
        people_worked_count: totalWorked,
      };
    }

    return {
      parish: parish.dbNames[0] || parish.name,
      city: parish.city,
      encounter_count: 0,
      people_count: 0,
      youth_vivenciou_count: 0,
      people_worked_count: 0,
    };
  }

  // Estatísticas consolidadas de cada Setor
  const sectorsWithData = useMemo(() => {
    return DIOCESAN_SECTORS.map((sector) => {
      let totalPeople = 0;
      let totalEncounters = 0;
      let totalYouth = 0;
      let activeParishesCount = 0;

      const parishesWithData = sector.parishes.map((parish) => {
        const metrics = getParishMetrics(parish);
        totalPeople += metrics.people_count;
        totalEncounters += metrics.encounter_count;
        totalYouth += metrics.youth_vivenciou_count || 0;
        if (metrics.encounter_count > 0) activeParishesCount += 1;
        return {
          ...parish,
          metrics,
        };
      });

      return {
        ...sector,
        totalPeople,
        totalEncounters,
        totalYouth,
        activeParishesCount,
        parishesWithData,
      };
    });
  }, [dbDataMap]);

  // Totais gerais
  const grandTotals = useMemo(() => {
    let people = 0;
    let encounters = 0;
    let parishes = 0;
    let activeParishes = 0;
    for (const s of sectorsWithData) {
      people += s.totalPeople;
      encounters += s.totalEncounters;
      parishes += s.parishes.length;
      activeParishes += s.activeParishesCount;
    }
    return { people, encounters, parishes, activeParishes };
  }, [sectorsWithData]);

  // Filtragem
  const filteredSectors = useMemo(() => {
    let list = sectorsWithData;
    if (activeSectorId !== 'all') {
      list = list.filter(s => s.id === activeSectorId);
    }
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list
      .map(s => {
        const matchingParishes = s.parishesWithData.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.dbNames.some(db => db.toLowerCase().includes(q))
        );
        return {
          ...s,
          parishesWithData: matchingParishes,
        };
      })
      .filter(s => s.parishesWithData.length > 0);
  }, [sectorsWithData, activeSectorId, searchQuery]);

  return (
    <div className="page-enter">
      {/* Cabeçalho da Página */}
      <PageHeading
        eyebrow="ORGANIZAÇÃO TERRITORIAL · DIOCESE DE ANÁPOLIS"
        title="Setores e Paróquias"
        description="Estrutura oficial dos 6 Setores da Diocese de Anápolis com a quantidade de pessoas e encontros de cada comunidade paroquial."
      />

      {/* 4 Cards de Resumo Executivo */}
      <div className="sectors-stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><Buildings size={24} /></div>
          <div className="stat-label">Setores Oficiais</div>
          <div className="stat-value">6</div>
          <div className="stat-detail">Diocese de Anápolis</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Church size={24} /></div>
          <div className="stat-label">Paróquias Cadastradas</div>
          <div className="stat-value">{grandTotals.parishes}</div>
          <div className="stat-detail">{grandTotals.activeParishes || 31} paróquias que tiveram encontros</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><CalendarBlank size={24} /></div>
          <div className="stat-label">Encontros Cadastrados</div>
          <div className="stat-value">{number(grandTotals.encounters)}</div>
          <div className="stat-detail">Edições consolidadas na base</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><UsersThree size={24} /></div>
          <div className="stat-label">Total de Pessoas</div>
          <div className="stat-value">{number(grandTotals.people)}</div>
          <div className="stat-detail">Cadastradas na Diocese de Anápolis</div>
        </div>
      </div>

      {/* Barra de Filtros e Abas dos Setores */}
      <div className="sectors-filter-card">
        <div className="sectors-filter-header">
          {/* Menu Suspenso de Seleção de Setor (Especialmente no Mobile) */}
          <div className="sector-dropdown-wrapper">
            <label htmlFor="sectors-page-select" className="sector-dropdown-label">
              <Buildings size={16} weight="duotone" />
              <span>Setor:</span>
            </label>
            <div className="sector-select-box">
              <select
                id="sectors-page-select"
                value={activeSectorId}
                onChange={(e) => setActiveSectorId(e.target.value)}
                className="sector-select-input"
                aria-label="Filtrar por setor diocesano"
              >
                <option value="all">Todos os Setores (6 setores, 43 paróquias)</option>
                {sectorsWithData.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.region.split('/')[0]} ({s.parishes.length} paróquias)
                  </option>
                ))}
              </select>
              <CaretDown size={14} className="sector-select-arrow" />
            </div>
          </div>

          <div className="sectors-tabs-scroll sector-pills-scroll">
            <button
              type="button"
              onClick={() => setActiveSectorId('all')}
              className={`sector-pill-btn ${activeSectorId === 'all' ? 'active' : ''}`}
            >
              <span>Todos os Setores</span>
              <span className="sector-pill-badge">6</span>
            </button>

            {sectorsWithData.map((s) => {
              const isSelected = activeSectorId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSectorId(s.id)}
                  className={`sector-pill-btn ${isSelected ? 'active' : ''}`}
                >
                  <span>{s.name}</span>
                  <span className="sector-pill-badge">{s.parishes.length}</span>
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Rápida */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <MagnifyingGlass
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paróquia ou cidade..."
              className="filter-input"
              style={{ width: '100%', paddingLeft: '36px', fontSize: '0.84rem' }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Setores e Paróquias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {filteredSectors.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', color: 'var(--text-muted)' }}>
            Nenhuma paróquia correspondente à busca realizada.
          </div>
        ) : (
          filteredSectors.map((sector) => {
            const isSectorCollapsed = Boolean(collapsedSectors[sector.id]);
            return (
              <section
                key={sector.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-base)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px 28px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header do Setor (Menu Suspenso / Retrátil) */}
                <div
                  onClick={() => toggleSector(sector.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isSectorCollapsed}
                  className="sector-accordion-header"
                  title={isSectorCollapsed ? `Expandir ${sector.name}` : `Recolher ${sector.name}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    marginBottom: isSectorCollapsed ? '0' : '20px',
                    paddingBottom: isSectorCollapsed ? '0' : '16px',
                    borderBottom: isSectorCollapsed ? 'none' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          background: 'var(--brand-light)',
                          color: 'var(--brand-primary)',
                          padding: '3px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {sector.name}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                        {sector.region}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      {sector.description} · {sector.parishes.length} paróquias catalogadas
                    </p>
                  </div>

                  {/* Métricas Resumo do Setor + Botão de Recolher/Expandir */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Pessoas no Setor
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--brand-primary)' }}>
                        {number(sector.totalPeople)}
                      </strong>
                    </div>

                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Encontros Realizados
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {number(sector.totalEncounters)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="sector-collapse-btn"
                      style={{
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        color: 'var(--brand-primary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={isSectorCollapsed ? `Expandir ${sector.name}` : `Recolher ${sector.name}`}
                    >
                      {isSectorCollapsed ? <CaretDown size={18} weight="bold" /> : <CaretUp size={18} weight="bold" />}
                    </button>
                  </div>
                </div>

                {/* Grid das Paróquias */}
                {!isSectorCollapsed && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {sector.parishesWithData.map((parish) => {
                  const pTarget = parish.metrics.parish || parish.dbNames[0] || parish.name;
                  const hasHistory = parish.metrics.encounter_count > 0;
                  return (
                    <div
                      key={parish.name}
                      style={{
                        background: hasHistory ? '#ffffff' : 'var(--bg-canvas)',
                        border: '1px solid var(--border-base)',
                        borderRadius: 'var(--radius-md)',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div>
                        {/* Nome e Cidade */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                          <div>
                            <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', margin: 0, lineHeight: 1.25 }}>
                              {parish.name}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={13} color="var(--brand-primary)" />
                              {parish.city}
                            </span>
                          </div>

                          {parish.status ? (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: parish.status === 'IMPLANTAÇÃO' ? '#eff6ff' : '#fef2f2',
                                color: parish.status === 'IMPLANTAÇÃO' ? '#1d4ed8' : '#b91c1c',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {parish.status}
                            </span>
                          ) : hasHistory ? (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: '#f0fdf4',
                                color: '#15803d',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <CheckCircle size={12} weight="fill" /> Ativa
                            </span>
                          ) : null}
                        </div>

                        {/* Números da Paróquia */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            background: 'var(--bg-canvas)',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            marginTop: '10px',
                          }}
                        >
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Pessoas
                            </span>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--brand-primary)' }}>
                              {number(parish.metrics.people_count)}
                            </strong>
                          </div>

                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Encontros
                            </span>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                              {parish.metrics.encounter_count}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                        <Link
                          href={`/pessoas?parish=${encodeURIComponent(pTarget)}`}
                          className="button button-secondary"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'center' }}
                        >
                          <UsersThree size={14} /> Pessoas
                        </Link>

                        <Link
                          href={`/encontros?parish=${encodeURIComponent(pTarget)}`}
                          className="button button-secondary"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'center' }}
                        >
                          <CalendarBlank size={14} /> Encontros
                        </Link>

                        <Link
                          href={`/?parish=${encodeURIComponent(pTarget)}`}
                          className="button button-primary"
                          style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                          title="Abrir no Dashboard"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })
        )}
      </div>
    </div>
  );
}
