"use client";

import { useState } from 'react';
import { Check, X, UserCheck, WarningCircle } from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback, post } from '@/components/ui';
import type { ReviewItem } from '@/lib/types';

export function ReviewActions({ item }: { item: ReviewItem }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reason, setReason] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isIdentity = item.kind === 'identity';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (!reason.trim()) {
        throw new Error('A justificativa da decisão é obrigatória.');
      }

      if (isIdentity && decision === 'approved' && !item.person_id && !candidateId.trim()) {
        throw new Error('Selecione a pessoa canônica para vincular esta conta.');
      }

      await post(`/api/reviews/${item.id}`, {
        decision,
        reason: reason.trim(),
        expected_version: item.version,
        person_id: candidateId.trim() || item.person_id || undefined,
      });

      setSuccess(`Pendência ${decision === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar decisão.');
    } finally {
      setBusy(false);
    }
  }

  if (item.status !== 'pending') {
    return (
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {item.resolution ? `Resolvido: "${item.resolution}"` : 'Decisão concluída'}
      </span>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="button button-primary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          onClick={() => {
            setDecision('approved');
            setError('');
            setSuccess('');
            setReason('');
            setModalOpen(true);
          }}
        >
          <Check size={15} />
          Aprovar
        </button>

        <button
          type="button"
          className="button button-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          onClick={() => {
            setDecision('rejected');
            setError('');
            setSuccess('');
            setReason('');
            setModalOpen(true);
          }}
        >
          <X size={15} />
          Não aprovar
        </button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={decision === 'approved' ? 'Aprovar solicitação' : 'Não aprovar solicitação'}
        description={`Item: ${item.title}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Feedback message={error} error />
          <Feedback message={success} />

          {isIdentity && decision === 'approved' && !item.person_id && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                ID ou Código PES da pessoa a ser vinculada
              </label>
              <input
                type="text"
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="UUID ou código PES da pessoa"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Justificativa da decisão (obrigatória para auditoria)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva a razão da sua decisão..."
              required
              rows={3}
              className="filter-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setModalOpen(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <SubmitButton
              busy={busy}
              type="submit"
              className={decision === 'approved' ? 'button-primary' : 'button-danger'}
            >
              Confirmar {decision === 'approved' ? 'Aprovação' : 'Rejeição'}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
