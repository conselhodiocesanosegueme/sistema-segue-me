"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  MicrophoneStage,
  Phone,
  WhatsappLogo,
  EnvelopeSimple,
  Church,
  CalendarBlank,
  User,
  Heart,
  SuitcaseSimple,
  ArrowRight,
  Plus,
  Books,
  Sparkle,
  MapPin,
  CheckCircle,
  FileText
} from '@phosphor-icons/react';
import type { SpeakerCatalogItem } from '@/lib/data';
import { Avatar } from './ui';

interface SpeakerDetailModalProps {
  speaker: SpeakerCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddTalk: (person: { id: string; name: string; legacy_id?: string | null; parish?: string | null }) => void;
}

interface OtherParticipations {
  vivenciou: Array<{
    id: string;
    encounter_name: string;
    encounter_edition?: number | null;
    year?: number | null;
    parish?: string | null;
    circle?: string | null;
    patron?: string | null;
  }>;
  worked: Array<{
    id: string;
    team: string;
    role?: string | null;
    encounter_name: string;
    encounter_edition?: number | null;
    year?: number | null;
    parish?: string | null;
  }>;
  totalWorked: number;
}

export function SpeakerDetailModal({ speaker, isOpen, onClose, onAddTalk }: SpeakerDetailModalProps) {
  const [participations, setParticipations] = useState<OtherParticipations | null>(null);
  const [isLoadingParticipations, setIsLoadingParticipations] = useState(false);

  useEffect(() => {
    if (!isOpen || !speaker) {
      setParticipations(null);
      return;
    }

    let isMounted = true;
    setIsLoadingParticipations(true);

    fetch(`/api/people/${speaker.person.id}/participations`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success) {
          setParticipations({
            vivenciou: data.vivenciou || [],
            worked: data.worked || [],
            totalWorked: data.totalWorked || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingParticipations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, speaker]);

  const { person, condition, totalTalks, themes, years, parishes, talks } = speaker || {
    person: { id: '', name: '', legacy_id: null, phone: null, email: null, parish: null },
    condition: 'Jovem',
    totalTalks: 0,
    themes: [],
    years: [],
    parishes: [],
    talks: [],
  };

  // Ordena sempre do mais recente para o mais antigo (2026 -> 2011)
  const sortedTalks = useMemo(() => {
    return [...talks].sort((a, b) => (b.encounter_year || 0) - (a.encounter_year || 0));
  }, [talks]);

  const sortedYears = useMemo(() => {
    return [...years].sort((a, b) => b - a);
  }, [years]);

  if (!isOpen || !speaker) return null;

  const isCasal = condition === 'Casal';

  // Formata telefone para WhatsApp (apenas dígitos)
  const phoneDigits = (person.phone || '').replace(/\D/g, '');
  const whatsappUrl = phoneDigits.length >= 10 ? `https://wa.me/55${phoneDigits}` : null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Topo do Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            background: isCasal ? 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
            <Avatar name={person.name} src={person.photo_url} large />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.28rem',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 700,
                  }}
                >
                  {person.name}
                </h3>

                <span
                  style={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isCasal ? '#fef3c7' : '#dbeafe',
                    color: isCasal ? '#92400e' : '#1e40af',
                    border: isCasal ? '1px solid #fde68a' : '1px solid #bfdbfe',
                  }}
                >
                  {isCasal ? '💍 Casal' : '⚡ Jovem'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                {person.legacy_id && (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    {person.legacy_id}
                  </span>
                )}
                {person.parish && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Church size={13} color="var(--brand-primary)" />
                    {person.parish}
                  </span>
                )}
              </div>

              {/* Botões de Contato Direto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {person.phone && (
                  <>
                    <a
                      href={`tel:${person.phone}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: '#166534',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      <Phone size={13} weight="fill" />
                      {person.phone}
                    </a>

                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          background: '#16a34a',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                        }}
                      >
                        <WhatsappLogo size={14} weight="fill" />
                        Conversar no WhatsApp
                      </a>
                    )}
                  </>
                )}

                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      background: '#f8fafc',
                      border: '1px solid var(--border-base)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <EnvelopeSimple size={13} />
                    {person.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Métricas Rápidas do Palestrante */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block' }}>
                Total de Palestras
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                {totalTalks}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block' }}>
                Temas Distintos
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#1d4ed8', fontWeight: 700 }}>
                {themes.length}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block' }}>
                Anos em Atuação
              </span>
              <strong style={{ fontSize: '0.90rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginTop: '4px' }}>
                {sortedYears.length > 0 ? `${sortedYears[0]} a ${sortedYears[sortedYears.length - 1]}` : 'N/A'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block' }}>
                Paróquias Atendidas
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#15803d', fontWeight: 700 }}>
                {parishes.length}
              </strong>
            </div>
          </div>

          {/* 1. Temas Ministrados */}
          <div style={{ marginBottom: '22px' }}>
            <h4
              style={{
                fontSize: '0.86rem',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkle size={15} color="var(--brand-primary)" />
              Temas Ministrados no Segue-me
            </h4>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {themes.map((theme, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <MicrophoneStage size={14} />
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Histórico Completo de Palestras */}
          <div style={{ marginBottom: '22px' }}>
            <h4
              style={{
                fontSize: '0.86rem',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Books size={15} color="#b45309" />
              Histórico de Palestras Documentadas ({talks.length})
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px',
                background: '#fafaf9',
              }}
            >
              {sortedTalks.map((talk) => (
                <div
                  key={talk.id}
                  style={{
                    background: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>
                      {talk.theme}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      {talk.encounter_title || 'Encontro Segue-me'}
                      {talk.parish ? ` · ${talk.parish}` : ''}
                    </span>
                    {talk.notes && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>
                        {talk.notes}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--text-subtle)',
                      background: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {talk.encounter_year || 'Ano N/I'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Vínculo com Outras Participações & Trajetória Diocesana */}
          <div
            style={{
              border: '1px solid #bfdbfe',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} weight="fill" color="#2563eb" />
                Histórico & Trajetória no Segue-me
              </span>

              <Link
                href={`/pessoas/${person.id}`}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Abrir Ficha Completa
                <ArrowRight size={12} />
              </Link>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Este palestrante é um membro com ficha cadastral na base diocesana. Veja um resumo de suas outras atuações no movimento:
            </p>

            {isLoadingParticipations ? (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                Carregando histórico de participações...
              </div>
            ) : participations ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                {/* Vivenciou */}
                {participations.vivenciou.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                    <Heart size={14} weight="fill" color="#dc2626" />
                    <span>
                      <strong>Vivenciou:</strong>{' '}
                      {participations.vivenciou[0].encounter_name}
                      {participations.vivenciou[0].year ? ` (${participations.vivenciou[0].year})` : ''}
                      {participations.vivenciou[0].circle ? ` - Círculo: ${participations.vivenciou[0].circle}` : ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                    Nenhum registro de vivência original documentado na ficha.
                  </div>
                )}

                {/* Trabalhou */}
                {participations.totalWorked > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                    <SuitcaseSimple size={14} color="#0284c7" />
                    <span>
                      <strong>Serviço Operacional:</strong> {participations.totalWorked} {participations.totalWorked === 1 ? 'encontro trabalhado' : 'encontros trabalhados'} em equipes de serviço.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                Clique no link acima para conferir todos os detalhes na ficha.
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-light)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <Link
            href={`/pessoas/${person.id}`}
            className="button button-secondary"
            style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <FileText size={15} />
            Ver Ficha Completa
          </Link>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddTalk({
                  id: person.id,
                  name: person.name,
                  legacy_id: person.legacy_id,
                  parish: person.parish,
                });
              }}
              className="button button-primary"
              style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              Registrar Palestra
            </button>

            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
              style={{ fontSize: '0.82rem' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
