"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MicrophoneStage,
  MagnifyingGlass,
  Plus,
  User,
  Heart,
  Church,
  CalendarBlank,
  ArrowRight,
  Phone,
  EnvelopeSimple,
  Chats,
  Funnel,
  Sparkle,
  Books
} from '@phosphor-icons/react';
import type { SpeakerCatalogItem } from '@/lib/data';
import type { Viewer } from '@/lib/types';
import { PageHeading, Avatar, number } from './ui';
import { ManageTalkModal } from './manage-talk-modal';
import { SpeakerDetailModal } from './speaker-detail-modal';
import { DIOCESAN_SECTORS } from '@/lib/sectors';

interface SpeakersViewProps {
  initialSpeakers: SpeakerCatalogItem[];
  viewer: Viewer;
}

export function SpeakersView({ initialSpeakers, viewer }: SpeakersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState('all');
  const [parishFilter, setParishFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPerson, setModalPerson] = useState<{ id: string; name: string; legacy_id?: string | null; parish?: string | null } | null>(null);

  const [detailSpeaker, setDetailSpeaker] = useState<SpeakerCatalogItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Lista única de temas para o filtro
  const allThemes = useMemo(() => {
    const set = new Set<string>();
    for (const s of initialSpeakers) {
      for (const t of s.themes) {
        if (t && t.length > 2) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [initialSpeakers]);

  // Lista de anos para o filtro
  const allYears = useMemo(() => {
    const set = new Set<number>();
    for (const s of initialSpeakers) {
      for (const y of s.years) {
        if (y) set.add(y);
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [initialSpeakers]);

  // Contagens
  const totalTalksCount = useMemo(() => {
    return initialSpeakers.reduce((acc, s) => acc + s.totalTalks, 0);
  }, [initialSpeakers]);

  const uniqueParishesCount = useMemo(() => {
    const pSet = new Set<string>();
    for (const s of initialSpeakers) {
      for (const p of s.parishes) if (p) pSet.add(p);
    }
    return pSet.size;
  }, [initialSpeakers]);

  // Filtragem
  const filteredSpeakers = useMemo(() => {
    return initialSpeakers.filter((s) => {
      // 1. Busca por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.person.name.toLowerCase().includes(q);
        const matchesCode = (s.person.legacy_id || '').toLowerCase().includes(q);
        const matchesParish = (s.person.parish || '').toLowerCase().includes(q);
        const matchesTheme = s.themes.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesParish && !matchesTheme) return false;
      }

      // 2. Tema
      if (themeFilter !== 'all') {
        const tLower = themeFilter.toLowerCase();
        if (!s.themes.some((t) => t.toLowerCase().includes(tLower))) return false;
      }

      // 3. Paróquia
      if (parishFilter !== 'all') {
        const pLower = parishFilter.toLowerCase();
        const inPerson = (s.person.parish || '').toLowerCase().includes(pLower);
        const inTalks = s.parishes.some((p) => p.toLowerCase().includes(pLower));
        if (!inPerson && !inTalks) return false;
      }

      // 4. Condição
      if (conditionFilter !== 'all' && s.condition !== conditionFilter) return false;

      // 5. Ano
      if (yearFilter !== 'all') {
        const yNum = Number(yearFilter);
        if (!s.years.includes(yNum)) return false;
      }

      return true;
    });
  }, [initialSpeakers, searchQuery, themeFilter, parishFilter, conditionFilter, yearFilter]);

  const handleOpenNewTalk = (person?: typeof modalPerson) => {
    setModalPerson(person || null);
    setIsModalOpen(true);
  };

  return (
    <div className="page-enter">
      {/* Cabeçalho */}
      <PageHeading
        eyebrow="FORMAÇÃO & TESTEMUNHO · DIOCESE DE ANÁPOLIS"
        title="Palestrantes do Segue-me"
        description="Catálogo diocesano de pregadores, jovens e casais que já ministraram palestras nos encontros do Segue-me."
        actions={
          <button
            type="button"
            onClick={() => handleOpenNewTalk()}
            className="button button-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            Registrar Palestra Ministrada
          </button>
        }
      />

      {/* Cards de Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        <div className="stat-card stat-primary">
          <div className="stat-top">
            <span>Palestrantes Catalogados</span>
            <MicrophoneStage size={20} />
          </div>
          <strong className="stat-number">{number(initialSpeakers.length)}</strong>
          <div className="stat-bottom">
            <span>Pregadores cadastrados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total de Palestras</span>
            <Books size={20} color="#b45309" />
          </div>
          <strong className="stat-number" style={{ color: '#92400e' }}>
            {number(totalTalksCount)}
          </strong>
          <div className="stat-bottom">
            <span>Palestras documentadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Temas Mapeados</span>
            <Sparkle size={20} color="#1d4ed8" />
          </div>
          <strong className="stat-number" style={{ color: '#1d4ed8' }}>
            {number(allThemes.length)}
          </strong>
          <div className="stat-bottom">
            <span>Temas do Segue-me</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Paróquias Atendidas</span>
            <Church size={20} color="#15803d" />
          </div>
          <strong className="stat-number" style={{ color: '#15803d' }}>
            {number(uniqueParishesCount)}
          </strong>
          <div className="stat-bottom">
            <span>Comunidades da diocese</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Funnel size={16} />
          <span>Filtros:</span>
        </div>

        {/* Busca */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do palestrante, código ou tema..."
            className="filter-input"
            style={{ width: '100%', fontSize: '0.82rem', paddingLeft: '32px' }}
          />
          <MagnifyingGlass
            size={16}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
          />
        </div>

        {/* Filtro de Tema */}
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem', maxWidth: '220px' }}
        >
          <option value="all">🎤 Todos os Temas</option>
          {allThemes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Filtro de Paróquia */}
        <select
          value={parishFilter}
          onChange={(e) => setParishFilter(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem', maxWidth: '200px' }}
        >
          <option value="all">⛪ Todas as Paróquias</option>
          {DIOCESAN_SECTORS.flatMap((s) => s.parishes).map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Filtro de Condição */}
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem' }}
        >
          <option value="all">👥 Todos (Jovem / Casal)</option>
          <option value="Casal">💍 Apenas Casais</option>
          <option value="Jovem">⚡ Apenas Jovens</option>
        </select>

        {/* Filtro de Ano */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="filter-input"
          style={{ fontSize: '0.82rem' }}
        >
          <option value="all">📅 Todos os Anos</option>
          {allYears.map((y) => (
            <option key={y} value={y}>
              Ano {y}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de Palestrantes */}
      {filteredSpeakers.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px', background: '#fff' }}>
          <MicrophoneStage size={44} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>
            Nenhum palestrante encontrado
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '440px', margin: '0 auto 16px' }}>
            Nenhum registro corresponde aos filtros selecionados. Tente ajustar o tema ou o termo de busca.
          </p>
          <button
            type="button"
            onClick={() => handleOpenNewTalk()}
            className="button button-primary"
            style={{ margin: '0 auto' }}
          >
            Registrar Primeira Palestra
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredSpeakers.map((speaker) => {
            const isCasal = speaker.condition === 'Casal';
            const person = speaker.person;
            const phoneDigits = (person.phone || '').replace(/\D/g, '');
            const whatsappUrl = phoneDigits.length >= 10 ? `https://wa.me/55${phoneDigits}` : null;

            return (
              <div
                key={person.id}
                className="panel"
                onClick={() => {
                  setDetailSpeaker(speaker);
                  setIsDetailModalOpen(true);
                }}
                style={{
                  borderLeft: isCasal ? '4px solid #d97706' : '4px solid #2563eb',
                  background: '#ffffff',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease-in-out',
                  minHeight: '142px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
              >
                <div>
                  {/* Topo do Card: Avatar, Nome e Tag */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <Avatar name={person.name} src={person.photo_url} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.96rem',
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                        >
                          {person.name}
                        </span>

                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: isCasal ? '#fef3c7' : '#eff6ff',
                            color: isCasal ? '#92400e' : '#1d4ed8',
                            border: isCasal ? '1px solid #fde68a' : '1px solid #bfdbfe',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {isCasal ? '💍 Casal' : '⚡ Jovem'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {person.legacy_id && (
                          <span style={{ fontSize: '0.70rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                            {person.legacy_id}
                          </span>
                        )}
                        {person.parish && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            &bull; {person.parish}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Telefone e Contato Direto */}
                  {person.phone ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        background: '#f0fdf4',
                        border: '1px solid #dcfce7',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        marginBottom: '6px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                        <Phone size={13} weight="fill" />
                        <a href={`tel:${person.phone}`} style={{ color: '#166534', textDecoration: 'none' }}>
                          {person.phone}
                        </a>
                      </div>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Conversar no WhatsApp"
                          style={{
                            color: '#15803d',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px',
                          }}
                        >
                          <Chats size={15} weight="fill" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontStyle: 'italic', marginBottom: '8px' }}>
                      Telefone não informado
                    </div>
                  )}
                </div>

                {/* Rodapé do Card: Quantidade de Palestras e Botão Abrir */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '10px',
                    marginTop: '4px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--brand-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MicrophoneStage size={13} />
                    {speaker.totalTalks} {speaker.totalTalks === 1 ? 'palestra' : 'palestras'}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailSpeaker(speaker);
                        setIsDetailModalOpen(true);
                      }}
                      className="button button-primary"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Abrir
                      <ArrowRight size={11} />
                    </button>

                    <Link
                      href={`/pessoas/${person.id}`}
                      className="button button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.74rem', textDecoration: 'none' }}
                      title="Ver Ficha Completa"
                    >
                      Ficha
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes Completos do Palestrante */}
      <SpeakerDetailModal
        speaker={detailSpeaker}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAddTalk={(person) => handleOpenNewTalk(person)}
      />

      {/* Modal para Cadastro de Palestra */}
      <ManageTalkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPerson={modalPerson}
      />
    </div>
  );
}
