"use client";

import React, { useState } from 'react';
import {
  LockKey,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  XCircle,
  Question,
  PencilSimple,
  Check,
  NotePencil,
} from '@phosphor-icons/react';
import { SubmitButton, Feedback } from '@/components/ui';

interface PersonPastoralNotesCardProps {
  personId: string;
  initialPastoralNotes?: string | null;
  initialEngagementStatus?: string | null;
}

const ENGAGEMENT_OPTIONS = [
  {
    value: 'disponivel',
    label: 'Disponível / Engajado',
    icon: CheckCircle,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    desc: 'Participativo, pontual e disposto a servir no movimento.',
  },
  {
    value: 'justificou',
    label: 'Ausência Justificada',
    icon: WarningCircle,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    desc: 'Não pôde participar por motivo legítimo (saúde, luto, viagem, estudo/trabalho). Lembrar no próximo!',
  },
  {
    value: 'sem_compromisso',
    label: 'Sem Compromisso',
    icon: XCircle,
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    desc: 'Faltou sem avisar ou desistiu em cima da hora. Não convidar no momento.',
  },
  {
    value: 'neutro',
    label: 'Neutro / A Consultar',
    icon: Question,
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    desc: 'Sem histórico de recusa ou aceite recente.',
  },
];

export function PersonPastoralNotesCard({
  personId,
  initialPastoralNotes = '',
  initialEngagementStatus = 'neutro',
}: PersonPastoralNotesCardProps) {
  const [pastoralNotes, setPastoralNotes] = useState(initialPastoralNotes || '');
  const [engagementStatus, setEngagementStatus] = useState(initialEngagementStatus || 'neutro');
  const [isEditing, setIsEditing] = useState(!initialPastoralNotes && initialEngagementStatus === 'neutro');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentOption = ENGAGEMENT_OPTIONS.find((opt) => opt.value === engagementStatus) || ENGAGEMENT_OPTIONS[3];
  const CurrentIcon = currentOption.icon;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/people/${personId}/pastoral-notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastoral_notes: pastoralNotes.trim(),
          engagement_status: engagementStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar anotação pastoral.');
      }

      setSuccess('Nota pastoral salva com sucesso!');
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="panel"
      style={{
        background: '#ffffff',
        border: '1px solid #fed7aa',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.04)',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LockKey size={20} color="#ea580c" weight="fill" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', color: '#9a3412', fontWeight: 600 }}>
              Acompanhamento Pastoral & Histórico de Convites
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              🔒 Visível exclusivamente para a Equipe Dirigente e Conselho Diocesano
            </span>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="button button-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PencilSimple size={14} />
            Editar Nota
          </button>
        )}
      </div>

      <Feedback message={error} error />
      <Feedback message={success} />

      {/* MODO DE EDIÇÃO */}
      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Situação / Disponibilidade para Convites:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {ENGAGEMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = engagementStatus === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setEngagementStatus(opt.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-base)',
                      background: isSelected ? opt.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', color: opt.color, marginBottom: '3px' }}>
                      <Icon size={16} weight="bold" />
                      {opt.label}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
              Notas e Observações Manuais de Convites:
            </label>
            <textarea
              value={pastoralNotes}
              onChange={(e) => setPastoralNotes(e.target.value)}
              placeholder="Ex: Convidado em 2025 para a Cozinha do XXIII Segue-me. Não pôde por motivo de cirurgia familiar, mas pediu com carinho para ser lembrado em 2026..."
              rows={3}
              className="filter-input"
              style={{ width: '100%', fontSize: '0.84rem', resize: 'vertical' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginTop: '4px' }}>
              💡 Anote aqui recusas com motivo (saúde, viagem, luto, estudo) ou histórico de falta de compromisso para que as próximas equipes dirigentes saibam como agir.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <SubmitButton busy={busy} type="submit" className="button-primary" style={{ padding: '6px 16px', fontSize: '0.84rem' }}>
              <Check size={16} /> Salvar Nota Pastoral
            </SubmitButton>
            {initialPastoralNotes && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={busy}
                className="button button-secondary"
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        /* MODO DE VISUALIZAÇÃO */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: currentOption.bg,
                color: currentOption.color,
                border: `1px solid ${currentOption.border}`,
              }}
            >
              <CurrentIcon size={16} weight="bold" />
              {currentOption.label}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {currentOption.desc}
            </span>
          </div>

          {pastoralNotes ? (
            <div
              style={{
                padding: '12px 14px',
                background: '#fffbf5',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fed7aa',
                fontSize: '0.85rem',
                color: '#7c2d12',
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
              }}
            >
              {pastoralNotes}
            </div>
          ) : (
            <div style={{ padding: '12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Nenhuma anotação de convite ou acompanhamento registrada para esta pessoa.
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'block',
                  margin: '6px auto 0',
                  background: 'none',
                  border: 'none',
                  color: '#ea580c',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                + Adicionar nota pastoral
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
