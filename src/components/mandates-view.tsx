"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Buildings,
  Church,
  GlobeHemisphereWest,
  Heart,
  Plus,
  Scroll,
  Trash,
  User,
  FolderSimple,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import type { Mandate, Viewer } from '@/lib/types';
import {
  normalizeMandateBody,
  type NormalizedMandateMeta,
  getMandateStatus,
} from '@/lib/encounter-config';
import { DIOCESAN_SECTORS } from '@/lib/sectors';
import { PageHeading } from './ui';
import { ManageMandateModal } from './manage-mandate-modal';

interface MandatesViewProps {
  initialMandates: Mandate[];
  viewer: Viewer;
}

// Representa uma liderança unificada (unindo marido e esposa em uma única linha se for casal)
interface UnifiedLeadership {
  id: string; // ID do mandato principal
  mandateIds: string[]; // IDs de ambos os mandatos (se casal) para eventual exclusão
  role: string;
  folder: string;
  condition: 'Casal' | 'Jovem';
  person1: {
    id: string;
    name: string;
    legacy_id?: string | null;
    photo_url?: string | null;
    parish?: string | null;
  };
  person2?: {
    id: string;
    name: string;
    legacy_id?: string | null;
    photo_url?: string | null;
    parish?: string | null;
  } | null;
  parish: string | null;
  start_year: number | null;
  end_year: number | null;
  status: {
    isActive: boolean;
    label: string;
    badgeBg?: string;
    badgeColor?: string;
    badgeBorder?: string;
    displayPeriod: string;
  };
}

