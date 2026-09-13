"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Church,
  CalendarBlank,
  UsersThree,
  MapPin,
  MagnifyingGlass,
  Funnel,
  CaretDown,
  CaretUp,
  ArrowRight,
  Sparkle,
  BookmarkSimple,
  Buildings,
  CheckCircle,
  Tag
} from '@phosphor-icons/react';
import type { Encounter, Viewer } from '@/lib/types';
import { DIOCESAN_SECTORS, getSectorForParish, matchEncounterToParish, type Sector, type SectorParish } from '@/lib/sectors';
import { number } from '@/lib/format';

interface EncountersHierarchyViewProps {
  encounters: Encounter[];
  viewer: Viewer;
  headerActions?: React.ReactNode;
}

export function EncountersHierarchyView({ encounters, viewer, headerActions }: EncountersHierarchyViewProps) {
  const isParochial = viewer.role === 'reviewer' && Boolean(viewer.parish);
  const parochialParishName = viewer.parish || '';

  // Determina setor inicial caso o usuário seja revisor paroquial
  const initialSectorId = useMemo(() => {
    if (isParochial) {
      const s = getSectorForParish(parochialParishName);
      if (s) return s.id;
    }
    return 'all';
  }, [isParochial, parochialParishName]);

  const [activeSectorId, setActiveSectorId] = useState<string>(initialSectorId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<'all' | '1ª Etapa' | '2ª Etapa'>('all');

  // Controle de paróquias expandidas
  const [expandedParishes, setExpandedParishes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (isParochial && parochialParishName) {
      initial[parochialParishName.toLowerCase().trim()] = true;
    }
    return initial;
  });

  const toggleParish = (parishKey: string) => {
    setExpandedParishes((prev) => ({
      ...prev,
      [parishKey]: !prev[parishKey],
    }));
  };

  const expandAll = (parishKeys: string[]) => {
    const updated = { ...expandedParishes };
    for (const k of parishKeys) updated[k] = true;
    setExpandedParishes(updated);
  };

  const collapseAll = (parishKeys: string[]) => {
    const updated = { ...expandedParishes };
    for (const k of parishKeys) updated[k] = false;
    setExpandedParishes(updated);
  };

  // Mapeamento dos encontros por paróquia e setor
  // Cada paróquia oficial de DIOCESAN_SECTORS agrega os encontros do banco correspondentes
  const sectorsWithData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return DIOCESAN_SECTORS.map((sector) => {
      let sectorTotalEncounters = 0;

      const parishesData = sector.parishes.map((parish) => {
        // Encontra os encontros correspondentes a esta paróquia com validação estrita de cidade e orago
        const matchedEncounters = encounters.filter((e) => matchEncounterToParish(e, parish));

        // Aplica filtro de tipo/etapa
        let filteredEncounters = matchedEncounters;
        if (stageFilter !== 'all') {
          filteredEncounters = filteredEncounters.filter((e) => (e.type || '1ª Etapa') === stageFilter);
        }

        // Ordena sempre do mais recente para o mais antigo (2026 -> 2011)
        filteredEncounters.sort((a, b) => {
          const yA = a.year || 0;
          const yB = b.year || 0;
          if (yB !== yA) return yB - yA;
          const edA = typeof a.edition === 'number' ? a.edition : Number(a.edition || 0);
          const edB = typeof b.edition === 'number' ? b.edition : Number(b.edition || 0);
          return edB - edA;
        });

        sectorTotalEncounters += filteredEncounters.length;

        // Anos de atuação
        const years = Array.from(new Set(filteredEncounters.map((e) => e.year).filter(Boolean))).sort(
          (a, b) => (b as number) - (a as number)
        ) as number[];

        const yearsRange =
          years.length > 0
            ? years.length === 1
              ? `Ano ${years[0]}`
              : `${years[0]} a ${years[years.length - 1]}`
            : 'Sem encontros documentados';

        // Verificação de busca por texto (cidade, paróquia, edição, ano)
        let matchesSearch = true;
        if (query) {
          const matchesParish = parish.name.toLowerCase().includes(query);
          const matchesCity = parish.city.toLowerCase().includes(query);
          const matchesDb = parish.dbNames.some((d) => d.toLowerCase().includes(query));
          const matchesInEncounters = filteredEncounters.some((e) => {
            const nameMatch = (e.name || '').toLowerCase().includes(query);
            const editionMatch = String(e.edition || '').toLowerCase().includes(query);
            const yearMatch = String(e.year || '').includes(query);
            const cityMatch = (e.city || '').toLowerCase().includes(query);
            return nameMatch || editionMatch || yearMatch || cityMatch;
          });

          matchesSearch = matchesParish || matchesCity || matchesDb || matchesInEncounters;
        }

        return {
          ...parish,
          encounters: filteredEncounters,
          totalEncounters: filteredEncounters.length,
          yearsRange,
          matchesSearch,
        };
      });

      // Filtra paróquias caso haja busca ativa
      const visibleParishes = query ? parishesData.filter((p) => p.matchesSearch) : parishesData;

      return {
        ...sector,
        parishes: visibleParishes,
        totalEncounters: sectorTotalEncounters,
      };
    });
  }, [encounters, searchQuery, stageFilter]);

  // Encontros diocesanos gerais (sem paróquia específica ou nível diocesano)
  const diocesanGeneralEncounters = useMemo(() => {
    const general = encounters.filter((e) => {
      const isGeneral =
        !e.parish ||
        e.level === 'Diocesano' ||
        e.name?.toLowerCase().includes('congresso') ||
        e.name?.toLowerCase().includes('retiro mariano') ||
        e.name?.toLowerCase().includes('diocesano');

      if (!isGeneral) return false;
      if (stageFilter !== 'all' && (e.type || '1ª Etapa') !== stageFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nMatch = (e.name || '').toLowerCase().includes(q);
        const cMatch = (e.city || '').toLowerCase().includes(q);
        const yMatch = String(e.year || '').includes(q);
        return nMatch || cMatch || yMatch;
      }
      return true;
    });

    return general.sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [encounters, searchQuery, stageFilter]);

  // Setores a exibir com base na aba selecionada
  const activeSectors = useMemo(() => {
    if (activeSectorId === 'all') return sectorsWithData;
    if (activeSectorId === 'diocesano') return [];
    return sectorsWithData.filter((s) => s.id === activeSectorId);
  }, [sectorsWithData, activeSectorId]);

  // Total geral de paróquias com encontros
  const totalParishesWithEncounters = useMemo(() => {
    let count = 0;
    for (const s of sectorsWithData) {
      for (const p of s.parishes) {
        if (p.totalEncounters > 0) count++;
      }
    }
    return count;
  }, [sectorsWithData]);

  return (
    <div>
      {/* Barra Superior: Busca Global (com Cidade) e Filtros */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* Campo de Busca Global */}
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cidade (ex: Jaraguá, Pirenópolis, Nerópolis, Anápolis...), paróquia ou edição..."
              className="filter-input"
              style={{
                width: '100%',
                fontSize: '0.86rem',
                paddingLeft: '36px',
                paddingRight: '12px',
                height: '42px',
                borderRadius: '8px',
              }}
            />
            <MagnifyingGlass
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--brand-primary)',
              }}
            />
          </div>

          {/* Filtro de Etapa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Etapa:
            </span>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-canvas)', padding: '3px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setStageFilter('all')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  background: stageFilter === 'all' ? '#ffffff' : 'transparent',
                  color: stageFilter === 'all' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  boxShadow: stageFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setStageFilter('1ª Etapa')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  background: stageFilter === '1ª Etapa' ? '#ffffff' : 'transparent',
                  color: stageFilter === '1ª Etapa' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  boxShadow: stageFilter === '1ª Etapa' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                1ª Etapa
              </button>
              <button
                type="button"
                onClick={() => setStageFilter('2ª Etapa')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  background: stageFilter === '2ª Etapa' ? '#ffffff' : 'transparent',
                  color: stageFilter === '2ª Etapa' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  boxShadow: stageFilter === '2ª Etapa' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                2ª Etapa
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Rápido e Botões de Expandir/Recolher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>
              Total: <strong style={{ color: 'var(--text-main)' }}>{encounters.length} encontros</strong>
            </span>
            <span>&bull;</span>
            <span>
              Paróquias com encontros: <strong style={{ color: 'var(--brand-primary)' }}>{totalParishesWithEncounters}</strong> de 44
            </span>
            <span>&bull;</span>
            <span>
              Setores: <strong style={{ color: 'var(--text-main)' }}>6 oficiais</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const keys = sectorsWithData.flatMap((s) => s.parishes.map((p) => p.name.toLowerCase().trim()));
                expandAll(keys);
              }}
              style={{
                fontSize: '0.74rem',
                color: 'var(--brand-primary)',
                background: 'transparent',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              Expandir todas as paróquias
            </button>
            <span style={{ color: 'var(--border-base)' }}>|</span>
            <button
              type="button"
              onClick={() => {
                const keys = sectorsWithData.flatMap((s) => s.parishes.map((p) => p.name.toLowerCase().trim()));
                collapseAll(keys);
              }}
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              Recolher todas
            </button>
          </div>
        </div>
      </div>

      {/* Abas de Setores Diocesanos */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '22px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSectorId('all')}
          style={{
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            borderRadius: '999px',
            border: activeSectorId === 'all' ? '1px solid var(--brand-primary)' : '1px solid var(--border-base)',
            background: activeSectorId === 'all' ? 'var(--brand-primary)' : '#ffffff',
            color: activeSectorId === 'all' ? '#ffffff' : 'var(--text-main)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Todos os Setores</span>
          <span
            style={{
              fontSize: '0.70rem',
              background: activeSectorId === 'all' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              padding: '1px 7px',
              borderRadius: '999px',
            }}
          >
            {encounters.length}
          </span>
        </button>

        {sectorsWithData.map((sector) => {
          const isActive = activeSectorId === sector.id;
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => setActiveSectorId(sector.id)}
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '999px',
                border: isActive ? '1px solid var(--brand-primary)' : '1px solid var(--border-base)',
                background: isActive ? 'var(--brand-primary)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{sector.name}</span>
              <span
                style={{
                  fontSize: '0.70rem',
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  padding: '1px 7px',
                  borderRadius: '999px',
                }}
              >
                {sector.totalEncounters}
              </span>
            </button>
          );
        })}

        {diocesanGeneralEncounters.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveSectorId('diocesano')}
            style={{
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: '999px',
              border: activeSectorId === 'diocesano' ? '1px solid #7c3aed' : '1px solid var(--border-base)',
              background: activeSectorId === 'diocesano' ? '#7c3aed' : '#ffffff',
              color: activeSectorId === 'diocesano' ? '#ffffff' : 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkle size={14} />
            <span>Âmbito Diocesano</span>
            <span
              style={{
                fontSize: '0.70rem',
                background: activeSectorId === 'diocesano' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                padding: '1px 7px',
                borderRadius: '999px',
              }}
            >
              {diocesanGeneralEncounters.length}
            </span>
          </button>
        )}
      </div>

      {/* Conteúdo: Blocos de Setores e Paróquias */}
      {activeSectorId === 'diocesano' ? (
        // Seção de Encontros Diocesanos Gerais
        <div className="panel" style={{ background: '#ffffff', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ marginBottom: '18px' }}>
            <span className="section-kicker">COORDENAÇÃO DIOCESANA</span>
            <h3 style={{ margin: '4px 0', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
              Encontros e Eventos de Âmbito Diocesano
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Congressos Eucarísticos, Retiros Marianos e eventos gerais organizados para toda a Diocese de Anápolis.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {diocesanGeneralEncounters.map((enc) => (
              <EncounterCard key={enc.id} encounter={enc} />
            ))}
          </div>
        </div>
      ) : (
        // Lista de Setores Ativos
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          {activeSectors.map((sector) => {
            return (
              <div
                key={sector.id}
                className="panel"
                style={{
                  background: '#ffffff',
                  padding: '22px 24px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Cabeçalho do Setor */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'var(--brand-light)',
                          color: 'var(--brand-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                        }}
                      >
                        {sector.roman}
                      </span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.22rem',
                          color: 'var(--text-main)',
                          fontFamily: 'var(--font-serif)',
                          fontWeight: 700,
                        }}
                      >
                        {sector.name} &bull; {sector.region}
                      </h3>
                    </div>
                    <p style={{ margin: '4px 0 0 36px', fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                      {sector.description}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--brand-primary)',
                      background: 'var(--brand-light)',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: '1px solid var(--brand-border)',
                    }}
                  >
                    {sector.totalEncounters} {sector.totalEncounters === 1 ? 'encontro' : 'encontros'}
                  </span>
                </div>

                {/* Paróquias do Setor */}
                {sector.parishes.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.84rem' }}>
                    Nenhuma paróquia correspondente à busca neste setor.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sector.parishes.map((parish) => {
                      const parishKey = parish.name.toLowerCase().trim();
                      const isExpanded = Boolean(expandedParishes[parishKey]);
                      const hasEncounters = parish.totalEncounters > 0;

                      return (
                        <div
                          key={parish.name}
                          style={{
                            border: isExpanded ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            transition: 'all 0.18s ease-in-out',
                            background: isExpanded ? '#fafaf9' : '#ffffff',
                          }}
                        >
                          {/* Cabeçalho da Paróquia (Card Clicável) */}
                          <div
                            onClick={() => toggleParish(parishKey)}
                            style={{
                              padding: '14px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              cursor: 'pointer',
                              background: isExpanded ? 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)' : '#ffffff',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: hasEncounters ? '#eff6ff' : '#f8fafc',
                                  color: hasEncounters ? '#1d4ed8' : 'var(--text-subtle)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  border: hasEncounters ? '1px solid #bfdbfe' : '1px solid var(--border-light)',
                                }}
                              >
                                <Church size={18} weight={hasEncounters ? 'fill' : 'regular'} />
                              </span>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong
                                    style={{
                                      fontSize: '0.98rem',
                                      color: 'var(--text-main)',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Paróquia {parish.name}
                                  </strong>

                                  {/* Cidade com Ícone MapPin em Destaque */}
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.76rem',
                                      color: '#166534',
                                      background: '#f0fdf4',
                                      border: '1px solid #bbf7d0',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontWeight: 600,
                                    }}
                                    title="Cidade da paróquia"
                                  >
                                    <MapPin size={12} weight="fill" color="#16a34a" />
                                    {parish.city}
                                  </span>

                                  {parish.status && (
                                    <span
                                      style={{
                                        fontSize: '0.66rem',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                      }}
                                    >
                                      {parish.status}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  <span>{parish.yearsRange}</span>
                                </div>
                              </div>
                            </div>

                            {/* Lado Direito: Quantidade e Botão de Expandir */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: hasEncounters ? 'var(--brand-primary)' : 'var(--text-subtle)',
                                  background: hasEncounters ? '#fef3c7' : '#f1f5f9',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {parish.totalEncounters} {parish.totalEncounters === 1 ? 'encontro' : 'encontros'}
                              </span>

                              <button
                                type="button"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                              >
                                {isExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
                              </button>
                            </div>
                          </div>

                          {/* Lista de Encontros (Expandido) */}
                          {isExpanded && (
                            <div
                              style={{
                                padding: '14px 18px 18px 18px',
                                borderTop: '1px solid var(--border-light)',
                                background: '#fcfbf9',
                              }}
                            >
                              {parish.encounters.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.80rem' }}>
                                  Nenhum encontro registrado para esta paróquia com os filtros selecionados.
                                </div>
                              ) : (
                                <div>
                                  <span
                                    style={{
                                      display: 'block',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      color: 'var(--text-subtle)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                      marginBottom: '10px',
                                    }}
                                  >
                                    Encontros Realizados (Ordenados do Mais Recente para o Mais Antigo):
                                  </span>

                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                                      gap: '12px',
                                    }}
                                  >
                                    {parish.encounters.map((enc) => (
                                      <EncounterCard key={enc.id} encounter={enc} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Componente de Cartão Individual do Encontro
function EncounterCard({ encounter }: { encounter: Encounter }) {
  const encType = encounter.type || '1ª Etapa';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-base)',
        borderLeft: '4px solid var(--brand-primary)',
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = 'var(--brand-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
        e.currentTarget.style.borderColor = 'var(--border-base)';
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.70rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              background: encType === '1ª Etapa' ? '#fef3c7' : '#eff6ff',
              color: encType === '1ª Etapa' ? '#92400e' : '#1e40af',
              border: encType === '1ª Etapa' ? '1px solid #fde68a' : '1px solid #bfdbfe',
            }}
          >
            {encType}
          </span>

          <span
            style={{
              fontSize: '0.80rem',
              fontWeight: 700,
              color: 'var(--brand-primary)',
            }}
          >
            {encounter.year || 'Ano N/I'}
          </span>
        </div>

        <Link
          href={`/encontros/${encounter.id}`}
          style={{
            textDecoration: 'none',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.94rem',
            display: 'block',
            lineHeight: 1.3,
            marginBottom: '6px',
          }}
        >
          {encounter.name}
        </Link>

        {encounter.date_text && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <CalendarBlank size={13} color="var(--brand-primary)" />
            <span>{encounter.date_text}</span>
          </div>
        )}

        {encounter.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <MapPin size={13} color="#16a34a" />
            <span>{encounter.city}</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '8px',
          marginTop: '8px',
        }}
      >
        <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <UsersThree size={14} />
          {encounter.participation_count ? `${encounter.participation_count} no quadrante` : 'Quadrante oficial'}
        </span>

        <Link
          href={`/encontros/${encounter.id}`}
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: 'var(--brand-primary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          Ver Quadrante
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
