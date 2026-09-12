"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Church, CheckCircle, Warning, MapPin, X } from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback } from '@/components/ui';
import { DIOCESAN_SECTORS } from '@/lib/sectors';
import type { Person } from '@/lib/types';

interface ManageParishModalProps {
  person: Person;
  open: boolean;
  onClose: () => void;
}

export function ManageParishModal({
  person,
  open,
  onClose,
}: ManageParishModalProps) {
  const router = useRouter();
  const [selectedParish, setSelectedParish] = useState(person.parish || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParish.trim()) {
      setError('Selecione uma paróquia de destino.');
      return;
    }
    if (selectedParish.trim() === (person.parish || '').trim()) {
      setError('A paróquia selecionada já é a paróquia atual da pessoa.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/people/${person.id}/parish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parish: selectedParish.trim(),
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar transferência.');
      }

      setSuccess(`Paróquia atualizada para "${selectedParish}" com sucesso!`);
      setTimeout(() => {
        setSuccess('');
        onClose();
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar paróquia.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transferir / Definir Paróquia de Referência"
      description={`Gerencie a paróquia de vinculação pastoral de ${person.name} na Diocese de Anápolis.`}
    >
      <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Feedback message={error} error />
        <Feedback message={success} />

        {/* Paróquia Atual */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Paróquia Atual
            </span>
            <strong style={{ fontSize: '0.94rem', color: person.parish ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {person.parish || 'Nenhuma paróquia vinculada atualmente'}
            </strong>
          </div>
          <Church size={24} color="#64748b" />
        </div>

        {/* Seleção da Nova Paróquia por Setor */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
            Nova Paróquia (ou Paróquia de Destino) *
          </label>
          <select
            value={selectedParish}
            onChange={(e) => setSelectedParish(e.target.value)}
            required
            className="filter-input"
            style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem' }}
          >
            <option value="">-- Selecione a paróquia --</option>
            {DIOCESAN_SECTORS.map((sector) => (
              <optgroup key={sector.id} label={`${sector.name} (${sector.region})`}>
                {sector.parishes.map((p) => {
                  const fullName = `Paróquia ${p.name}`;
                  return (
                    <option key={p.name} value={fullName}>
                      {fullName} ({p.city})
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            A lista contempla todas as paróquias organizadas pelos 6 Setores da Diocese de Anápolis.
          </p>
        </div>

        {/* Justificativa / Motivo da Transferência */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
            Motivo da Transferência ou Observações (opcional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Mudança de bairro/cidade, nova vinculação paroquial..."
            className="filter-input"
            style={{ width: '100%', fontSize: '0.84rem' }}
          />
        </div>

        {/* Informação sobre Mandatos Passados */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: '0.76rem',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <MapPin size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Histórico preservado:</strong> Ao transferir a pessoa de paróquia, os mandatos anteriores de Equipe Dirigente permanecem devidamente associados à paróquia onde foram exercidos.
          </span>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            className="button button-secondary"
            disabled={busy}
          >
            Cancelar
          </button>
          <SubmitButton
            busy={busy}
            className="button-primary"
          >
            {busy ? 'Salvando...' : 'Confirmar Transferência'}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
