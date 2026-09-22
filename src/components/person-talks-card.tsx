"use client";

import { useState, useMemo } from 'react';
import { MicrophoneStage, Plus, CalendarBlank, Church, Sparkle } from '@phosphor-icons/react';
import { ManageTalkModal } from './manage-talk-modal';

interface PersonTalksCardProps {
  person: {
    id: string;
    name: string;
    legacy_id?: string | null;
    parish?: string | null;
  };
  talks: Array<{
    id: string;
    title?: string | null;
    role?: string | null;
    team?: string | null;
    location?: string | null;
    notes?: string | null;
    kind?: string | null;
    condition?: string | null;
    encounter?: {
      id: string;
      name?: string | null;
      edition?: string | number | null;
      year?: number | null;
      parish?: string | null;
      city?: string | null;
    } | null;
  }>;
  isStaff?: boolean;
  canEdit?: boolean;
}

export function PersonTalksCard({ person, talks = [], isStaff = false, canEdit }: PersonTalksCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const allowEdit = canEdit ?? isStaff;

  // Ordena sempre do mais recente para o mais antigo (2026 -> 2011)
  const sortedTalks = useMemo(() => {
    return [...talks].sort((a, b) => {
      const yA = a.encounter?.year || 0;
      const yB = b.encounter?.year || 0;
      return yB - yA;
    });
  }, [talks]);

  // Se talks estiver vazio, checa se há palestra autodeclarada no cadastro (person.notes)
  const declaredTalk = useMemo(() => {
    try {
      const pNotes = (person as any).notes;
      const parsed = typeof pNotes === 'string' ? JSON.parse(pNotes) : (pNotes || {});
      return parsed.speaker_talk || (parsed.speaker_talks && parsed.speaker_talks[0]) || null;
    } catch {
      return null;
    }
  }, [(person as any).notes]);

  return (
    <section className="panel" style={{ padding: '20px' }}>
      {/* Cabeçalho do Bloco */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span className="section-kicker">FORMAÇÃO & TESTEMUNHO</span>
          <h2 style={{ fontSize: '1.15rem', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Palestras Ministradas</span>
            {(talks.length > 0 || declaredTalk) && (
              <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                {talks.length > 0 ? `${talks.length} ${talks.length === 1 ? 'palestra' : 'palestras'}` : '1 palestra'}
              </span>
            )}
          </h2>
        </div>

        {allowEdit && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="button button-secondary"
            style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={13} />
            Registrar Palestra
          </button>
        )}
      </div>

      {/* Lista de Palestras ou Estado Vazio */}
      {sortedTalks.length === 0 && !declaredTalk ? (
        <div style={{ padding: '14px 16px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: '1.45' }}>
            Nenhum registro de palestra ministrada encontrado no banco de dados.
          </p>
          {allowEdit && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="button button-primary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <MicrophoneStage size={14} />
              Registrar palestra que já ministrou
            </button>
          )}
        </div>
      ) : sortedTalks.length === 0 && declaredTalk ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              background: '#ffffff',
              border: '1px solid var(--border-base)',
              borderLeft: '3.5px solid #7c3aed',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <MicrophoneStage size={16} weight="bold" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <strong style={{ fontSize: '0.90rem', color: 'var(--text-main)', display: 'block' }}>
                  {declaredTalk}
                </strong>
                <span
                  style={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: '#7c3aed',
                    background: '#ede9fe',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Informada no Perfil
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {person.parish && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Church size={13} />
                    {person.parish}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedTalks.map((t) => {
            const themeTitle = (t.role || t.title || 'Palestra').replace(/^palestrante\s*[-—–:]\s*/i, '').trim();
            const parishName = t.encounter?.parish || t.location || person.parish;
            const yearNum = t.encounter?.year;

            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  background: '#ffffff',
                  border: '1px solid var(--border-base)',
                  borderLeft: '3.5px solid var(--brand-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#fef3c7',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <MicrophoneStage size={16} weight="bold" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <strong style={{ fontSize: '0.90rem', color: 'var(--text-main)', display: 'block' }}>
                      {themeTitle}
                    </strong>
                    {yearNum && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                        {yearNum}
                      </span>
                    )}
                  </div>

                  {parishName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Church size={13} color="var(--brand-primary)" />
                      <span>
                        {parishName}
                        {t.encounter?.city ? ` • ${t.encounter.city.replace(/\s*[\/-]\s*GO/i, '')}` : ''}
                      </span>
                    </div>
                  )}

                  {t.notes && (
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                      {t.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ManageTalkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPerson={person}
      />
    </section>
  );
}
