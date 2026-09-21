"use client";

import { useMemo, useState } from 'react';
import {
  CalendarBlank,
  MapPin,
  UsersThree,
  User,
  Heart,
  Briefcase,
  HandHeart,
  IdentificationCard,
  EnvelopeSimple,
  Phone,
  Sparkle,
  CheckCircle,
  Tag,
  Funnel,
  CaretRight,
  Buildings,
} from '@phosphor-icons/react';
import type { CoupleInfo, Mandate, Participation, Person } from '@/lib/types';
import { Avatar, Badge } from '@/components/ui';
import { isMandateRecord, isExternalImplantation, normalizeMandateBody } from '@/lib/encounter-config';

interface MyHistoryViewProps {
  person: Person;
  participations: Participation[];
  mandates: Mandate[];
  couple: CoupleInfo | null;
}

type TabType = 'all' | 'vivenciou' | 'trabalhou' | 'mandatos';
type ConditionFilter = 'all' | 'Jovem' | 'Casal';

export function MyHistoryView({
  person,
  participations,
  mandates,
  couple,
}: MyHistoryViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');

  // Contagens
  const vivencias = useMemo(
    () => participations.filter((p) => p.kind === 'Vivenciou'),
    [participations]
  );
  const trabalhos = useMemo(
    () => participations.filter((p) => p.kind === 'Trabalhou' && !isMandateRecord(p)),
    [participations]
  );
  const mandateParticipations = useMemo(
    () => participations.filter((p) => isMandateRecord(p)),
    [participations]
  );

  // Consolidação inteligente e unificada de todos os mandatos (tabela mandates e quadrantes)
  // 1. Mesmo ano + mesma função: vira 1 único bloco consolidando as anotações
  // 2. Anos consecutivos na mesma função (mandato bienal contínuo): une no mesmo bloco com período (ex: Mandato 2025 – 2026)
  // 3. Outros anos / mandatos distintos: aparecem como blocos separados identificando o respectivo mandato
  const consolidatedMandates = useMemo(() => {
    const rawCandidates: Mandate[] = [];

    // Candidatos da tabela de mandatos
    for (const m of mandates) {
      const meta = normalizeMandateBody(m.body, m.role);
      rawCandidates.push({
        ...m,
        body: meta?.normalizedBody || m.body || 'Conselho Diocesano',
        role: m.role || 'Membro do Mandato',
        start_year: m.start_year || null,
        end_year: m.end_year || m.start_year || null,
      });
    }

    // Candidatos de participações em quadrantes
    for (const p of mandateParticipations) {
      const meta = normalizeMandateBody(p.team, p.role);
      const year = p.encounter?.year || null;
      rawCandidates.push({
        id: `mand-part-${p.id}`,
        person_id: p.person_id,
        body: meta?.normalizedBody || p.team || (p.role?.toLowerCase().includes('conselho') ? 'Conselho Diocesano' : 'Equipe Dirigente'),
        role: p.role || 'Membro do Mandato',
        condition: p.condition || 'Jovem',
        start_year: year,
        end_year: year,
        record_type: 'Mandato (Quadrante)',
        notes: p.encounter?.name ? `Documentado no encontro ${p.encounter.name} (${year})` : null,
        status: (year && year >= new Date().getFullYear()) ? 'Ativo' : 'Concluído',
      });
    }

    // Ordena do ano mais recente para o mais antigo
    rawCandidates.sort((a, b) => (b.start_year || 0) - (a.start_year || 0));

    const result: Mandate[] = [];
    for (const c of rawCandidates) {
      const cBody = (c.body || '').trim().toLowerCase();
      const cRole = (c.role || '').trim().toLowerCase();
      const startY = c.start_year || 0;
      const endY = c.end_year || startY;

      const existing = result.find((item) => {
        const itemBody = (item.body || '').trim().toLowerCase();
        const itemRole = (item.role || '').trim().toLowerCase();
        if (itemBody !== cBody || itemRole !== cRole) return false;

        const itemStart = item.start_year || 0;
        const itemEnd = item.end_year || itemStart;

        // Mesmo ano ou sobreposição
        if (startY === itemStart || (startY >= itemStart && startY <= itemEnd)) return true;
        // Anos adjacentes (consecutivos de mandato bienal, ex: 2025 e 2026)
        if (Math.abs(startY - itemEnd) <= 1 || Math.abs(endY - itemStart) <= 1) return true;

        return false;
      });

      if (existing) {
        existing.start_year = Math.min(existing.start_year || startY, startY);
        existing.end_year = Math.max(existing.end_year || endY, endY);
        if (c.condition?.toLowerCase().includes('casal')) {
          existing.condition = 'Casal';
        }
        if (c.notes && !existing.notes?.includes(c.notes)) {
          existing.notes = existing.notes ? `${existing.notes} • ${c.notes}` : c.notes;
        }
      } else {
        result.push({ ...c, start_year: startY, end_year: endY });
      }
    }

    return result;
  }, [mandates, mandateParticipations]);

  const totalMandatesCount = useMemo(() => {
    return consolidatedMandates.length;
  }, [consolidatedMandates]);

  const totalJovem = useMemo(() => {
    const partJovem = vivencias.filter((p) => p.condition?.toLowerCase().includes('jovem')).length +
                      trabalhos.filter((p) => p.condition?.toLowerCase().includes('jovem')).length;
    const mandJovem = consolidatedMandates.filter((m) =>
      m.condition?.toLowerCase().includes('jovem')
    ).length;
    return partJovem + mandJovem;
  }, [vivencias, trabalhos, consolidatedMandates]);

  const totalCasal = useMemo(() => {
    const partCasal = vivencias.filter((p) => p.condition?.toLowerCase().includes('casal')).length +
                      trabalhos.filter((p) => p.condition?.toLowerCase().includes('casal')).length;
    const mandCasal = consolidatedMandates.filter((m) =>
      m.condition?.toLowerCase().includes('casal')
    ).length;
    return partCasal + mandCasal;
  }, [vivencias, trabalhos, consolidatedMandates]);

  // Lista unificada filtrada
  const filteredTimeline = useMemo(() => {
    type TimelineItem =
      | { type: 'participation'; data: Participation; year: number }
      | { type: 'mandate'; data: Mandate; year: number };

    const list: TimelineItem[] = [];

    if (activeTab === 'all' || activeTab === 'vivenciou') {
      for (const p of vivencias) {
        list.push({
          type: 'participation',
          data: p,
          year: p.encounter?.year || 0,
        });
      }
    }

    if (activeTab === 'all' || activeTab === 'trabalhou') {
      for (const p of trabalhos) {
        list.push({
          type: 'participation',
          data: p,
          year: p.encounter?.year || 0,
        });
      }
    }

    if (activeTab === 'all' || activeTab === 'mandatos') {
      for (const m of consolidatedMandates) {
        list.push({
          type: 'mandate',
          data: m,
          year: m.start_year || 0,
        });
      }
    }

    // Filtro por Condição (Jovem / Casal)
    let filtered = list;
    if (conditionFilter !== 'all') {
      filtered = list.filter((item) => {
        const cond =
          item.type === 'participation'
            ? item.data.condition
            : item.data.condition;
        return cond?.toLowerCase().includes(conditionFilter.toLowerCase());
      });
    }

    // Ordenação decrescente por ano
    return filtered.sort((a, b) => b.year - a.year);
  }, [activeTab, conditionFilter, vivencias, trabalhos, consolidatedMandates]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Card de Cônjuge (SE FOR CASAL / couple informado) */}
      {couple && (
        <section
          className="panel"
          style={{
            border: '2px solid var(--brand-border)',
            background: 'linear-gradient(135deg, #fffdf8 0%, #fff 100%)',
            boxShadow: '0 4px 16px rgba(180, 83, 9, 0.08)',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--brand-light)',
                  border: '1.5px solid var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary)',
                }}
              >
                <Heart size={20} weight="fill" />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--brand-primary)',
                    textTransform: 'uppercase',
                  }}
                >
                  CAMINHADA EM CASAL
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.35rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.15,
                  }}
                >
                  Informações do Cônjuge
                </h2>
              </div>
            </div>

            <span
              className="badge badge-amber"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <Heart size={14} weight="fill" />
              Casal Seguidor
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <Avatar name={couple.spouse.name} src={couple.spouse.photo_url} large />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
                  {couple.spouse.name}
                </strong>
                {couple.start_text && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                    · {couple.start_text}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px 20px',
                  marginTop: '10px',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="var(--brand-primary)" />
                  <span>{couple.spouse.parish || person.parish || 'Paróquia não informada'}</span>
                </div>

                {couple.spouse.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <EnvelopeSimple size={15} />
                    <span>{couple.spouse.email}</span>
                  </div>
                )}

                {couple.spouse.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={15} />
                    <span>{couple.spouse.phone}</span>
                  </div>
                )}
              </div>

              {couple.notes && (
                <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                  {couple.notes}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-light)',
              border: '1px solid var(--brand-border)',
              fontSize: '0.8rem',
              color: 'var(--brand-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkle size={16} weight="fill" color="var(--brand-primary)" />
            <span>
              Vocês possuem caminhada pastoral conjunta no movimento. As vivências e equipes trabalhadas em casal constam abaixo.
            </span>
          </div>
        </section>
      )}

      {/* 2. Resumo Numérico das Participações */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            borderLeft: '4px solid var(--brand-gold)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
            Vivenciou
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
            {vivencias.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {vivencias.length === 1 ? 'Encontro vivenciado' : 'Encontros vivenciados'}
          </span>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            borderLeft: '4px solid var(--brand-primary)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
            Trabalhou
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
            {trabalhos.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {trabalhos.length === 1 ? 'Equipe de trabalho' : 'Equipes de trabalho'}
          </span>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            borderLeft: '4px solid var(--brand-staff)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
            Mandatos
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
            {totalMandatesCount}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {totalMandatesCount === 1 ? 'Coordenação / conselho' : 'Coordenações / conselhos'}
          </span>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            borderLeft: '4px solid #0284c7',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
            Fases de Serviço
          </span>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            {totalJovem > 0 && (
              <span className="badge badge-neutral" style={{ fontSize: '0.74rem' }}>
                <User size={12} /> {totalJovem} Jovem
              </span>
            )}
            {totalCasal > 0 && (
              <span className="badge badge-amber" style={{ fontSize: '0.74rem' }}>
                <Heart size={12} weight="fill" /> {totalCasal} Casal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Abas de Tipo e Filtro de Condição */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Abas Principais */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`button ${activeTab === 'all' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              Toda a Trajetória ({vivencias.length + trabalhos.length + totalMandatesCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vivenciou')}
              className={`button ${activeTab === 'vivenciou' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              <CalendarBlank size={16} />
              Vivenciou ({vivencias.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trabalhou')}
              className={`button ${activeTab === 'trabalhou' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              <HandHeart size={16} />
              Trabalhou & Equipes ({trabalhos.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mandatos')}
              className={`button ${activeTab === 'mandatos' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              <Briefcase size={16} />
              Mandatos ({totalMandatesCount})
            </button>
          </div>

          {/* Filtro por Condição (Jovem / Casal) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Fase:
            </span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as ConditionFilter)}
              className="filter-input"
              style={{ padding: '6px 10px', fontSize: '0.82rem' }}
            >
              <option value="all">Todas as fases</option>
              <option value="Jovem">Enquanto Jovem</option>
              <option value="Casal">Enquanto Casal</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Linha do Tempo / Itens da Trajetória */}
      <section className="panel">
        <div className="panel-heading" style={{ marginBottom: '20px' }}>
          <div>
            <span className="section-kicker">HISTÓRICO REGISTRADO</span>
            <h2>
              {activeTab === 'vivenciou'
                ? 'Encontros que Vivenciou'
                : activeTab === 'trabalhou'
                ? 'Encontros que Trabalhou e Equipes'
                : activeTab === 'mandatos'
                ? 'Mandatos e Coordenações'
                : 'Sua Trajetória Completa'}
              {' '}({filteredTimeline.length})
            </h2>
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UsersThree size={36} color="var(--text-subtle)" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              Nenhum registro encontrado para o filtro selecionado.
            </p>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
              Tente alterar os filtros de tipo ou fase (Jovem / Casal) acima.
            </span>
          </div>
        ) : (
          <div className="timeline">
            {filteredTimeline.map((item, index) => {
              if (item.type === 'participation') {
                const part = item.data;
                const isVivencia = part.kind === 'Vivenciou';
                const isCasal = part.condition?.toLowerCase().includes('casal');

                return (
                  <div key={part.id || index} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={{
                        borderColor: isVivencia ? 'var(--brand-gold)' : 'var(--brand-primary)',
                        background: isVivencia ? '#fff' : 'var(--brand-primary)',
                      }}
                    />
                    <div
                      className="timeline-card"
                      style={{
                        borderLeft: `4px solid ${
                          isVivencia ? 'var(--brand-gold)' : isCasal ? 'var(--brand-staff)' : 'var(--brand-primary)'
                        }`,
                      }}
                    >
                      {/* Topo do Card */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            {/* Badge do Tipo / Missão */}
                            {isExternalImplantation(part.encounter) && !isVivencia ? (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  background: '#cffafe',
                                  color: '#0e7490',
                                  border: '1px solid #a5f3fc',
                                }}
                              >
                                🌐 Missão de Implantação Externa
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  background: isVivencia ? 'var(--brand-light)' : 'var(--bg-subtle)',
                                  color: isVivencia ? 'var(--brand-primary)' : 'var(--text-main)',
                                  border: `1px solid ${isVivencia ? 'var(--brand-border)' : 'var(--border-light)'}`,
                                }}
                              >
                                {isVivencia ? '★ Vivenciou o Encontro' : '⚙ Equipe de Trabalho'}
                              </span>
                            )}

                            {isVivencia && part.is_external_seed && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                }}
                              >
                                🌱 Remessa de Implantação
                              </span>
                            )}

                            {/* Badge da Condição: Jovem ou Casal */}
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: isCasal ? '#fef3c7' : '#e0f2fe',
                                color: isCasal ? '#92400e' : '#0369a1',
                                border: `1px solid ${isCasal ? '#fde68a' : '#bae6fd'}`,
                              }}
                            >
                              {isCasal ? (
                                <>
                                  <Heart size={12} weight="fill" /> Enquanto Casal
                                </>
                              ) : (
                                <>
                                  <User size={12} /> Enquanto Jovem
                                </>
                              )}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontFamily: 'var(--font-serif)',
                              fontSize: '1.25rem',
                              color: 'var(--text-main)',
                              margin: 0,
                            }}
                          >
                            {part.encounter?.name || `${part.encounter?.edition} Encontro Segue-me`}
                          </h3>
                        </div>

                        {part.encounter?.year && (
                          <span
                            className="badge badge-neutral"
                            style={{
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              padding: '4px 10px',
                            }}
                          >
                            {part.encounter.year}
                          </span>
                        )}
                      </div>

                      {/* Conteúdo Específico: Equipe, Função, Círculo */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: '8px 14px',
                          background: 'var(--bg-canvas)',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.84rem',
                          marginBottom: '10px',
                        }}
                      >
                        {!isVivencia && part.team && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Equipe de Trabalho
                            </span>
                            <strong style={{ color: 'var(--brand-primary)', fontSize: '0.92rem' }}>
                              {part.team}
                            </strong>
                          </div>
                        )}

                        {part.role && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Função / Cargo
                            </span>
                            <strong style={{ color: 'var(--text-main)' }}>
                              {part.role}
                            </strong>
                          </div>
                        )}

                        {part.circle && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Círculo
                            </span>
                            <strong>{part.circle}</strong>
                          </div>
                        )}

                        {part.patron && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Padroeiro
                            </span>
                            <span>{part.patron}</span>
                          </div>
                        )}
                      </div>

                      {/* Informações da Diocese, Paróquia e Cidade */}
                      {part.encounter?.target_diocese && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: '#0e7490',
                            fontWeight: 600,
                            marginBottom: '3px',
                          }}
                        >
                          <Buildings size={14} color="#0891b2" />
                          <span>Diocese: {part.encounter.target_diocese}</span>
                        </div>
                      )}

                      {part.encounter?.parish && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: 'var(--text-subtle)',
                          }}
                        >
                          <MapPin size={14} color="var(--brand-primary)" />
                          <span>
                            {part.encounter.parish}
                            {part.encounter.city ? ` · ${part.encounter.city}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Nota de Atuação em Casal se aplicável */}
                      {isCasal && couple?.spouse && (
                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px dashed var(--border-light)',
                            fontSize: '0.76rem',
                            color: 'var(--brand-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Heart size={13} weight="fill" />
                          <span>
                            Atuação em casal com {couple.spouse.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Renderização de MANDATO
              const mandate = item.data;
              const isCasal = mandate.condition?.toLowerCase().includes('casal');

              return (
                <div key={mandate.id || index} className="timeline-item">
                  <div
                    className="timeline-dot"
                    style={{
                      borderColor: 'var(--brand-staff)',
                      background: 'var(--brand-staff)',
                    }}
                  />
                  <div
                    className="timeline-card"
                    style={{
                      borderLeft: '4px solid var(--brand-staff)',
                      background: '#fffcf9',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: '#fef3c7',
                              color: '#894a29',
                              border: '1px solid #fde68a',
                            }}
                          >
                            🏛 Mandato & Coordenação
                          </span>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isCasal ? '#fef3c7' : '#e0f2fe',
                              color: isCasal ? '#92400e' : '#0369a1',
                              border: `1px solid ${isCasal ? '#fde68a' : '#bae6fd'}`,
                            }}
                          >
                            {isCasal ? (
                              <>
                                <Heart size={12} weight="fill" /> Enquanto Casal
                              </>
                            ) : (
                              <>
                                <User size={12} /> Enquanto Jovem
                              </>
                            )}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.25rem',
                            color: 'var(--text-main)',
                            margin: 0,
                          }}
                        >
                          {mandate.body}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span
                          className="badge badge-amber"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            padding: '4px 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>🏛️</span>
                          <span>
                            {mandate.start_year
                              ? `Mandato ${mandate.start_year}${mandate.end_year && mandate.end_year !== mandate.start_year ? ` – ${mandate.end_year}` : ''}`
                              : 'Mandato'}
                          </span>
                        </span>

                        <span
                          style={{
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: (mandate.end_year || mandate.start_year || 0) >= new Date().getFullYear() ? '#dcfce7' : '#f4f4f5',
                            color: (mandate.end_year || mandate.start_year || 0) >= new Date().getFullYear() ? '#15803d' : '#52525b',
                            border: `1px solid ${(mandate.end_year || mandate.start_year || 0) >= new Date().getFullYear() ? '#bbf7d0' : '#e4e4e7'}`,
                          }}
                        >
                          {(mandate.end_year || mandate.start_year || 0) >= new Date().getFullYear() ? 'Vigente (Ativo)' : 'Mandato Concluído'}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--bg-canvas)',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.84rem',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Cargo Desempenhado
                      </span>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--brand-primary)' }}>
                        {mandate.role}
                      </strong>

                      {mandate.record_type && (
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Tipo: {mandate.record_type}
                        </span>
                      )}
                    </div>

                    {mandate.notes && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                        {mandate.notes}
                      </p>
                    )}

                    {isCasal && couple?.spouse && (
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px dashed var(--border-light)',
                          fontSize: '0.76rem',
                          color: 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Heart size={13} weight="fill" />
                        <span>
                          Mandato desempenhado em casal com {couple.spouse.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