// Normalizador de nomes para desduplicação confiável
function cleanName(n: string): string {
  return (n || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export function MandatesView({ initialMandates, viewer }: MandatesViewProps) {
  const router = useRouter();

  // Menu Suspenso 1: Instância / Órgão
  const [activeTab, setActiveTab] = useState<'diocesano' | 'setorial' | 'equipe_dirigente' | 'all'>('diocesano');

  // Menus Suspensos de Filtro
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [parishFilter, setParishFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais e ações
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

  // Anos disponíveis para filtro ordenados decrescente
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const item of normalizedList) {
      if (item.mandate.start_year) years.add(item.mandate.start_year);
      if (item.mandate.end_year) years.add(item.mandate.end_year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [normalizedList]);

  // Inicializa com o ano mais recente (ex: 2026) em vez de 'all' para não sobrecarregar
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return availableYears.length > 0 ? String(availableYears[0]) : '2026';
  });

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
      // 1. Aba principal (Instância)
      if (activeTab !== 'all' && meta.category !== activeTab) return false;

      // 2. Filtro de Ano / Gestão
      if (selectedYear !== 'all') {
        const y = Number(selectedYear);
        const start = m.start_year || 0;
        const end = m.end_year || start;
        if (y < start || y > end) return false;
      }

      // 3. Setor
      if (sectorFilter !== 'all') {
        const itemSector = meta.sectorId || m.sector_id;
        if (itemSector !== sectorFilter) return false;
      }

      // 4. Paróquia
      if (parishFilter !== 'all') {
        const pName = m.parish || m.person?.parish || '';
        if (pName !== parishFilter) return false;
      }

      // 5. Condição (Casal / Jovem)
      if (conditionFilter !== 'all' && m.condition !== conditionFilter) return false;

      // 6. Status de vigência (Ativo / Concluído)
      const vigencia = getMandateStatus(m.start_year, m.end_year);
      if (statusFilter === 'ativo' && !vigencia.isActive) return false;
      if (statusFilter === 'concluido' && vigencia.isActive) return false;

      // 7. Busca por texto
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
  }, [normalizedList, activeTab, selectedYear, sectorFilter, parishFilter, conditionFilter, statusFilter, searchQuery]);

  // Função central para desduplicação e unificação de lideranças
  function unifyLeadershipList(items: Array<{ mandate: Mandate; meta: NormalizedMandateMeta }>): UnifiedLeadership[] {
    const list: UnifiedLeadership[] = [];
    const seenPersonIds = new Set<string>();
    const seenPersonNames = new Set<string>();
    const seenCoupleSignatures = new Set<string>();
    const coupleMemberNames = new Set<string>();

    // Ordena de modo que cargos principais e específicos venham ANTES de funções genéricas como 'Auxiliar'
    const sortedItems = [...items].sort((a, b) => {
      const aRole = a.mandate.role.toLowerCase();
      const bRole = b.mandate.role.toLowerCase();
      const aAux = aRole.includes('auxiliar') || aRole === 'membro';
      const bAux = bRole.includes('auxiliar') || bRole === 'membro';
      if (aAux && !bAux) return 1;
      if (!aAux && bAux) return -1;
      return 0;
    });

    for (const { mandate: m, meta } of sortedItems) {
      if (!m.person) continue;

      const vigencia = getMandateStatus(m.start_year, m.end_year);
      const roleLower = m.role.toLowerCase();
      const isExplicitJovem = m.condition === 'Jovem' || roleLower.includes('jovem');
      const isExplicitCasal = m.condition === 'Casal' || roleLower.includes('casal');
      const isConselhoTesouraria = meta.category === 'diocesano' && (roleLower.includes('tesour') || roleLower.includes('finan'));
      const isCasal = !isExplicitJovem && (isExplicitCasal || isConselhoTesouraria || (Boolean(m.spouse) && !isExplicitJovem));

      const p1Clean = cleanName(m.person.name);
      const p2Clean = m.spouse ? cleanName(m.spouse.name) : '';

      // Classificação da Pasta Oficial
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
      } else if (roleLower.includes('montagem')) {
        folder = 'Pasta Montagem';
      } else if (roleLower.includes('ficha')) {
        folder = 'Pasta Fichas';
      } else if (roleLower.includes('palestra')) {
        folder = 'Pasta Palestra';
      } else if (roleLower.includes('pós-encontro') || roleLower.includes('pos-encontro')) {
        folder = 'Pasta Pós-Encontro';
      }

      if (isCasal) {
        // Assinatura do casal (independente de quem vem primeiro)
        const coupleSig = p2Clean
          ? [p1Clean, p2Clean].sort().join('::')
          : `casal::${p1Clean}`;

        if (seenCoupleSignatures.has(coupleSig)) continue;
        if (seenPersonIds.has(m.person.id)) continue;
        if (m.spouse && seenPersonIds.has(m.spouse.id)) continue;

        seenCoupleSignatures.add(coupleSig);
        seenPersonIds.add(m.person.id);
        seenPersonNames.add(p1Clean);
        coupleMemberNames.add(p1Clean);

        if (m.spouse) {
          seenPersonIds.add(m.spouse.id);
          seenPersonNames.add(p2Clean);
          coupleMemberNames.add(p2Clean);
        }

        // Normalização amigável do cargo de casal
        let displayRole = m.role.replace(/\s*\(casal\)\s*/ig, ' ').trim();
        if (displayRole.toLowerCase() === 'coordenador diocesano' || displayRole.toLowerCase() === 'coordenadora diocesana') {
          displayRole = 'Casal Coordenador Diocesano';
        } else if (displayRole.toLowerCase().includes('tesour') && !displayRole.toLowerCase().startsWith('casal')) {
          displayRole = 'Casal Tesoureiro';
        } else if (displayRole.toLowerCase() === 'casal tesoureira') {
          displayRole = 'Casal Tesoureiro';
        } else if (displayRole.toLowerCase().includes('secretár') && !displayRole.toLowerCase().startsWith('casal')) {
          displayRole = 'Casal Secretário';
        } else if (/jovem\s+e\s+casal\s+setorial/i.test(displayRole)) {
          displayRole = displayRole.replace(/jovem\s+e\s+casal\s+setorial/i, 'Casal Setorial');
        }

        list.push({
          id: m.id,
          mandateIds: [m.id],
          role: displayRole,
          folder,
          condition: 'Casal',
          person1: m.person,
          person2: m.spouse || null,
          parish: m.parish || m.person.parish || null,
          start_year: m.start_year,
          end_year: m.end_year,
          status: vigencia,
        });
      } else {
        // Jovem / Membro Individual
        // Ignora caso a pessoa já tenha sido cadastrada como Casal nesta mesma pasta ou em outra (erro comum de duplicata de planilha)
        if (coupleMemberNames.has(p1Clean)) continue;
        if (seenPersonIds.has(m.person.id)) continue;
        if (seenPersonNames.has(p1Clean)) continue;

        seenPersonIds.add(m.person.id);
        seenPersonNames.add(p1Clean);

        let displayRole = m.role.replace(/\s*\(casal\)\s*/ig, ' ').trim();
        if (displayRole.toLowerCase() === 'coordenador diocesano' || displayRole.toLowerCase() === 'coordenadora diocesana') {
          displayRole = 'Jovem Coordenador(a) Diocesano';
        } else if (/jovem\s+e\s+casal\s+setorial/i.test(displayRole)) {
          displayRole = displayRole.replace(/jovem\s+e\s+casal\s+setorial/i, 'Jovem Setorial');
        }

        list.push({
          id: m.id,
          mandateIds: [m.id],
          role: displayRole,
          folder,
          condition: 'Jovem',
          person1: m.person,
          person2: null,
          parish: m.parish || m.person.parish || null,
          start_year: m.start_year,
          end_year: m.end_year,
          status: vigencia,
        });
      }
    }

    return list;
  }

  // Agrupamento do Conselho Diocesano por Pasta
  const diocesanoFolders = useMemo(() => {
    const diocesanoItems = filteredItems.filter((i) => i.meta.category === 'diocesano');
    const unified = unifyLeadershipList(diocesanoItems);

    const folderMap: Record<string, UnifiedLeadership[]> = {};
    const officialOrder = [
      'Coordenação Diocesana',
      'Diretoria Espiritual',
      'Secretaria',
      'Tesouraria / Finanças',
      'Formação & Comunicação',
      'Outras Funções',
    ];

    for (const folder of officialOrder) {
      folderMap[folder] = [];
    }

    for (const row of unified) {
      if (!folderMap[row.folder]) folderMap[row.folder] = [];
      folderMap[row.folder].push(row);
    }

    return Object.entries(folderMap).filter(([, rows]) => rows.length > 0);
  }, [filteredItems]);

  // Agrupamento das Coordenações Setoriais por Setor
  const setorialBySector = useMemo(() => {
    const setorialItems = filteredItems.filter((i) => i.meta.category === 'setorial');
    const unified = unifyLeadershipList(setorialItems);

    const result: Array<{ sector: (typeof DIOCESAN_SECTORS)[0]; leaderships: UnifiedLeadership[] }> = [];

    for (const sector of DIOCESAN_SECTORS) {
      if (sectorFilter !== 'all' && sector.id !== sectorFilter) continue;

      const sectorLeaders = unified.filter((row) => {
        const item = setorialItems.find((it) => it.mandate.id === row.id);
        const sId = item?.meta.sectorId || item?.mandate.sector_id;
        return sId === sector.id;
      });

      if (sectorLeaders.length > 0) {
        result.push({ sector, leaderships: sectorLeaders });
      }
    }

    return result;
  }, [filteredItems, sectorFilter]);

  // Agrupamento de Equipes Dirigentes por Paróquia e suas 5 pastas
  const dirigentesByParish = useMemo(() => {
    const dirigenteItems = filteredItems.filter((i) => i.meta.category === 'equipe_dirigente');
    const unified = unifyLeadershipList(dirigenteItems);

    const parishMap: Record<string, { parishName: string; sectorName: string; folders: Record<string, UnifiedLeadership[]> }> = {};

    const parishOfficialFolders = [
      'Pasta Fichas',
      'Pasta Finanças',
      'Pasta Montagem',
      'Pasta Palestra',
      'Pasta Pós-Encontro',
      'Diretoria Espiritual',
      'Outras Funções',
    ];

    for (const row of unified) {
      const pName = row.parish || 'Paróquia não informada';
      if (!parishMap[pName]) {
        const sectorObj = DIOCESAN_SECTORS.find((s) => s.parishes.some((p) => p.name === pName || p.dbNames.includes(pName)));
        parishMap[pName] = {
          parishName: pName,
          sectorName: sectorObj ? `${sectorObj.name} (${sectorObj.roman})` : 'Setor Diocesano',
          folders: {},
        };
        for (const f of parishOfficialFolders) {
          parishMap[pName].folders[f] = [];
        }
      }

      if (!parishMap[pName].folders[row.folder]) {
        parishMap[pName].folders[row.folder] = [];
      }
      parishMap[pName].folders[row.folder].push(row);
    }

    return Object.values(parishMap).sort((a, b) => a.parishName.localeCompare(b.parishName));
  }, [filteredItems]);

  // Exclusão de mandato
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

  // Renderiza a Tabela Executiva de uma lista de lideranças
  function renderExecutiveTable(rows: UnifiedLeadership[]) {
    if (rows.length === 0) return null;

    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Função / Cargo</th>
              <th style={{ width: '38%' }}>Liderança Titular</th>
              <th style={{ width: '18%' }}>Paróquia de Origem</th>
              <th style={{ width: '10%' }}>Vigência</th>
              {viewer.role === 'admin' && <th style={{ width: '6%', textAlign: 'right' }}>Ação</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {/* Função */}
                <td>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    {row.role}
                  </strong>
                </td>

                {/* Liderança (Casal ou Jovem) */}
                <td>
                  {row.condition === 'Casal' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        className="badge badge-amber"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 7px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        <Heart size={13} weight="fill" />
                        Casal
                      </span>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <Link
                          href={`/pessoas/${row.person1.id}`}
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            textDecoration: 'none',
                            fontSize: '0.88rem',
                          }}
                          className="hover:underline"
                        >
                          {row.person1.name}
                        </Link>

                        {row.person2 && (
                          <>
                            <span style={{ color: 'var(--text-subtle)', fontWeight: 500 }}>&amp;</span>
                            <Link
                              href={`/pessoas/${row.person2.id}`}
                              style={{
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                fontSize: '0.88rem',
                              }}
                              className="hover:underline"
                            >
                              {row.person2.name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className="badge badge-blue"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 7px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        <User size={13} weight="bold" />
                        Jovem
                      </span>

                      <Link
                        href={`/pessoas/${row.person1.id}`}
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          textDecoration: 'none',
                          fontSize: '0.88rem',
                        }}
                        className="hover:underline"
                      >
                        {row.person1.name}
                      </Link>
                    </div>
                  )}
                </td>

                {/* Paróquia */}
                <td>
                  {row.parish ? (
                    <span
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-main)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Church size={14} color="var(--brand-primary)" />
                      {row.parish}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      Diocese de Anápolis
                    </span>
                  )}
                </td>

                {/* Período */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                      {row.status.displayPeriod}
                    </span>
                    {row.status.isActive && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#16a34a',
                          display: 'inline-block',
                        }}
                        title="Vigente / Ativo"
                      />
                    )}
                  </div>
                </td>

                {/* Ações (Admin) */}
                {viewer.role === 'admin' && (
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                      title="Excluir mandato"
                    >
                      <Trash size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Cabeçalho Oficial */}
      <PageHeading
        eyebrow="ORGANIZAÇÃO INSTITUCIONAL · DIOCESE DE ANÁPOLIS"
        title="Mandatos e Pastas Oficiais"
        description="Estrutura de liderança do Segue-me: Conselho Diocesano, Coordenações dos 6 Setores e Equipes Dirigentes Paroquiais."
        actions={
          viewer.role === 'admin' ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="button button-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              Cadastrar Novo Mandato
            </button>
          ) : undefined
        }
      />

      {/* BARRA UNIFICADA COM MENUS SUSPENSOS (DROPDOWNS) - LIMPA E COMPACTA */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Menu Suspenso 1: Instância / Órgão */}
        <div style={{ minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Instância:
          </label>
          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value as any);
              setParishFilter('all');
            }}
            className="filter-input"
            style={{ width: '100%', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', padding: '7px 10px' }}
          >
            <option value="diocesano">🏛️ Conselho Diocesano ({counts.diocesano})</option>
            <option value="setorial">🌐 Coordenações Setoriais ({counts.setorial})</option>
            <option value="equipe_dirigente">⛪ Equipes Dirigentes Paroquiais ({counts.equipe_dirigente})</option>
            <option value="all">📋 Todos os Mandatos ({counts.total})</option>
          </select>
        </div>

        {/* Menu Suspenso 2: Gestão / Ano */}
        <div style={{ minWidth: '170px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gestão / Ano:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="filter-input"
            style={{ width: '100%', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', padding: '7px 10px' }}
          >
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                📅 Gestão {y} {y === 2026 ? '(Atual)' : ''}
              </option>
            ))}
            <option value="all">📅 Histórico Completo</option>
          </select>
        </div>

        {/* Menu Suspenso 3: Condição (Casal / Jovem) */}
        <div style={{ minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Liderança:
          </label>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="filter-input"
            style={{ width: '100%', fontSize: '0.84rem', padding: '7px 10px' }}
          >
            <option value="all">👥 Casais e Jovens</option>
            <option value="Casal">💍 Apenas Casais</option>
            <option value="Jovem">⚡ Apenas Jovens</option>
          </select>
        </div>

        {/* Menu Suspenso 4: Setor (se aplicável) */}
        {(activeTab === 'setorial' || activeTab === 'equipe_dirigente') && (
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Setor:
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => {
                setSectorFilter(e.target.value);
                setParishFilter('all');
              }}
              className="filter-input"
              style={{ width: '100%', fontSize: '0.84rem', padding: '7px 10px' }}
            >
              <option value="all">🌐 Todos os 6 Setores</option>
              {DIOCESAN_SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.roman})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Menu Suspenso 5: Paróquia (se Equipe Dirigente) */}
        {activeTab === 'equipe_dirigente' && (
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Paróquia:
            </label>
            <select
              value={parishFilter}
              onChange={(e) => setParishFilter(e.target.value)}
              className="filter-input"
              style={{ width: '100%', fontSize: '0.84rem', padding: '7px 10px' }}
            >
              <option value="all">⛪ Todas as Paróquias ({sectorFilter === 'all' ? '43 Paróquias' : 'Do Setor'})</option>
              {(sectorFilter === 'all'
                ? DIOCESAN_SECTORS.flatMap((s) => s.parishes)
                : DIOCESAN_SECTORS.find((s) => s.id === sectorFilter)?.parishes || []
              ).map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campo de Busca Rápida */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Busca Rápida:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome da liderança, cargo..."
              className="filter-input"
              style={{ width: '100%', fontSize: '0.84rem', paddingLeft: '32px', paddingRight: searchQuery ? '30px' : '10px' }}
            />
            <MagnifyingGlass
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: TABELA EXECUTIVA DA NOMINATA OFICIAL */}
      {filteredItems.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 20px', background: '#fff' }}>
          <Scroll size={36} color="var(--text-subtle)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            Nenhum mandato encontrado
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Tente selecionar outro ano no menu de Gestão ou ajustar os filtros.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. ABA: CONSELHO DIOCESANO */}
          {activeTab === 'diocesano' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Buildings size={20} color="#b45309" weight="bold" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#78350f', fontFamily: 'var(--font-serif)' }}>
                    Conselho Diocesano {selectedYear !== 'all' ? `· Gestão ${selectedYear}` : ''}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  Nominata Oficial da Coordenação Diocesana
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {diocesanoFolders.map(([folderName, rows]) => (
                  <div
                    key={folderName}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-base)',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Header da Pasta */}
                    <div
                      style={{
                        padding: '10px 16px',
                        background: '#fafaf9',
                        borderBottom: '1px solid var(--border-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderSimple size={18} color="#b45309" weight="fill" />
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {folderName}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                        {rows.length} {rows.length === 1 ? 'liderança' : 'lideranças'}
                      </span>
                    </div>

                    {renderExecutiveTable(rows)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. ABA: COORDENAÇÕES SETORIAIS */}
          {activeTab === 'setorial' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GlobeHemisphereWest size={20} color="#1d4ed8" weight="bold" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e3a8a', fontFamily: 'var(--font-serif)' }}>
                    Coordenações Setoriais {selectedYear !== 'all' ? `· Gestão ${selectedYear}` : ''}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  Casais Setoriais e Jovens dos 6 Setores Diocesanos
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {setorialBySector.map(({ sector, leaderships }) => (
                  <div
                    key={sector.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid #bfdbfe',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(29, 78, 216, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 16px',
                        background: '#eff6ff',
                        borderBottom: '1px solid #dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.90rem', color: '#1e40af' }}>
                          {sector.name} ({sector.roman})
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#3b82f6', marginLeft: '8px' }}>
                          — {sector.region}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 600 }}>
                        {leaderships.length} {leaderships.length === 1 ? 'liderança' : 'lideranças'}
                      </span>
                    </div>

                    {renderExecutiveTable(leaderships)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ABA: EQUIPES DIRIGENTES PAROQUIAIS */}
          {activeTab === 'equipe_dirigente' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Church size={20} color="#15803d" weight="bold" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#14532d', fontFamily: 'var(--font-serif)' }}>
                    Equipes Dirigentes Paroquiais {selectedYear !== 'all' ? `· Gestão ${selectedYear}` : ''}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  As 5 Pastas Oficiais de cada Paróquia da Diocese
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dirigentesByParish.map(({ parishName, sectorName, folders }) => {
                  const allRows = Object.values(folders).flat();
                  if (allRows.length === 0) return null;

                  return (
                    <div
                      key={parishName}
                      style={{
                        background: '#ffffff',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-base)',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      {/* Topo da Paróquia */}
                      <div
                        style={{
                          padding: '10px 16px',
                          background: '#f8fafc',
                          borderBottom: '1px solid var(--border-base)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Church size={18} color="#15803d" weight="fill" />
                          <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                            {parishName}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: '#dbeafe',
                              color: '#1d4ed8',
                              fontWeight: 600,
                            }}
                          >
                            {sectorName}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                          {allRows.length} {allRows.length === 1 ? 'liderança' : 'lideranças'}
                        </span>
                      </div>

                      {renderExecutiveTable(allRows)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. ABA: TODOS OS MANDATOS */}
          {activeTab === 'all' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-base)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.90rem' }}>Lista Geral de Mandatos</strong>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                  Total: {filteredItems.length} registros
                </span>
              </div>

              {renderExecutiveTable(unifyLeadershipList(filteredItems))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Cadastro de Mandato (Apenas Admin) */}
      {viewer.role === 'admin' && (
        <ManageMandateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
