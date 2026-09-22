"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HandHeart,
  PencilSimple,
  Check,
} from '@phosphor-icons/react';
import type { PersonAvailability } from '@/lib/types';
import { SubmitButton, Feedback } from '@/components/ui';

interface PersonAvailabilityCardProps {
  personId: string;
  personName: string;
  initialAvailability?: PersonAvailability | null;
  canEdit?: boolean;
}

const READINESS_OPTIONS = [
  {
    value: 'disponivel',
    label: 'Disponível para Servir',
    badge: '🟢 Disponível',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    value: 'restrito',
    label: 'Disponível com Restrições',
    badge: '🟡 Com restrições',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    value: 'indisponivel',
    label: 'No Momento Impossibilitado',
    badge: '⏸️ No momento ausente',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#cbd5e1',
  },
];

const SECOND_STAGE_OPTIONS = [
  {
    value: 'desejo_vivenciar',
    label: 'Tenho desejo de vivenciar a 2ª Etapa!',
    badge: '🌟 Deseja 2ª Etapa',
    color: '#854d0e',
    bg: '#fef9c3',
    border: '#fde047',
  },
  {
    value: 'ja_vivenciou',
    label: 'Já vivenciei a 2ª Etapa',
    badge: '✅ 2ª Etapa Vivenciada',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    value: 'aguardar',
    label: 'Ainda não vivenciei / Prefiro aguardar',
    badge: '⏳ 2ª Etapa Futura',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#cbd5e1',
  },
];

export function PersonAvailabilityCard({
  personId,
  personName,
  initialAvailability,
  canEdit = true,
}: PersonAvailabilityCardProps) {
  const router = useRouter();
  const [availability, setAvailability] = useState<PersonAvailability>(initialAvailability || {});
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states simplificados e objetivos
  const [status, setStatus] = useState(availability.status || 'disponivel');
  const [scope, setScope] = useState(availability.scope || 'diocese_e_paroquia');
  const [secondStageStatus, setSecondStageStatus] = useState(availability.second_stage_status || '');
  const [notes, setNotes] = useState(availability.notes || '');

  const hasAnyData = Boolean(
    availability.status ||
    availability.second_stage_status ||
    availability.notes
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    const payload: PersonAvailability = {
      status: (status as any) || null,
      scope: (scope as any) || null,
      second_stage_status: (secondStageStatus as any) || null,
      notes: notes.trim() || null,
    };

    try {
      const res = await fetch(`/api/people/${personId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: payload }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Erro ao salvar disponibilidade.');
      }

      setAvailability(payload);
      setSuccess('Sua disponibilidade foi salva com sucesso!');
      router.refresh();
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  const currentReadiness = READINESS_OPTIONS.find((r) => r.value === availability.status);
  const currentSecondStage = SECOND_STAGE_OPTIONS.find((s) => s.value === availability.second_stage_status);

  return (
    <section className="panel" style={{ border: '1.5px solid var(--border-base)', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      {/* Cabeçalho do Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HandHeart size={22} weight="fill" />
          </div>
          <div>
            <span className="section-kicker" style={{ color: '#15803d', margin: 0 }}>ENGAJAMENTO & SERVIÇO</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: '2px 0 0 0', color: 'var(--text-main)' }}>
              Prontidão & Jornada Pastoral
            </h3>
          </div>
        </div>

        {canEdit && !isEditing && hasAnyData && (
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setIsEditing(true)}
            style={{ fontSize: '0.78rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PencilSimple size={13} />
            Atualizar Prontidão
          </button>
        )}
      </div>

      {error && <Feedback message={error} error />}
      {success && <Feedback message={success} />}

      {/* Modo de Edição Simplificado e Elegante */}
      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}>
          {/* 1. Status de Prontidão */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              1. Você está disponível para servir nos próximos encontros?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {READINESS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => setStatus(opt.value as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-light)',
                      background: isSelected ? opt.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="readiness_status"
                      checked={isSelected}
                      onChange={() => setStatus(opt.value as any)}
                      style={{ margin: 0, accentColor: opt.color }}
                    />
                    <strong style={{ fontSize: '0.82rem', color: isSelected ? opt.color : 'var(--text-main)' }}>
                      {opt.label}
                    </strong>
                  </label>
                );
              })}
            </div>

            {/* Raio de atuação */}
            <label style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="avail-scope"
                checked={scope === 'diocese_e_paroquia'}
                onChange={(e) => setScope(e.target.checked ? 'diocese_e_paroquia' : 'apenas_paroquia')}
                style={{ cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Aceito convites para servir em <strong>outras paróquias</strong> da Diocese
              </span>
            </label>
          </div>

          {/* 2. Caminhada da 2ª Etapa */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              2. Como está sua caminhada em relação à 2ª Etapa?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SECOND_STAGE_OPTIONS.map((opt) => {
                const isSelected = secondStageStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => setSecondStageStatus(opt.value as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-light)',
                      background: isSelected ? opt.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="second_stage_choice"
                      checked={isSelected}
                      onChange={() => setSecondStageStatus(opt.value as any)}
                      style={{ margin: 0, accentColor: opt.color }}
                    />
                    <strong style={{ fontSize: '0.82rem', color: isSelected ? opt.color : 'var(--text-main)' }}>
                      {opt.label}
                    </strong>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Recado opcional */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
            <label htmlFor="avail-notes" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Recado para a Equipe Dirigente (Opcional):
            </label>
            <input
              id="avail-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Disponível nos fins de semana..."
              className="filter-input"
              style={{ width: '100%', fontSize: '0.82rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <SubmitButton busy={busy} className="button-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center' }}>
              <Check size={15} /> Salvar Disponibilidade
            </SubmitButton>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setIsEditing(false)}
              disabled={busy}
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : hasAnyData ? (
        /* Modo de Visualização do Card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Status de Prontidão */}
          <div>
            <span style={{ display: 'block', fontSize: '0.70rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Disponibilidade Atual
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: currentReadiness ? currentReadiness.bg : '#f1f5f9',
                  color: currentReadiness ? currentReadiness.color : '#475569',
                  border: `1px solid ${currentReadiness ? currentReadiness.border : '#cbd5e1'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {currentReadiness ? currentReadiness.badge : 'Status não informado'}
              </span>

              {availability.scope === 'diocese_e_paroquia' && (
                <span
                  title="Disponível para apoiar outras paróquias da diocese"
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#f8fafc',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  🌐 Toda a Diocese
                </span>
              )}
            </div>
          </div>

          {/* Caminhada da 2ª Etapa */}
          {currentSecondStage && (
            <div>
              <span style={{ display: 'block', fontSize: '0.70rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                Caminhada da 2ª Etapa
              </span>
              <div style={{ marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: currentSecondStage.bg,
                    color: currentSecondStage.color,
                    border: `1px solid ${currentSecondStage.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {currentSecondStage.badge}
                </span>
              </div>
            </div>
          )}

          {/* Recado / Observações */}
          {availability.notes && (
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'block', fontSize: '0.67rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                Recado para a Equipe Dirigente
              </span>
              "{availability.notes}"
            </div>
          )}
        </div>
      ) : (
        /* Card Vazio Convidativo */
        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-base)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            Você ainda não informou sua disponibilidade para servir ou interesse na 2ª Etapa.
          </p>
          {canEdit && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setIsEditing(true)}
              style={{ fontSize: '0.80rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <HandHeart size={15} /> Definir Disponibilidade
            </button>
          )}
        </div>
      )}
    </section>
  );
}
