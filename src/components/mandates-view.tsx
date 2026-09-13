"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Buildings,
  CalendarBlank,
  CheckCircle,
  Church,
  Clock,
  Funnel,
  Heart,
  Plus,
  Scroll,
  Trash,
  User,
  UsersThree,
  X,
  Sparkle,
  FolderSimple,
  ShieldCheck,
  GlobeHemisphereWest
} from '@phosphor-icons/react';
import type { Mandate, Viewer } from '@/lib/types';
import {
  MANDATE_BODIES,
  type MandateBody,
  normalizeMandateBody,
  type NormalizedMandateMeta,
  getMandateStatus,
  getConditionMeta
} from '@/lib/encounter-config';
import { DIOCESAN_SECTORS } from '@/lib/sectors';
import { PageHeading, number } from './ui';
import { ManageMandateModal } from './manage-mandate-modal';

interface MandatesViewProps {
  initialMandates: Mandate[];
  viewer: Viewer;
}

export function MandatesView({ initialMandates, viewer }: MandatesViewProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'diocesano' | 'setorial' | 'equipe_dirigente'>('diocesano');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Normalização de mandatos
  const normalizedList = useMemo(() => {
    const list: Array<{ mandate: Mandate; meta: NormalizedMandateMeta }> = [];
    for (const m of initialMandates) {
      const meta = normalizeMandateBody(m.body, m.role);
      if (!meta) continue;
      list.push({ mandate: m, meta });
    }
    return list;
  }, [initialMandates]);

  // Anos disponíveis para filtro
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const item of normalizedList) {
      if (item.mandate.start_year) years.add(item.mandate.start_year);
      if (item.mandate.end_year) years.add(item.mandate.end_year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [normalizedList]);

  // Contagens por categoria
  const counts = useMemo(() => {
    let diocesano = 0;
    let setorial = 0;
    let equipe_dirigente = 0;
    for (const item of normalizedList) {
      if (item.meta.category === 'diocesano') diocesano++;
      else if (item.meta.category === 'setorial') setorial++;
      else if (item.meta.category === 'equipe_dirigente') equipe_dirigente++;
    }
    return {
      total: normalizedList.length,
      diocesano,
      setorial,
      equipe_dirigente,
    };
  }, [normalizedList]);

  // Filtragem combinada
  const filteredItems = useMemo(() => {
    return normalizedList.filter(({ mandate: m, meta }) => {
      // 1. Aba principal
      if (activeTab !== 'all' && meta.category !== activeTab) return false;

      // 2. Filtro de Ano
      if (selectedYear !== 'all') {
        const y = Number(selectedYear);
        const start = m.start_year || 0;
        const end = m.end_year || start;
        if (y < start || y > end) return false;
      }

      // 3. Setor (1 a 6)
      if (sectorFilter !== 'all') {
        const itemSector = meta.sectorId || m.sector_id;
        if (itemSector !== sectorFilter) return false;
      }

      // 4. Condição (Casal / Jovem)
      if (conditionFilter !== 'all' && m.condition !== conditionFilter) return false;

      // 5. Status de vigência (Ativo / Concluído)
      const vigencia = getMandateStatus(m.start_year, m.end_year);
      if (statusFilter === 'ativo' && !vigencia.isActive) return false;
      if (statusFilter === 'concluido' && vigencia.isActive) return false;

      // 6. Busca por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (m.person?.name || '').toLowerCase();
        const sName = (m.spouse?.name || '').toLowerCase();
        const roleName = m.role.toLowerCase();
        const parishName = (m.parish || '').toLowerCase();
        const legId = (m.person?.legacy_id || '').toLowerCase();
        const bodyName = meta.badgeLabel.toLowerCase();
        if (
          !pName.includes(q) &&
          !sName.includes(q) &&
          !roleName.includes(q) &&
          !parishName.includes(q) &&
          !legId.includes(q) &&
          !bodyName.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedList, activeTab, selectedYear, sectorFilter, conditionFilter, statusFilter, searchQuery]);

  // Função auxiliar para agrupar mandatos do Conselho Diocesano por Ano e Pasta
  const diocesanoGrouped = useMemo(() => {
    const diocesanoItems = filteredItems.filter((i) => i.meta.category === 'diocesano');
    const byYear: Record<number, Record<string, typeof diocesanoItems>> = {};

    for (const item of diocesanoItems) {
      const year = item.mandate.start_year || new Date().getFullYear();
      if (!byYear[year]) byYear[year] = {};

      const roleLower = item.mandate.role.toLowerCase();
      let folder = 'Outras Funções';
      if (roleLower.includes('coordenador') || roleLower.includes('coordenação')) {
        folder = 'Coordenação Diocesana';
      } else if (roleLower.includes('tesour') || roleLower.includes('finan')) {
        folder = 'Tesouraria / Finanças';
      } else if (roleLower.includes('secretár') || roleLower.includes('secretar')) {
        folder = 'Secretaria';
      } else if (roleLower.includes('espiritual') || roleLower.includes('eclesiástico')) {
        folder = 'Diretoria Espiritual';
      } else if (roleLower.includes('formaç') || roleLower.includes('formac') || roleLower.includes('comunicaç')) {
        folder = 'Formação & Comunicação';
      }

      if (!byYear[year][folder]) byYear[year][folder] = [];
      byYear[year][folder].push(item);
    }

    const sortedYears = Object.keys(byYear).map(Number).sort((a, b) => b - a);
    return { byYear, sortedYears };
  }, [filteredItems]);

  // Função auxiliar para agrupar Coordenações Setoriais por Setor e Ano
  const setorialGrouped = useMemo(() => {
    const setorialItems = filteredItems.filter((i) => i.meta.category === 'setorial');
    const bySector: Record<string, { sectorName: string; byYear: Record<number, typeof setorialItems> }> = {};

    for (const s of DIOCESAN_SECTORS) {
      bySector[s.id] = { sectorName: `${s.name} (${s.region})`, byYear: {} };
    }

    for (const item of setorialItems) {
      const sId = item.meta.sectorId || item.mandate.sector_id || 'setor-1';
      if (!bySector[sId]) {
        bySector[sId] = { sectorName: item.meta.sectorName || 'Setor Diocesano', byYear: {} };
      }
      const year = item.mandate.start_year || new Date().getFullYear();
      if (!bySector[sId].byYear[year]) bySector[sId].byYear[year] = [];
      bySector[sId].byYear[year].push(item);
    }

    return bySector;
  }, [filteredItems]);

  // Função auxiliar para agrupar Equipes Dirigentes por Setor, Paróquia e Ano
  const dirigentesGrouped = useMemo(() => {
    const dirigenteItems = filteredItems.filter((i) => i.meta.category === 'equipe_dirigente');
    const byParish: Record<string, { parish: string; sectorName: string; byYear: Record<number, Record<string, typeof dirigenteItems>> }> = {};

    for (const item of dirigenteItems) {
      const pName = item.mandate.parish || item.mandate.person?.parish || 'Paróquia não identificada';
      const sectorObj = DIOCESAN_SECTORS.find((s) => s.parishes.some((p) => p.name === pName || p.dbNames.includes(pName)));
      const sectorName = sectorObj ? sectorObj.name : 'Setor';

      if (!byParish[pName]) {
        byParish[pName] = { parish: pName, sectorName, byYear: {} };
      }

      const year = item.mandate.start_year || new Date().getFullYear();
      if (!byParish[pName].byYear[year]) byParish[pName].byYear[year] = {};

      const roleLower = item.mandate.role.toLowerCase();
      let pasta = 'Outras Pastas';
      if (roleLower.includes('montagem')) pasta = 'Pasta Montagem';
      else if (roleLower.includes('ficha')) pasta = 'Pasta Fichas';
      else if (roleLower.includes('finan') || roleLower.includes('tesour')) pasta = 'Pasta Finanças';
      else if (roleLower.includes('palestra')) pasta = 'Pasta Palestra';
      else if (roleLower.includes('pós-encontro') || roleLower.includes('pos-encontro')) pasta = 'Pasta Pós-Encontro';
      else if (roleLower.includes('espiritual')) pasta = 'Diretor Espiritual';

      if (!byParish[pName].byYear[year][pasta]) byParish[pName].byYear[year][pasta] = [];
      byParish[pName].byYear[year][pasta].push(item);
    }

    const sortedParishes = Object.keys(byParish).sort();
    return { byParish, sortedParishes };
  }, [filteredItems]);

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente remover este registro de mandato?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/mandates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  // Renderizador de Cartão de Mandato Individual
  const renderMandateCard = (item: (typeof normalizedList)[0]) => {
    const { mandate, meta } = item;
    const condMeta = getConditionMeta(mandate.condition, mandate.role);
    const vigencia = getMandateStatus(mandate.start_year, mandate.end_year);
    const isCasal = condMeta.isCasal;

    return (
      <div
        key={mandate.id}
        className="panel"
        style={{
          borderLeft: condMeta.cardBorderLeft,
          padding: '16px 18px',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          transition: 'all 0.18s ease-in-out',
        }}
      >
        <div>
          {/* Topo do Card: Pasta & Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <h4
              style={{
                margin: 0,
                fontSize: '1.05rem',
                color: isCasal ? '#92400e' : 'var(--text-main)',
                fontFamily: 'var(--font-serif)',
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              {mandate.role}
            </h4>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: vigencia.badgeBg,
                color: vigencia.badgeColor,
                border: `1px solid ${vigencia.badgeBorder}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {vigencia.label}
            </span>
          </div>

          {/* Dados da Pessoa */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '8px' }}>
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isCasal ? '#fef3c7' : '#eff6ff',
                color: isCasal ? '#b45309' : '#1d4ed8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: isCasal ? '1px solid #fde68a' : '1px solid #bfdbfe',
              }}
            >
              {isCasal ? <Heart size={16} weight="fill" /> : <User size={16} />}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              {mandate.person ? (
                <Link
                  href={`/pessoas/${mandate.person.id}`}
                  style={{
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mandate.person.name}
                  </span>
                  <ArrowRight size={12} color="var(--brand-primary)" />
                </Link>
              ) : (
                <strong style={{ fontSize: '0.90rem', color: 'var(--text-main)' }}>
                  Pessoa não vinculada
                </strong>
              )}

              {/* Cônjuge se Casal */}
              {isCasal && mandate.spouse && (
                <div style={{ fontSize: '0.80rem', color: '#92400e', marginTop: '2px', fontWeight: 600 }}>
                  &amp;{' '}
                  <Link
                    href={`/pessoas/${mandate.spouse.id}`}
                    style={{ color: '#b45309', textDecoration: 'none' }}
                  >
                    {mandate.spouse.name}
                  </Link>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isCasal ? '#fef3c7' : '#eff6ff',
                    color: isCasal ? '#92400e' : '#1d4ed8',
                    border: isCasal ? '1px solid #fde68a' : '1px solid #bfdbfe',
                  }}
                >
                  {isCasal ? '💍 Casal' : '⚡ Jovem'}
                </span>

                {mandate.person?.legacy_id && (
                  <span style={{ fontSize: '0.70rem', color: 'var(--text-subtle)' }}>
                    {mandate.person.legacy_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Paróquia */}
          {(mandate.parish || mandate.person?.parish) && (
            <div
              style={{
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '10px',
                background: '#fafaf9',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Church size={13} color="var(--brand-primary)" />
              <span>{mandate.parish || mandate.person?.parish}</span>
            </div>
          )}
        </div>

        {/* Rodapé do Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '10px',
            marginTop: '12px',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CalendarBlank size={14} color="var(--brand-primary)" />
            <strong>{vigencia.displayPeriod}</strong>
          </span>

          {(viewer.role === 'admin' || viewer.role === 'reviewer') && (
            <button
              type="button"
              onClick={() => handleDelete(mandate.id)}
              disabled={deletingId === mandate.id}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b91c1c',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                padding: '2px 4px',
                borderRadius: '4px',
              }}
              title="Excluir mandato"
            >
              <Trash size={13} />
              {deletingId === mandate.id ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter">
      {/* Cabeçalho Oficial */}
      <PageHeading
        eyebrow="ORGANIZAÇÃO INSTITUCIONAL · DIOCESE DE ANÁPOLIS"
        title="Mandatos e Pastas Oficiais"
        description="Estrutura de liderança do Segue-me: Conselho Diocesano, Coordenações dos 6 Setores e Equipes Dirigentes Paroquiais."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="button button-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            Cadastrar Novo Mandato
          </button>
        }
      />

      {/* Cards de Métricas Gerais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div className="stat-card stat-primary">
          <div className="stat-top">
            <span>Total Geral</span>
            <Scroll size={20} />
          </div>
          <strong className="stat-number">{number(counts.total)}</strong>
          <div className="stat-bottom">
            <span>Lideranças registradas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Conselho Diocesano</span>
            <Buildings size={20} color="#b45309" />
          </div>
          <strong className="stat-number" style={{ color: '#92400e' }}>
            {number(counts.diocesano)}
          </strong>
          <div className="stat-bottom">
            <span>Gestão Diocesana</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Coordenações Setoriais</span>
            <GlobeHemisphereWest size={20} color="#1d4ed8" />
          </div>
          <strong className="stat-number" style={{ color: '#1d4ed8' }}>
            {number(counts.setorial)}
          </strong>
          <div className="stat-bottom">
            <span>6 Setores Diocesanos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Equipes Dirigentes</span>
            <Church size={20} color="#15803d" />
          </div>
          <strong className="stat-number" style={{ color: '#15803d' }}>
            {number(counts.equipe_dirigente)}
          </strong>
          <div className="stat-bottom">
            <span>Paróquias e Etapas</span>
          </div>
        </div>
      </div>

      {/* Navegação por Grandes Blocos Institucionais */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-canvas)',
          padding: '6px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          marginBottom: '18px',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('diocesano')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'diocesano' ? '1px solid #fde68a' : 'none',
            background: activeTab === 'diocesano' ? '#fff' : 'transparent',
            color: activeTab === 'diocesano' ? '#92400e' : 'var(--text-muted)',
            fontWeight: activeTab === 'diocesano' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeTab === 'diocesano' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Buildings size={18} weight={activeTab === 'diocesano' ? 'fill' : 'regular'} />
          Conselho Diocesano ({counts.diocesano})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('setorial')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'setorial' ? '1px solid #bfdbfe' : 'none',
            background: activeTab === 'setorial' ? '#fff' : 'transparent',
            color: activeTab === 'setorial' ? '#1d4ed8' : 'var(--text-muted)',
            fontWeight: activeTab === 'setorial' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeTab === 'setorial' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <GlobeHemisphereWest size={18} weight={activeTab === 'setorial' ? 'fill' : 'regular'} />
          Coordenações Setoriais ({counts.setorial})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipe_dirigente')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'equipe_dirigente' ? '1px solid #bbf7d0' : 'none',
            background: activeTab === 'equipe_dirigente' ? '#fff' : 'transparent',
            color: activeTab === 'equipe_dirigente' ? '#166534' : 'var(--text-muted)',
            fontWeight: activeTab === 'equipe_dirigente' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeTab === 'equipe_dirigente' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Church size={18} weight={activeTab === 'equipe_dirigente' ? 'fill' : 'regular'} />
          Equipes Dirigentes ({counts.equipe_dirigente})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'all' ? '1px solid var(--border-base)' : 'none',
            background: activeTab === 'all' ? '#fff' : 'transparent',
            color: activeTab === 'all' ? 'var(--brand-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'all' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeTab === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Scroll size={18} />
          Todos ({counts.total})
        </button>
      </div>

      {/* Barra de Filtros Refinados */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
          <Funnel size={16} />
          <span>Filtros:</span>
        </div>

        {/* Filtro de Ano */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem', padding: '6px 10px' }}
        >
          <option value="all">📅 Todos os Anos</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              Ano {y}
            </option>
          ))}
        </select>

        {/* Filtro de Setor (se relevante) */}
        {(activeTab === 'setorial' || activeTab === 'equipe_dirigente' || activeTab === 'all') && (
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="filter-input"
            style={{ fontSize: '0.82rem', padding: '6px 10px' }}
          >
            <option value="all">🌐 Todos os Setores (1 a 6)</option>
            {DIOCESAN_SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.region}
              </option>
            ))}
          </select>
        )}

        {/* Filtro de Condição (Casal / Jovem) */}
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem', padding: '6px 10px' }}
        >
          <option value="all">👥 Jovens e Casais</option>
          <option value="Casal">💍 Apenas Casais</option>
          <option value="Jovem">⚡ Apenas Jovens</option>
        </select>

        {/* Filtro de Status de Vigência */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem', padding: '6px 10px' }}
        >
          <option value="all">Todos os Status</option>
          <option value="ativo">Vigentes (Ativos)</option>
          <option value="concluido">Concluídos (Encerrados)</option>
        </select>

        {/* Busca por texto */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, pasta ou paróquia..."
            className="filter-input"
            style={{ width: '100%', fontSize: '0.82rem', padding: '6px 12px' }}
          />
        </div>
      </div>

      {/* Conteúdo Principal Organizado em Blocos */}
      {filteredItems.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '50px 20px', background: '#fff' }}>
          <Scroll size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '6px' }}>
            Nenhum mandato encontrado
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tente ajustar os filtros de ano, setor ou o termo de busca.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 1. SEÇÃO CONSELHO DIOCESANO */}
          {(activeTab === 'diocesano' || activeTab === 'all') && diocesanoGrouped.sortedYears.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                  <Buildings size={22} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#78350f' }}>
                    Conselho Diocesano
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    Coordenação Diocesana do Segue-me na Diocese de Anápolis
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {diocesanoGrouped.sortedYears.map((year) => {
                  const folders = diocesanoGrouped.byYear[year];
                  const folderNames = Object.keys(folders).sort();

                  return (
                    <div
                      key={year}
                      style={{
                        background: '#ffffff',
                        borderRadius: 'var(--radius-xl)',
                        border: '1.5px solid #fde68a',
                        padding: '20px 24px',
                        boxShadow: '0 2px 6px rgba(180, 83, 9, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fef3c7', paddingBottom: '12px', marginBottom: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CalendarBlank size={20} color="#b45309" weight="bold" />
                          <strong style={{ fontSize: '1.1rem', color: '#92400e' }}>
                            Gestão {year}
                          </strong>
                        </div>
                        <span className="badge badge-amber" style={{ fontSize: '0.74rem' }}>
                          {Object.values(folders).flat().length} membros documentados
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {folderNames.map((folderName) => (
                          <div key={folderName}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                              <FolderSimple size={16} color="#b45309" weight="fill" />
                              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {folderName}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                              {folders[folderName].map(renderMandateCard)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2. SEÇÃO COORDENAÇÕES SETORIAIS */}
          {(activeTab === 'setorial' || activeTab === 'all') && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
                  <GlobeHemisphereWest size={22} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#1e3a8a' }}>
                    Coordenações Setoriais
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    Lideranças dos 6 Setores Diocesanos (Casal Setorial e Jovens Setoriais)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {DIOCESAN_SECTORS.map((sector) => {
                  const sData = setorialGrouped[sector.id];
                  if (!sData || Object.keys(sData.byYear).length === 0) return null;
                  const years = Object.keys(sData.byYear).map(Number).sort((a, b) => b - a);

                  return (
                    <div
                      key={sector.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 'var(--radius-xl)',
                        border: '1.5px solid #bfdbfe',
                        padding: '20px 24px',
                        boxShadow: '0 2px 6px rgba(29, 78, 216, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #dbeafe', paddingBottom: '12px', marginBottom: '18px' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#1d4ed8', display: 'block' }}>
                            {sector.name} — {sector.region}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                            {sector.parishes.length} paróquias vinculadas a este setor
                          </span>
                        </div>
                        <span className="badge badge-blue" style={{ fontSize: '0.74rem' }}>
                          Setor Diocesano
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {years.map((year) => (
                          <div key={year}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <CalendarBlank size={15} color="#1d4ed8" />
                              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e40af' }}>
                                Gestão {year}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                              {sData.byYear[year].map(renderMandateCard)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. SEÇÃO EQUIPES DIRIGENTES PAROQUIAIS */}
          {(activeTab === 'equipe_dirigente' || activeTab === 'all') && dirigentesGrouped.sortedParishes.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                  <Church size={22} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#14532d' }}>
                    Equipes Dirigentes Paroquiais
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    Divididas por Paróquias e organizadas pelas 5 Pastas Oficiais (Montagem, Fichas, Finanças, Palestra e Pós-Encontro)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {dirigentesGrouped.sortedParishes.map((parishName) => {
                  const pData = dirigentesGrouped.byParish[parishName];
                  const years = Object.keys(pData.byYear).map(Number).sort((a, b) => b - a);

                  return (
                    <div
                      key={parishName}
                      style={{
                        background: '#ffffff',
                        borderRadius: 'var(--radius-xl)',
                        border: '1.5px solid #bbf7d0',
                        padding: '20px 24px',
                        boxShadow: '0 2px 6px rgba(21, 128, 61, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #dcfce7', paddingBottom: '12px', marginBottom: '18px' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#166534', display: 'block' }}>
                            {parishName}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                            {pData.sectorName}
                          </span>
                        </div>
                        <span className="badge badge-green" style={{ fontSize: '0.74rem' }}>
                          Equipe Dirigente
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {years.map((year) => {
                          const pastas = pData.byYear[year];
                          const pastaNames = Object.keys(pastas).sort();

                          return (
                            <div key={year}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                <CalendarBlank size={16} color="#166534" weight="bold" />
                                <strong style={{ fontSize: '0.92rem', color: '#14532d' }}>
                                  Gestão {year}
                                </strong>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {pastaNames.map((pastaName) => (
                                  <div key={pastaName}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                      <FolderSimple size={14} color="#15803d" weight="fill" />
                                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                                        {pastaName}
                                      </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                                      {pastas[pastaName].map(renderMandateCard)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal de Criação de Mandato */}
      <ManageMandateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultBody={
          activeTab === 'diocesano'
            ? 'Conselho Diocesano'
            : activeTab === 'setorial'
            ? 'Coordenação Setorial'
            : activeTab === 'equipe_dirigente'
            ? 'Equipe Dirigente - 1ª Etapa'
            : undefined
        }
      />
    </div>
  );
}
