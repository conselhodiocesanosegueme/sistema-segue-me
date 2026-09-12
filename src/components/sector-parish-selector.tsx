"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Church,
  MapPin,
  MagnifyingGlass,
  CheckCircle,
  CaretDown,
  CaretUp,
  Globe,
  Sparkle,
  ArrowRight,
  Info
} from '@phosphor-icons/react';
import { DIOCESAN_SECTORS, type Sector, type SectorParish } from '@/lib/sectors';

interface SectorParishSelectorProps {
  selectedParish?: string | null;
  allDbParishes?: string[];
  isParochial?: boolean;
}

export function SectorParishSelector({
  selectedParish,
  allDbParishes = [],
  isParochial = false,
}: SectorParishSelectorProps) {
  // Encontrar setor inicial com base na paróquia selecionada
  const initialSectorId = useMemo(() => {
    if (!selectedParish) return 'setor-1';
    for (const s of DIOCESAN_SECTORS) {
      if (s.parishes.some(p => p.dbNames.some(db => db.toLowerCase() === selectedParish.toLowerCase()))) {
        return s.id;
      }
    }
    return 'setor-1';
  }, [selectedParish]);

  const [activeSectorId, setActiveSectorId] = useState<string>(initialSectorId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(!selectedParish); // Se já tiver paróquia selecionada, começa compacto

  const activeSector = useMemo(() => {
    return DIOCESAN_SECTORS.find(s => s.id === activeSectorId) || DIOCESAN_SECTORS[0];
  }, [activeSectorId]);

  // Lista de resultados pela busca rápida
  const filteredParishes = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const matches: { parish: SectorParish; sector: Sector }[] = [];
    for (const sector of DIOCESAN_SECTORS) {
      for (const parish of sector.parishes) {
        if (
          parish.name.toLowerCase().includes(q) ||
          parish.city.toLowerCase().includes(q) ||
          parish.dbNames.some(db => db.toLowerCase().includes(q))
        ) {
          matches.push({ parish, sector });
        }
      }
    }
    return matches;
  }, [searchQuery]);

  // Mapear paróquias do banco para saber se possuem encontros documentados
  const dbParishesSet = useMemo(() => {
    return new Set(allDbParishes.map(p => p.toLowerCase()));
  }, [allDbParishes]);

  function isParishActive(parish: SectorParish): boolean {
    if (!selectedParish) return false;
    return parish.dbNames.some(db => db.toLowerCase() === selectedParish.toLowerCase());
  }

  function getParishDbName(parish: SectorParish): string {
    // Retorna a correspondência no banco ou a primeira variação
    for (const db of parish.dbNames) {
      if (dbParishesSet.has(db.toLowerCase())) return db;
    }
    return parish.dbNames[0] || `Paróquia ${parish.name}`;
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-base)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Cabeçalho do Seletor */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: isExpanded ? '18px' : 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="eyebrow" style={{ margin: 0, color: 'var(--brand-primary)' }}>
              DIVISÃO OFICIAL DIOCESANA
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                background: 'var(--brand-light)',
                color: 'var(--brand-text)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              6 Setores · Edital 2026
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', margin: 0 }}>
            {selectedParish ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Church size={20} color="var(--brand-primary)" />
                Visualizando: <strong style={{ color: 'var(--brand-primary)' }}>{selectedParish}</strong>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={20} color="var(--brand-primary)" />
                Visão Geral: Toda a Diocese de Anápolis
              </span>
            )}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedParish && (
            <Link
              href="/"
              className="button button-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <Globe size={16} /> Ver Toda a Diocese
            </Link>
          )}

          <button
            type="button"
            className="button button-secondary"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            {isExpanded ? (
              <>Recolher Setores <CaretUp size={15} /></>
            ) : (
              <>Filtrar por Setor ou Paróquia <CaretDown size={15} /></>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          {/* Barra de Busca Rápida de Paróquia */}
          <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '420px' }}>
            <MagnifyingGlass
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome de qualquer paróquia ou cidade..."
              className="filter-input"
              style={{ width: '100%', paddingLeft: '36px', fontSize: '0.84rem' }}
            />
          </div>

          {/* Se houver busca ativa, exibe resultados */}
          {filteredParishes ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                {filteredParishes.length} {filteredParishes.length === 1 ? 'paróquia encontrada' : 'paróquias encontradas'}:
              </div>
              {filteredParishes.length === 0 ? (
                <div style={{ padding: '14px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  Nenhuma paróquia correspondente ao termo pesquisado.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                  {filteredParishes.map(({ parish, sector }) => {
                    const dbTarget = getParishDbName(parish);
                    const isActive = isParishActive(parish);
                    return (
                      <Link
                        key={`${sector.id}-${parish.name}`}
                        href={`/?parish=${encodeURIComponent(dbTarget)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: isActive ? 'var(--brand-light)' : '#ffffff',
                          border: isActive ? '2px solid var(--brand-primary)' : '1px solid var(--border-base)',
                          textDecoration: 'none',
                          color: 'var(--text-main)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {sector.name}
                          </div>
                          <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-main)' }}>
                            {parish.name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {parish.city}
                          </span>
                        </div>
                        <ArrowRight size={16} color="var(--brand-primary)" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Navegação por Abas dos 6 Setores */
            <div>
              {/* Abas dos Setores */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <Link
                  href="/"
                  className={`tab-btn ${!selectedParish ? 'tab-btn-active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-base)',
                    background: !selectedParish ? 'var(--brand-primary)' : '#fff',
                    color: !selectedParish ? '#fff' : 'var(--text-main)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Globe size={16} /> Toda a Diocese
                </Link>

                {DIOCESAN_SECTORS.map((sector) => {
                  const isCurrentTab = sector.id === activeSectorId;
                  const hasSelectedParish = sector.parishes.some(p => isParishActive(p));
                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => setActiveSectorId(sector.id)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                        border: isCurrentTab
                          ? '2px solid var(--brand-primary)'
                          : '1px solid var(--border-base)',
                        background: isCurrentTab ? 'var(--brand-light)' : '#ffffff',
                        color: isCurrentTab ? 'var(--brand-text)' : 'var(--text-main)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{sector.name}</span>
                      {hasSelectedParish && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Informações e Paróquias do Setor Selecionado */}
              <div
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {activeSector.name} · {activeSector.region}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {activeSector.description} · {activeSector.parishes.length} paróquias catalogadas
                    </p>
                  </div>
                </div>

                {/* Grid das Paróquias do Setor */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {activeSector.parishes.map((parish) => {
                    const dbTarget = getParishDbName(parish);
                    const isActive = isParishActive(parish);
                    return (
                      <Link
                        key={parish.name}
                        href={`/?parish=${encodeURIComponent(dbTarget)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: isActive ? 'var(--brand-light)' : '#ffffff',
                          border: isActive ? '2px solid var(--brand-primary)' : '1px solid var(--border-base)',
                          boxShadow: isActive ? '0 2px 8px rgba(180, 83, 9, 0.15)' : 'none',
                          textDecoration: 'none',
                          color: 'var(--text-main)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.9rem', display: 'block', color: isActive ? 'var(--brand-primary)' : 'var(--text-main)' }}>
                            {parish.name}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <MapPin size={12} /> {parish.city}
                          </span>
                          {parish.status && (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: parish.status === 'IMPLANTAÇÃO' ? '#eff6ff' : '#fef2f2',
                                color: parish.status === 'IMPLANTAÇÃO' ? '#1d4ed8' : '#b91c1c',
                                fontWeight: 700,
                                marginTop: '4px',
                              }}
                            >
                              {parish.status}
                            </span>
                          )}
                        </div>

                        {isActive ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                            <CheckCircle size={18} weight="fill" /> Ativa
                          </span>
                        ) : (
                          <ArrowRight size={16} color="var(--text-subtle)" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
