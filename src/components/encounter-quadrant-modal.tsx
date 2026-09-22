"use client";

import { useEffect, useState } from 'react';
import {
  CalendarBlank,
  CircleNotch,
  HandsClapping,
  Heart,
  MagnifyingGlass,
  MapPin,
  MicrophoneStage,
  Scroll,
  ShieldCheck,
  Sparkle,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import type { QuadrantData, QuadrantMember } from '@/app/api/encounters/[id]/public-quadrant/route';
import { Badge } from './ui';

interface EncounterQuadrantModalProps {
  encounterId: string;
  encounterTitle: string;
  onClose: () => void;
}

export function EncounterQuadrantModal({
  encounterId,
  encounterTitle,
  onClose,
}: EncounterQuadrantModalProps) {
  const [data, setData] = useState<QuadrantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'circles' | 'direction' | 'speakers' | 'teams'>('circles');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchQuadrant() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/encounters/${encounterId}/public-quadrant`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao carregar quadrante.');
        }
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Falha ao buscar dados.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchQuadrant();
    return () => {
      isMounted = false;
    };
  }, [encounterId]);

  // Fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = search.toLowerCase().trim();

  // Filtragem dos círculos
  const filteredCircles = data?.circles
    .map((c) => ({
      ...c,
      members: c.members.filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.patron && c.patron.toLowerCase().includes(q))
      ),
    }))
    .filter((c) => c.members.length > 0 || !q);

  // Filtragem dos dirigentes
  const filteredDirection = data?.direction.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  );

  // Filtragem dos palestrantes
  const filteredSpeakers = data?.speakers.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  );

  // Filtragem das equipes
  const filteredTeams = data?.teams
    .map((t) => ({
      ...t,
      members: t.members.filter(
        (m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      ),
    }))
    .filter((t) => t.members.length > 0 || !q);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1.5px solid var(--border-soft)',
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease-out',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1.5px solid var(--border-soft)',
            background: 'linear-gradient(135deg, rgba(163, 44, 45, 0.05) 0%, rgba(199, 137, 58, 0.05) 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <Badge variant="primary">Quadrante Histórico</Badge>
              {data?.encounter.edition && <Badge variant="neutral">{data.encounter.edition} Edição</Badge>}
              {data?.encounter.year && <Badge variant="neutral">{data.encounter.year}</Badge>}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {data?.encounter.name || encounterTitle}
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.35rem',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              {data?.encounter.parish && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={15} />
                  {data.encounter.parish} {data.encounter.city ? `· ${data.encounter.city}` : ''}
                </span>
              )}
              {data?.encounter.date_text && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CalendarBlank size={15} />
                  {data.encounter.date_text}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Fechar"
            style={{ borderRadius: '50%', padding: '6px', background: 'var(--bg-base)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* AVISO DE PRIVACIDADE E PROTEÇÃO DE DADOS */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            background: 'rgba(163, 44, 45, 0.04)',
            borderBottom: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={18} color="var(--brand-primary)" weight="fill" style={{ flexShrink: 0 }} />
          <span>
            Exibição comemorativa do encontro. Por respeito à privacidade dos participantes, são exibidos apenas <strong>nome e função</strong> exercida.
          </span>
        </div>

        {/* BUSCA E ABAS */}
        <div
          style={{
            padding: '1rem 1.5rem 0',
            borderBottom: '1.5px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass
              size={17}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Buscar pessoa ou equipe neste encontro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-soft)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('circles')}
              className={`button ${activeTab === 'circles' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.84rem', gap: '0.35rem' }}
            >
              <Sparkle size={16} />
              <span>Círculos de Vivência</span>
              {data?.circles && (
                <span style={{ opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>
                  ({data.circles.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('direction')}
              className={`button ${activeTab === 'direction' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.84rem', gap: '0.35rem' }}
            >
              <Scroll size={16} />
              <span>Equipe Dirigente</span>
              {data?.direction && (
                <span style={{ opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>
                  ({data.direction.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('speakers')}
              className={`button ${activeTab === 'speakers' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.84rem', gap: '0.35rem' }}
            >
              <MicrophoneStage size={16} />
              <span>Palestrantes</span>
              {data?.speakers && (
                <span style={{ opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>
                  ({data.speakers.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className={`button ${activeTab === 'teams' ? 'button-primary' : 'button-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.84rem', gap: '0.35rem' }}
            >
              <UsersThree size={16} />
              <span>Equipes de Trabalho</span>
              {data?.teams && (
                <span style={{ opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>
                  ({data.teams.length})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem' }}>
              <CircleNotch size={32} className="spin" color="var(--brand-primary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Carregando dados do quadrante...</span>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(211, 47, 47, 0.08)',
                border: '1.5px solid rgba(211, 47, 47, 0.3)',
                color: '#c62828',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{error}</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
                style={{ fontSize: '0.84rem' }}
              >
                Voltar
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* ABA 1: CÍRCULOS DE VIVÊNCIA */}
              {activeTab === 'circles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filteredCircles && filteredCircles.length > 0 ? (
                    filteredCircles.map((circle, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-soft)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-soft)',
                            paddingBottom: '0.6rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '1rem', color: 'var(--brand-primary)' }}>
                              Círculo {circle.name}
                            </strong>
                            {circle.patron && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                · Padroeiro(a): <strong>{circle.patron}</strong>
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {circle.members.length} {circle.members.length === 1 ? 'membro' : 'membros'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.6rem' }}>
                          {circle.members.map((member) => (
                            <div
                              key={member.id}
                              style={{
                                padding: '0.55rem 0.75rem',
                                background: 'var(--bg-surface)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                              }}
                            >
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {member.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {member.role || (member.kind === 'Vivenciou' ? 'Vivenciando' : 'Membro')}
                                </div>
                              </div>
                              <Badge variant={member.kind === 'Vivenciou' ? 'success' : member.condition === 'Casal' ? 'warning' : 'primary'}>
                                {member.kind === 'Vivenciou' ? 'Vivenciando' : member.condition === 'Casal' ? 'Casal' : 'Jovem'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Nenhum integrante ou círculo encontrado com o filtro aplicado.
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: EQUIPE DIRIGENTE */}
              {activeTab === 'direction' && (
                <div>
                  {filteredDirection && filteredDirection.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {filteredDirection.map((dir) => (
                        <div
                          key={dir.id}
                          style={{
                            padding: '0.85rem',
                            background: 'var(--bg-base)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-soft)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Badge variant={dir.condition === 'Casal' ? 'warning' : dir.condition === 'Padre' ? 'primary' : 'neutral'}>
                              {dir.condition || 'Dirigente'}
                            </Badge>
                          </div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{dir.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 500 }}>
                            {dir.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Nenhum dirigente encontrado com o filtro informado.
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: PALESTRANTES */}
              {activeTab === 'speakers' && (
                <div>
                  {filteredSpeakers && filteredSpeakers.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {filteredSpeakers.map((spk) => (
                        <div
                          key={spk.id}
                          style={{
                            padding: '0.85rem',
                            background: 'var(--bg-base)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-soft)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Badge variant="primary">{spk.condition || 'Palestrante'}</Badge>
                          </div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{spk.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {spk.role || 'Palestra / Testemunho'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Nenhum palestrante catalogado ou encontrado para este encontro.
                    </div>
                  )}
                </div>
              )}

              {/* ABA 4: EQUIPES DE TRABALHO */}
              {activeTab === 'teams' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filteredTeams && filteredTeams.length > 0 ? (
                    filteredTeams.map((team, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-soft)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-soft)',
                            paddingBottom: '0.6rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                            Equipe {team.name}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {team.members.length} {team.members.length === 1 ? 'voluntário' : 'voluntários'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.6rem' }}>
                          {team.members.map((member) => (
                            <div
                              key={member.id}
                              style={{
                                padding: '0.55rem 0.75rem',
                                background: 'var(--bg-surface)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                              }}
                            >
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {member.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {member.role || 'Membro'}
                                </div>
                              </div>
                              <Badge variant={member.condition === 'Casal' ? 'warning' : 'neutral'}>
                                {member.condition || 'Membro'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Nenhuma equipe de trabalho encontrada com o filtro informado.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1.5px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {data?.totalMembers ? `${data.totalMembers} participantes registrados no encontro` : ''}
          </span>
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            style={{ fontSize: '0.85rem' }}
          >
            Fechar Quadrante
          </button>
        </div>
      </div>
    </div>
  );
}
