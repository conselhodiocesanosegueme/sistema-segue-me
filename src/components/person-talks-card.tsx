"use client";

import { useState } from 'react';
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
    title?: string;
    role?: string;
    team?: string;
    location?: string;
    notes?: string;
    kind?: string;
    condition?: string;
    encounter?: {
      id: string;
      name?: string;
      edition?: string;
      year?: number;
      parish?: string;
      city?: string;
    };
  }>;
  isStaff: boolean;
}

export function PersonTalksCard({ person, talks = [], isStaff }: PersonTalksCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="panel" style={{ padding: '20px' }}>
      {/* Cabeçalho do Bloco */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span className="section-kicker">FORMAÇÃO & TESTEMUNHO</span>
          <h2 style={{ fontSize: '1.15rem', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Palestras Ministradas</span>
            {talks.length > 0 && (
              <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                {talks.length} {talks.length === 1 ? 'palestra' : 'palestras'}
              </span>
            )}
          </h2>
        </div>

        {isStaff && (
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
      {talks.length === 0 ? (
        <div style={{ padding: '14px 16px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: '1.45' }}>
            Nenhum registro de palestra ministrada encontrado para esta pessoa no banco de dados.
          </p>
          {isStaff && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="button button-primary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <MicrophoneStage size={14} />
              Registrar que {person.name} já ministrou palestra
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {talks.map((t) => {
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
                      <span>{parishName}</span>
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
