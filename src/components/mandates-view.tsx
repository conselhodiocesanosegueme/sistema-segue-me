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
  Sparkle
} from '@phosphor-icons/react';
import type { Mandate, Viewer } from '@/lib/types';
import {
  MANDATE_BODIES,
  type MandateBody,
  normalizeMandateBody,
  type NormalizedMandateMeta,
  getMandateStatus
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

  const [activeTab, setActiveTab] = useState<'all' | 'diocesano' | 'setorial' | 'equipe_dirigente'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Normalização e descarte seguro de equipes operacionais (ex: Faxina, Gráfica, etc.)
  const normalizedList = useMemo(() => {
    const list: Array<{ mandate: Mandate; meta: NormalizedMandateMeta }> = [];
    for (const m of initialMandates) {
      const meta = normalizeMandateBody(m.body, m.role);
      if (!meta) continue;
      list.push({ mandate: m, meta });
    }
    return list;
  }, [initialMandates]);

  // Contagens por categoria da estrutura oficial
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

      // 2. Setor (1 a 6)
      if (sectorFilter !== 'all') {
        const itemSector = meta.sectorId || m.sector_id;
        if (itemSector !== sectorFilter) return false;
      }

      // 3. Condição (Casal / Jovem)
      if (conditionFilter !== 'all' && m.condition !== conditionFilter) return false;

      // 4. Status de vigência (Ativo / Concluído)
      const vigencia = getMandateStatus(m.start_year, m.end_year);
      if (statusFilter === 'ativo' && !vigencia.isActive) return false;
      if (statusFilter === 'concluido' && vigencia.isActive) return false;

      // 5. Busca por texto
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
  }, [normalizedList, activeTab, sectorFilter, conditionFilter, statusFilter, searchQuery]);

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

  return (
    <div className="page-enter">
      {/* Cabeçalho da Página - Título simples e direto: Mandatos */}
      <PageHeading
        eyebrow="ESTRUTURA DIOCESANA · DIOCESE DE ANÁPOLIS"
        title="Mandatos"
        description="Gestão institucional do Conselho Diocesano (Coordenação Diocesana e Setoriais dos 6 Setores) e Equipes Dirigentes."
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

      {/* Cards de Resumo das 3 Instâncias Oficiais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div className="stat-card stat-primary">
          <div className="stat-top">
            <span>Total de Mandatos</span>
            <Scroll size={20} />
          </div>
          <strong className="stat-number">{number(counts.total)}</strong>
          <div className="stat-bottom">
            <span>Lideranças documentadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Coordenação Diocesana</span>
            <Buildings size={20} />
          </div>
          <strong className="stat-number" style={{ color: '#92400e' }}>
            {number(counts.diocesano)}
          </strong>
          <div className="stat-bottom">
            <span>Conselho Executivo Diocesano</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Coordenações Setoriais</span>
            <UsersThree size={20} />
          </div>
          <strong className="stat-number" style={{ color: '#1d4ed8' }}>
            {number(counts.setorial)}
          </strong>
          <div className="stat-bottom">
            <span>6 Setores da Diocese</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Equipes Dirigentes</span>
            <Church size={20} />
          </div>
          <strong className="stat-number" style={{ color: '#15803d' }}>
            {number(counts.equipe_dirigente)}
          </strong>
          <div className="stat-bottom">
            <span>Paróquias e Etapas</span>
          </div>
        </div>
      </div>

      {/* Box Explicativo da Estrutura Oficial de Mandatos */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#78350f',
          fontSize: '0.84rem',
          lineHeight: 1.5,
          marginBottom: '22px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span style={{ fontSize: '1.4rem', marginTop: '-2px' }}>🏛️</span>
        <div>
          <strong style={{ fontSize: '0.92rem' }}>
            Estrutura Oficial de Mandatos do Movimento Segue-me:
          </strong>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              • <strong>Coordenação Diocesana:</strong> Composta por 1 Casal Coordenador, 2 Jovens Coordenadores, 2 Casais Tesoureiros (anteriormente Casais Auxiliares), 2 Jovens Secretários (anteriormente Jovens Auxiliares) e Assessor Eclesiástico.
            </div>
            <div>
              • <strong>Coordenações Setoriais:</strong> Organizada em 6 Setores territoriais. Cada setor possui <strong>1 Casal e 2 Jovens Setoriais</strong> que tomam conta do setor e mantêm articulação direta com as Equipes Dirigentes das paróquias.
            </div>
            <div>
              • <strong>Equipes Dirigentes:</strong> Lideranças responsáveis pelas etapas do Segue-me nas paróquias (1ª Etapa) e a nível diocesano (2ª Etapa), organizadas por pastas pastorais.
            </div>
            <div style={{ fontStyle: 'italic', marginTop: '2px', color: '#92400e' }}>
              * Os mandatos no Segue-me têm duração média de 2 anos (período bienal), distinguindo-se categoricamente do trabalho operacional temporário nos encontros.
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Controles, Abas e Filtros */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Abas Principais de Separação */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSectorFilter('all');
            }}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'all' ? '2px solid var(--brand-primary)' : '1px solid var(--border-base)',
              background: activeTab === 'all' ? 'var(--brand-primary)' : '#ffffff',
              color: activeTab === 'all' ? '#ffffff' : 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)',
            }}
          >
            Todos os Mandatos ({number(counts.total)})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('diocesano');
              setSectorFilter('all');
            }}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'diocesano' ? '2px solid #b45309' : '1px solid #fde68a',
              background: activeTab === 'diocesano' ? '#b45309' : '#fffdf5',
              color: activeTab === 'diocesano' ? '#ffffff' : '#92400e',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)',
            }}
          >
            <span>🏛️</span>
            Coordenação Diocesana ({number(counts.diocesano)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('setorial')}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'setorial' ? '2px solid #1d4ed8' : '1px solid #bfdbfe',
              background: activeTab === 'setorial' ? '#1d4ed8' : '#eff6ff',
              color: activeTab === 'setorial' ? '#ffffff' : '#1d4ed8',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)',
            }}
          >
            <span>🌐</span>
            Coordenações Setoriais ({number(counts.setorial)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipe_dirigente')}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'equipe_dirigente' ? '2px solid #15803d' : '1px solid #bbf7d0',
              background: activeTab === 'equipe_dirigente' ? '#15803d' : '#f0fdf4',
              color: activeTab === 'equipe_dirigente' ? '#ffffff' : '#15803d',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)',
            }}
          >
            <span>⛪</span>
            Equipes Dirigentes ({number(counts.equipe_dirigente)})
          </button>
        </div>

        {/* Linha 2: Filtros por Setor, Condição (Casal/Jovem), Status e Busca */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* Filtro de Setor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Setor:</span>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="filter-input"
                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              >
                <option value="all">Todos os Setores (1 a 6)</option>
                <option value="1">Setor 1</option>
                <option value="2">Setor 2</option>
                <option value="3">Setor 3</option>
                <option value="4">Setor 4</option>
                <option value="5">Setor 5</option>
                <option value="6">Setor 6</option>
              </select>
            </div>

            {/* Filtro por Condição com Identidade Visual Casal vs Jovem */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setConditionFilter(conditionFilter === 'Casal' ? 'all' : 'Casal')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-md)',
                  border: conditionFilter === 'Casal' ? '2px solid #b45309' : '1px solid #fde68a',
                  background: conditionFilter === 'Casal' ? '#b45309' : '#fef3c7',
                  color: conditionFilter === 'Casal' ? '#fff' : '#92400e',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                💍 Casais
              </button>

              <button
                type="button"
                onClick={() => setConditionFilter(conditionFilter === 'Jovem' ? 'all' : 'Jovem')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-md)',
                  border: conditionFilter === 'Jovem' ? '2px solid #1d4ed8' : '1px solid #bfdbfe',
                  background: conditionFilter === 'Jovem' ? '#1d4ed8' : '#eff6ff',
                  color: conditionFilter === 'Jovem' ? '#fff' : '#1d4ed8',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ⚡ Jovens
              </button>
            </div>

            {/* Filtro de Status de Vigência */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-input"
                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              >
                <option value="all">Status: Todos</option>
                <option value="ativo">🟢 Apenas Ativos (Vigentes)</option>
                <option value="concluido">⚪ Encerrados (Concluídos)</option>
              </select>
            </div>
          </div>

          {/* Campo de Busca */}
          <div style={{ display: 'flex', gap: '8px', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, cargo/pasta ou paróquia..."
              className="filter-input"
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
            {(searchQuery || conditionFilter !== 'all' || sectorFilter !== 'all' || statusFilter !== 'all' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setConditionFilter('all');
                  setSectorFilter('all');
                  setStatusFilter('all');
                  setActiveTab('all');
                }}
                className="button button-secondary"
                style={{ fontSize: '0.78rem', padding: '5px 10px', whiteSpace: 'nowrap' }}
              >
                <X size={14} /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Mandatos Institucionais */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-base)',
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Scroll size={40} color="var(--text-subtle)" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            Nenhum mandato institucional encontrado
          </h3>
          <p style={{ fontSize: '0.84rem' }}>
            Tente redefinir os filtros por setor, condição ou termo de busca acima.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredItems.map(({ mandate, meta }) => {
            const isCasal = mandate.condition === 'Casal';
            const vigencia = getMandateStatus(mandate.start_year, mandate.end_year);

            return (
              <div
                key={mandate.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-base)',
                  borderLeft: isCasal ? '4px solid #d97706' : '4px solid #2563eb',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  {/* Topo do Card: Badge do Órgão e Status de Vigência */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: meta.badgeBg,
                        color: meta.badgeColor,
                        border: `1px solid ${meta.badgeBorder}`,
                      }}
                    >
                      {meta.badgeLabel}
                    </span>

                    <span
                      style={{
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: vigencia.badgeBg,
                        color: vigencia.badgeColor,
                        border: `1px solid ${vigencia.badgeBorder}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vigencia.label}
                    </span>
                  </div>

                  {/* Cargo / Pasta Desempenhada */}
                  <h4
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '1.15rem',
                      color: isCasal ? '#92400e' : 'var(--text-main)',
                      fontFamily: 'var(--font-serif)',
                      lineHeight: 1.25,
                    }}
                  >
                    {mandate.role}
                  </h4>

                  {/* Informações da Pessoa no Mandato */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px' }}>
                    <span
                      style={{
                        width: '36px',
                        height: '36px',
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
                      {isCasal ? <Heart size={18} weight="fill" /> : <User size={18} />}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {mandate.person ? (
                        <Link
                          href={`/pessoas/${mandate.person.id}`}
                          style={{
                            fontWeight: 700,
                            fontSize: '0.94rem',
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
                          <ArrowRight size={13} color="var(--brand-primary)" />
                        </Link>
                      ) : (
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          Pessoa não vinculada
                        </strong>
                      )}

                      {/* Cônjuge se for Casal */}
                      {isCasal && mandate.spouse && (
                        <div style={{ fontSize: '0.82rem', color: '#92400e', marginTop: '2px', fontWeight: 600 }}>
                          &amp;{' '}
                          <Link
                            href={`/pessoas/${mandate.spouse.id}`}
                            style={{ color: '#b45309', textDecoration: 'none' }}
                          >
                            {mandate.spouse.name}
                          </Link>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        {/* Pílula de Condição */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '999px',
                            background: isCasal ? '#fef3c7' : '#eff6ff',
                            color: isCasal ? '#92400e' : '#1d4ed8',
                            border: isCasal ? '1px solid #fde68a' : '1px solid #bfdbfe',
                          }}
                        >
                          {isCasal ? '💍 Casal' : '⚡ Jovem'}
                        </span>

                        {mandate.person?.legacy_id && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                            {mandate.person.legacy_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Paróquia de Origem ou Vinculação */}
                  {(mandate.parish || mandate.person?.parish) && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '12px',
                        background: '#fafaf9',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Church size={14} color="var(--brand-primary)" />
                      <span>{mandate.parish || mandate.person?.parish}</span>
                    </div>
                  )}
                </div>

                {/* Rodapé do Cartão com Período Bienal e Ação de Exclusão */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CalendarBlank size={14} color="var(--brand-primary)" />
                    <strong>{vigencia.displayPeriod}</strong>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-subtle)' }}>(Biênio)</span>
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
                        fontSize: '0.75rem',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                      title="Excluir mandato"
                    >
                      <Trash size={14} />
                      {deletingId === mandate.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
