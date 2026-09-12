"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  UsersThree,
  HandHeart,
  IdentificationCard,
  User,
  Sparkle,
  Eye,
  ArrowsIn,
  ArrowsOut,
  Tag,
} from '@phosphor-icons/react';
import type { Participation } from '@/lib/types';
import { number } from '@/lib/format';
import { isMandateRecord, getConditionMeta } from '@/lib/encounter-config';
export { getConditionMeta };

interface EncounterDetailViewProps {
  vivenciantes: Participation[];
  trabalhadores: Participation[];
  liderancaMandato?: Participation[];
}

export function EncounterDetailView({
  vivenciantes,
  trabalhadores,
  liderancaMandato: explicitLideranca,
}: EncounterDetailViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'vivenciantes' | 'equipes' | 'mandatos'>('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'Jovem' | 'Casal'>('all');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Separação de trabalhadores em equipes operacionais de serviço e liderança institucional de mandato
  const lideranca = useMemo(() => {
    return explicitLideranca || trabalhadores.filter((p) => isMandateRecord(p));
  }, [explicitLideranca, trabalhadores]);

  const equipesReais = useMemo(() => {
    return explicitLideranca ? trabalhadores : trabalhadores.filter((p) => !isMandateRecord(p));
  }, [explicitLideranca, trabalhadores]);

  // Agrupamentos
  const circulosMap = useMemo(() => {
    const map = new Map<string, Participation[]>();
    for (const p of vivenciantes) {
      const circle = p.circle || 'Sem Círculo Definido';
      if (!map.has(circle)) map.set(circle, []);
      map.get(circle)!.push(p);
    }
    return map;
  }, [vivenciantes]);

  const equipesMap = useMemo(() => {
    const map = new Map<string, Participation[]>();
    for (const p of equipesReais) {
      const equipe = p.team || 'Geral';
      if (!map.has(equipe)) map.set(equipe, []);
      map.get(equipe)!.push(p);
    }
    return map;
  }, [equipesReais]);

  const liderancaMap = useMemo(() => {
    const map = new Map<string, Participation[]>();
    for (const p of lideranca) {
      const isConselho = (p.team || '').toLowerCase().includes('conselho') || (p.role || '').toLowerCase().includes('conselho');
      const orgao = isConselho ? 'Conselho Diocesano' : (p.team || 'Equipe Dirigente');
      if (!map.has(orgao)) map.set(orgao, []);
      map.get(orgao)!.push(p);
    }
    return map;
  }, [lideranca]);

  // Lista de todas as chaves de círculos, equipes e liderança
  const allCircleNames = useMemo(() => Array.from(circulosMap.keys()).sort(), [circulosMap]);
  const allTeamNames = useMemo(() => Array.from(equipesMap.keys()).sort(), [equipesMap]);
  const allLiderancaNames = useMemo(() => Array.from(liderancaMap.keys()).sort(), [liderancaMap]);

  // Contagem de Jovens e Casais
  const totalCasais = useMemo(() => {
    return [...vivenciantes, ...equipesReais, ...lideranca].filter((p) => getConditionMeta(p.condition, p.role).isCasal).length;
  }, [vivenciantes, equipesReais, lideranca]);

  const totalJovens = useMemo(() => {
    return [...vivenciantes, ...equipesReais, ...lideranca].filter((p) => !getConditionMeta(p.condition, p.role).isCasal).length;
  }, [vivenciantes, equipesReais, lideranca]);

  // Estado de itens expandidos (inicia com todos os primeiros ou todos)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (allCircleNames.length > 0) initial.add(`circulo-${allCircleNames[0]}`);
    if (allTeamNames.length > 0) initial.add(`equipe-${allTeamNames[0]}`);
    if (allLiderancaNames.length > 0) initial.add(`lideranca-${allLiderancaNames[0]}`);
    return initial;
  });

  function toggleItem(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll() {
    const all = new Set<string>();
    allCircleNames.forEach((c) => all.add(`circulo-${c}`));
    allTeamNames.forEach((t) => all.add(`equipe-${t}`));
    allLiderancaNames.forEach((l) => all.add(`lideranca-${l}`));
    setExpandedItems(all);
  }

  function collapseAll() {
    setExpandedItems(new Set());
  }

  // Normalizador de busca
  const term = searchTerm.trim().toLowerCase();

  // Filtragem de círculos
  const filteredCirculos = useMemo(() => {
    const result: Array<[string, Participation[]]> = [];
    for (const [name, members] of circulosMap.entries()) {
      if (selectedFilter !== 'all' && selectedFilter !== `circulo-${name}`) continue;

      let filteredMembers = members;
      if (conditionFilter !== 'all') {
        filteredMembers = filteredMembers.filter((m) => {
          const meta = getConditionMeta(m.condition, m.role);
          return conditionFilter === 'Casal' ? meta.isCasal : !meta.isCasal;
        });
      }

      if (term) {
        filteredMembers = filteredMembers.filter(
          (m) =>
            (m.person?.name || '').toLowerCase().includes(term) ||
            (m.person?.legacy_id || '').toLowerCase().includes(term) ||
            (m.patron || '').toLowerCase().includes(term)
        );
      }

      if (filteredMembers.length > 0 || (term && name.toLowerCase().includes(term))) {
        result.push([name, filteredMembers]);
      }
    }
    return result;
  }, [circulosMap, term, selectedFilter, conditionFilter]);

  // Filtragem de equipes
  const filteredEquipes = useMemo(() => {
    const result: Array<[string, Participation[]]> = [];
    for (const [name, members] of equipesMap.entries()) {
      if (selectedFilter !== 'all' && selectedFilter !== `equipe-${name}`) continue;

      let filteredMembers = members;
      if (conditionFilter !== 'all') {
        filteredMembers = filteredMembers.filter((m) => {
          const meta = getConditionMeta(m.condition, m.role);
          return conditionFilter === 'Casal' ? meta.isCasal : !meta.isCasal;
        });
      }

      if (term) {
        filteredMembers = filteredMembers.filter(
          (m) =>
            (m.person?.name || '').toLowerCase().includes(term) ||
            (m.person?.legacy_id || '').toLowerCase().includes(term) ||
            (m.role || '').toLowerCase().includes(term) ||
            (m.condition || '').toLowerCase().includes(term)
        );
      }

      if (filteredMembers.length > 0 || (term && name.toLowerCase().includes(term))) {
        result.push([name, filteredMembers]);
      }
    }
    return result;
  }, [equipesMap, term, selectedFilter, conditionFilter]);

  // Filtragem de liderança institucional / mandatos vigentes
  const filteredLideranca = useMemo(() => {
    const result: Array<[string, Participation[]]> = [];
    for (const [name, members] of liderancaMap.entries()) {
      if (selectedFilter !== 'all' && selectedFilter !== `lideranca-${name}`) continue;

      let filteredMembers = members;
      if (conditionFilter !== 'all') {
        filteredMembers = filteredMembers.filter((m) => {
          const meta = getConditionMeta(m.condition, m.role);
          return conditionFilter === 'Casal' ? meta.isCasal : !meta.isCasal;
        });
      }

      if (term) {
        filteredMembers = filteredMembers.filter(
          (m) =>
            (m.person?.name || '').toLowerCase().includes(term) ||
            (m.person?.legacy_id || '').toLowerCase().includes(term) ||
            (m.role || '').toLowerCase().includes(term) ||
            (m.condition || '').toLowerCase().includes(term)
        );
      }

      if (filteredMembers.length > 0 || (term && name.toLowerCase().includes(term))) {
        result.push([name, filteredMembers]);
      }
    }
    return result;
  }, [liderancaMap, term, selectedFilter, conditionFilter]);

  // Se o usuário estiver pesquisando algo, auto-expande os itens correspondentes
  const effectiveExpanded = useMemo(() => {
    if (term || conditionFilter !== 'all') {
      const set = new Set(expandedItems);
      filteredCirculos.forEach(([name]) => set.add(`circulo-${name}`));
      filteredEquipes.forEach(([name]) => set.add(`equipe-${name}`));
      filteredLideranca.forEach(([name]) => set.add(`lideranca-${name}`));
      return set;
    }
    return expandedItems;
  }, [term, conditionFilter, expandedItems, filteredCirculos, filteredEquipes, filteredLideranca]);

  const totalGeral = vivenciantes.length + equipesReais.length + lideranca.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra de Controle e Filtros de Experiência do Usuário */}
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Abas Rápidas por Tipo de Atuação */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSelectedFilter('all');
              }}
              className={`button ${activeTab === 'all' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              Todos ({number(totalGeral)})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('vivenciantes');
                setSelectedFilter('all');
              }}
              className={`button ${activeTab === 'vivenciantes' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              Círculos ({number(vivenciantes.length)})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('equipes');
                setSelectedFilter('all');
              }}
              className={`button ${activeTab === 'equipes' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              Equipes de Trabalho ({number(equipesReais.length)})
            </button>
            {lideranca.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mandatos');
                  setSelectedFilter('all');
                }}
                className={`button ${activeTab === 'mandatos' ? 'button-primary' : 'button-secondary'}`}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: activeTab === 'mandatos' ? '#92400e' : undefined,
                  borderColor: activeTab === 'mandatos' ? '#92400e' : undefined,
                  color: activeTab === 'mandatos' ? '#fff' : undefined,
                }}
              >
                <span>🏛️</span>
                Mandatos Vigentes ({number(lideranca.length)})
              </button>
            )}
          </div>

          {/* Botões de Expandir/Recolher Todos */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={expandAll}
              className="button button-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Expandir todas as equipes, círculos e mandatos"
            >
              <ArrowsOut size={14} />
              Expandir Todos
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="button button-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Recolher todas as equipes, círculos e mandatos"
            >
              <ArrowsIn size={14} />
              Recolher Todos
            </button>
          </div>
        </div>

        {/* Linha 2: Filtro por Condição (Jovem / Casal) com Badges Visuais Destacadas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Filtrar por Condição:
          </span>
          <button
            type="button"
            onClick={() => setConditionFilter('all')}
            className={`button ${conditionFilter === 'all' ? 'button-primary' : 'button-secondary'}`}
            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
          >
            Todos ({number(totalGeral)})
          </button>
          <button
            type="button"
            onClick={() => setConditionFilter('Jovem')}
            style={{
              padding: '4px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-md)',
              border: conditionFilter === 'Jovem' ? '2px solid #1d4ed8' : '1px solid #bfdbfe',
              background: conditionFilter === 'Jovem' ? '#1d4ed8' : '#eff6ff',
              color: conditionFilter === 'Jovem' ? '#fff' : '#1d4ed8',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'var(--transition)',
            }}
          >
            ⚡ Apenas Jovens ({number(totalJovens)})
          </button>
          <button
            type="button"
            onClick={() => setConditionFilter('Casal')}
            style={{
              padding: '4px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-md)',
              border: conditionFilter === 'Casal' ? '2px solid #b45309' : '1px solid #fde68a',
              background: conditionFilter === 'Casal' ? '#b45309' : '#fef3c7',
              color: conditionFilter === 'Casal' ? '#fff' : '#92400e',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'var(--transition)',
            }}
          >
            💍 Apenas Casais ({number(totalCasais)})
          </button>
        </div>

        {/* Linha 3: Busca e Menu Suspenso de Seleção Direta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <MagnifyingGlass
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome da pessoa, padrinho ou função…"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          {/* Menu Suspenso de Seleção de Círculo ou Equipe Específica */}
          <div style={{ minWidth: '220px' }}>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="filter-input"
              style={{ width: '100%' }}
            >
              <option value="all">Ver tudo (Todos os Menus)</option>
              {allCircleNames.length > 0 && (
                <optgroup label="Círculos de Vivência">
                  {allCircleNames.map((c) => (
                    <option key={`circulo-${c}`} value={`circulo-${c}`}>
                      Círculo {c} ({circulosMap.get(c)?.length} jovens)
                    </option>
                  ))}
                </optgroup>
              )}
              {allTeamNames.length > 0 && (
                <optgroup label="Equipes de Trabalho">
                  {allTeamNames.map((t) => (
                    <option key={`equipe-${t}`} value={`equipe-${t}`}>
                      {t} ({equipesMap.get(t)?.length} membros)
                    </option>
                  ))}
                </optgroup>
              )}
              {allLiderancaNames.length > 0 && (
                <optgroup label="Mandatos Vigentes (Conselho / Dirigente)">
                  {allLiderancaNames.map((l) => (
                    <option key={`lideranca-${l}`} value={`lideranca-${l}`}>
                      {l} ({liderancaMap.get(l)?.length} membros)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: CÍRCULOS DE VIVÊNCIA */}
      {(activeTab === 'all' || activeTab === 'vivenciantes') && (
        <section className="panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              background: 'linear-gradient(to right, #fffbf0, #fff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IdentificationCard size={22} color="var(--brand-primary)" weight="duotone" />
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--brand-primary)', fontFamily: 'var(--font-serif)' }}>
                  Círculos de Vivência ({number(vivenciantes.length)} vivenciantes)
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {filteredCirculos.length} círculos documentados neste encontro
                </div>
              </div>
            </div>
            <span className="badge badge-amber" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Vivência Oficial
            </span>
          </div>

          {filteredCirculos.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum vivenciante ou círculo encontrado com os critérios pesquisados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredCirculos.map(([circulo, pessoas]) => {
                const itemId = `circulo-${circulo}`;
                const isExpanded = effectiveExpanded.has(itemId);

                return (
                  <div
                    key={circulo}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Cabeçalho Acordeom Suspenso */}
                    <button
                      type="button"
                      onClick={() => toggleItem(itemId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        background: isExpanded ? 'var(--brand-light)' : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isExpanded ? (
                          <CaretDown size={18} color="var(--brand-primary)" weight="bold" />
                        ) : (
                          <CaretRight size={18} color="var(--text-muted)" weight="bold" />
                        )}
                        <strong style={{ fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
                          Círculo {circulo}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          {pessoas.length} vivenciando{pessoas.length > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          {isExpanded ? 'Recolher' : 'Abrir'}
                        </span>
                      </div>
                    </button>

                    {/* Conteúdo Expandido do Círculo */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', background: '#fafaf9' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          {pessoas.map((p) => {
                            const fullName = p.person?.name || (p.person?.legacy_id ? `${p.person.legacy_id}` : `Pessoa ${p.person_id.slice(0, 8)}…`);
                            const meta = getConditionMeta(p.condition, p.role);

                            return (
                              <div
                                key={p.id}
                                style={{
                                  background: '#fff',
                                  border: '1px solid var(--border-base)',
                                  borderLeft: meta.cardBorderLeft,
                                  borderRadius: 'var(--radius-md)',
                                  padding: '12px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <Link
                                    href={`/pessoas/${p.person_id}`}
                                    className="text-link"
                                    style={{
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      color: 'var(--brand-primary)',
                                    }}
                                  >
                                    {fullName}
                                  </Link>
                                  <span
                                    style={{
                                      fontSize: '0.70rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      border: '1px solid #fde68a',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Vivenciando
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                                  {/* Etiqueta Diferenciada de Condição */}
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: meta.badgeBg,
                                      color: meta.badgeColor,
                                      border: `1px solid ${meta.badgeBorder}`,
                                    }}
                                  >
                                    {meta.iconEmoji} {meta.conditionLabel}
                                  </span>

                                  {p.patron && (
                                    <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                                      Padroeiro: {p.patron}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SEÇÃO 2: EQUIPES DE TRABALHO */}
      {(activeTab === 'all' || activeTab === 'equipes') && (
        <section className="panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              background: 'linear-gradient(to right, #f4f6fb, #fff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HandHeart size={22} color="var(--brand-secondary)" weight="duotone" />
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                  Equipes de Trabalho ({number(trabalhadores.length)} voluntários)
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {filteredEquipes.length} equipes estruturadas neste encontro
                </div>
              </div>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Voluntários e Serviço
            </span>
          </div>

          {filteredEquipes.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhuma equipe de trabalho encontrada com os critérios pesquisados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredEquipes.map(([equipe, membros]) => {
                const itemId = `equipe-${equipe}`;
                const isExpanded = effectiveExpanded.has(itemId);

                return (
                  <div
                    key={equipe}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Cabeçalho Acordeom Suspenso */}
                    <button
                      type="button"
                      onClick={() => toggleItem(itemId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        background: isExpanded ? '#f0fdf4' : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isExpanded ? (
                          <CaretDown size={18} color="var(--text-main)" weight="bold" />
                        ) : (
                          <CaretRight size={18} color="var(--text-muted)" weight="bold" />
                        )}
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {equipe}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          {membros.length} membro{membros.length > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          {isExpanded ? 'Recolher' : 'Abrir'}
                        </span>
                      </div>
                    </button>

                    {/* Conteúdo Expandido da Equipe */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', background: '#fafaf9' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          {membros.map((m) => {
                            const fullName = m.person?.name || (m.person?.legacy_id ? `${m.person.legacy_id}` : `Pessoa ${m.person_id.slice(0, 8)}…`);
                            const roleLabel = m.role || m.condition || 'Membro';
                            const meta = getConditionMeta(m.condition, m.role);

                            return (
                              <div
                                key={m.id}
                                style={{
                                  background: '#fff',
                                  border: '1px solid var(--border-base)',
                                  borderLeft: meta.cardBorderLeft,
                                  borderRadius: 'var(--radius-md)',
                                  padding: '12px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <Link
                                    href={`/pessoas/${m.person_id}`}
                                    className="text-link"
                                    style={{
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      color: 'var(--text-main)',
                                    }}
                                  >
                                    {fullName}
                                  </Link>

                                  {/* Etiqueta Diferenciada da Função (Casal vs Jovem) */}
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      color: meta.roleBadgeColor,
                                      background: meta.roleBadgeBg,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      border: `1px solid ${meta.roleBadgeBorder}`,
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    {roleLabel}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                                  {/* Pílula Visual de Condição (💍 Casal / ⚡ Jovem) */}
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: meta.badgeBg,
                                      color: meta.badgeColor,
                                      border: `1px solid ${meta.badgeBorder}`,
                                    }}
                                  >
                                    {meta.iconEmoji} {meta.conditionLabel}
                                  </span>

                                  {m.person?.legacy_id && (
                                    <span style={{ color: 'var(--text-subtle)', fontWeight: 500 }}>
                                      {m.person.legacy_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SEÇÃO 3: LIDERANÇA INSTITUCIONAL / MANDATOS VIGENTES */}
      {(activeTab === 'all' || activeTab === 'mandatos') && lideranca.length > 0 && (
        <section className="panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              background: 'linear-gradient(to right, #fefce8, #fff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#92400e', fontFamily: 'var(--font-serif)' }}>
                  Liderança Institucional / Mandatos Vigentes ({number(lideranca.length)})
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Conselho Diocesano e Equipe Dirigente presentes por vigência de mandato bienal
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
              }}
            >
              Mandato Bienal Vigente
            </span>
          </div>

          {/* Box explicativo institucional */}
          <div
            style={{
              padding: '12px 20px',
              background: '#fffbeb',
              borderBottom: '1px solid #fef3c7',
              fontSize: '0.8rem',
              color: '#78350f',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1.1rem', marginTop: '-1px' }}>ℹ️</span>
            <div>
              <strong>Esclarecimento Institucional:</strong> Os membros do Conselho Diocesano e da Equipe Dirigente da Paróquia constam formalmente no quadrante do encontro por estarem no exercício de seus mandatos bienais (média de 2 anos de mandato). Sua presença aqui representa a liderança institucional e pastoral do movimento no ano em que o encontro foi realizado. Caso algum dirigente tenha atuado na equipe de serviço operacional do evento, seu nome estará também na respectiva equipe de serviço acima.
            </div>
          </div>

          {filteredLideranca.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum membro da liderança institucional encontrado com os critérios pesquisados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredLideranca.map(([orgao, membros]) => {
                const itemId = `lideranca-${orgao}`;
                const isExpanded = effectiveExpanded.has(itemId);

                return (
                  <div
                    key={orgao}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Cabeçalho Acordeom Suspenso */}
                    <button
                      type="button"
                      onClick={() => toggleItem(itemId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        background: isExpanded ? '#fffdf0' : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isExpanded ? (
                          <CaretDown size={18} color="#92400e" weight="bold" />
                        ) : (
                          <CaretRight size={18} color="var(--text-muted)" weight="bold" />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>🏛️</span>
                          <strong style={{ fontSize: '0.95rem', color: '#92400e' }}>
                            {orgao}
                          </strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {membros.length} dirigente{membros.length > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          {isExpanded ? 'Recolher' : 'Abrir'}
                        </span>
                      </div>
                    </button>

                    {/* Conteúdo Expandido da Liderança */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', background: '#fdfbf7' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          {membros.map((m) => {
                            const fullName = m.person?.name || (m.person?.legacy_id ? `${m.person.legacy_id}` : `Pessoa ${m.person_id.slice(0, 8)}…`);
                            const roleLabel = m.role || m.condition || 'Membro do Mandato';
                            const meta = getConditionMeta(m.condition, m.role);

                            return (
                              <div
                                key={m.id}
                                style={{
                                  background: '#fff',
                                  border: '1px solid var(--border-base)',
                                  borderLeft: meta.cardBorderLeft,
                                  borderRadius: 'var(--radius-md)',
                                  padding: '12px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <Link
                                    href={`/pessoas/${m.person_id}`}
                                    className="text-link"
                                    style={{
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      color: 'var(--text-main)',
                                    }}
                                  >
                                    {fullName}
                                  </Link>

                                  <span
                                    style={{
                                      fontSize: '0.70rem',
                                      fontWeight: 700,
                                      color: '#92400e',
                                      background: '#fef3c7',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #fde68a',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    🏛 Mandato
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: meta.badgeBg,
                                      color: meta.badgeColor,
                                      border: `1px solid ${meta.badgeBorder}`,
                                    }}
                                  >
                                    {meta.iconEmoji} {meta.conditionLabel}
                                  </span>

                                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem' }}>
                                    {roleLabel}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
