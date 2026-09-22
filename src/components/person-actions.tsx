"use client";

import { useState } from 'react';
import { ArrowsMerge, NotePencil, User, Check, WarningCircle, Heart, Church, PencilSimple } from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback, post } from '@/components/ui';
import type { Person, Viewer } from '@/lib/types';
import { ManageSpouseModal } from './manage-spouse-modal';
import { ManageParishModal } from './manage-parish-modal';
import { ManagePersonModal } from './manage-person-modal';

export function PersonActions({
  person,
  viewer,
  currentCouple,
}: {
  person: Person;
  viewer: Viewer;
  currentCouple?: any;
}) {
  const [spouseOpen, setSpouseOpen] = useState(false);
  const [parishOpen, setParishOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState(person.name);
  const [email, setEmail] = useState(person.email || '');
  const [phone, setPhone] = useState(person.phone || '');
  const [birthDate, setBirthDate] = useState(person.birth_date_text || '');
  const [reason, setReason] = useState('');

  // Merge states
  const [targetId, setTargetId] = useState('');
  const [mergeReason, setMergeReason] = useState('');

  const isStaff = viewer.role === 'admin' || viewer.role === 'reviewer';

  async function handleCorrectionSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const changes: Record<string, string | null> = {};
      if (name !== person.name) changes.name = name;
      if (email !== (person.email || '')) changes.email = email || null;
      if (phone !== (person.phone || '')) changes.phone = phone || null;
      if (birthDate !== (person.birth_date_text || '')) changes.birth_date_text = birthDate || null;

      if (Object.keys(changes).length === 0) {
        throw new Error('Nenhuma alteração foi realizada.');
      }

      await post('/api/corrections', {
        person_id: person.id,
        changes,
        reason,
      });

      setSuccess('Solicitação de correção enviada para análise com sucesso!');
      setTimeout(() => {
        setCorrectionOpen(false);
        setSuccess('');
        setReason('');
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar correção.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMergeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (!targetId.trim()) {
        throw new Error('Informe o identificador da pessoa canônica de destino.');
      }
      if (!mergeReason.trim()) {
        throw new Error('A justificativa é obrigatória.');
      }

      await post('/api/people/merge', {
        source_id: person.id,
        target_id: targetId.trim(),
        reason: mergeReason.trim(),
        source_version: person.version,
      });

      setSuccess('Mesclagem realizada com sucesso!');
      setTimeout(() => {
        window.location.href = `/pessoas/${targetId.trim()}`;
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar mesclagem.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
      <button
        type="button"
        className="button button-primary"
        onClick={() => setEditProfileOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: isStaff && viewer.id !== person.id ? 'auto' : '100%',
          padding: '10px 16px',
          fontWeight: 600,
        }}
      >
        <PencilSimple size={17} weight="bold" />
        {isStaff && viewer.id !== person.id ? 'Editar Dados do Cadastro' : 'Editar Meus Dados'}
      </button>

      {isStaff && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setError('');
            setSuccess('');
            setSpouseOpen(true);
          }}
          title="Vincular, trocar ou desvincular cônjuge"
        >
          <Heart size={17} color="#dc2626" weight="fill" />
          Gerenciar cônjuge
        </button>
      )}

      {isStaff && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setError('');
            setSuccess('');
            setParishOpen(true);
          }}
          title="Transferir ou definir paróquia de referência"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Church size={17} color="#2563eb" />
          Transferir Paróquia
        </button>
      )}

      {isStaff && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setError('');
            setSuccess('');
            setMergeOpen(true);
          }}
          title="Mesclar cadastro duplicado com outro cadastro canônico"
        >
          <ArrowsMerge size={17} />
          Mesclar cadastro
        </button>
      )}

      {/* Modal de Correção */}
      <Modal
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        title="Solicitar correção de dados"
        description={`As alterações propostas para ${person.name} serão registradas e analisadas pela equipe do movimento.`}
      >
        <form onSubmit={handleCorrectionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Feedback message={error} error />
          <Feedback message={success} />

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(62) 99999-9999"
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Data de nascimento
            </label>
            <input
              type="text"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Justificativa da alteração (obrigatória)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva por que esta alteração está sendo solicitada (ex: erro de digitação no quadrante, atualização de número)..."
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
              onClick={() => setCorrectionOpen(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <SubmitButton busy={busy} type="submit">
              Enviar para revisão
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Modal de Mesclagem */}
      {isStaff && (
        <Modal
          open={mergeOpen}
          onClose={() => setMergeOpen(false)}
          title="Mesclar cadastro duplicado"
          description={`Esta ação moverá todas as participações e ocorrências de ${person.name} (${person.legacy_id || person.id}) para um cadastro canônico de destino.`}
        >
          <form onSubmit={handleMergeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Feedback message={error} error />
            <Feedback message={success} />

            <div className="note">
              O cadastro atual será marcado como aposentado (merged_into). Nenhuma participação ou histórico será perdido. A operação poderá ser revertida na auditoria se necessário.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                ID ou Código da Pessoa Canônica de Destino
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="UUID ou código PES-xxxxx de destino"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Justificativa da mesclagem (obrigatória para auditoria)
              </label>
              <textarea
                value={mergeReason}
                onChange={(e) => setMergeReason(e.target.value)}
                placeholder="Ex: Confirmação de que trata-se da mesma pessoa com grafia abreviada no encontro de 2022..."
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
                onClick={() => setMergeOpen(false)}
                disabled={busy}
              >
                Cancelar
              </button>
              <SubmitButton busy={busy} type="submit" className="button-primary">
                Confirmar mesclagem
              </SubmitButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Gerenciamento de Cônjuge */}
      <ManageSpouseModal
        person={person}
        currentCouple={currentCouple}
        open={spouseOpen}
        onClose={() => setSpouseOpen(false)}
      />

      {/* Modal de Transferência de Paróquia */}
      <ManageParishModal
        person={person}
        open={parishOpen}
        onClose={() => setParishOpen(false)}
      />

      {/* Modal de Edição Direta de Dados Pessoais */}
      <ManagePersonModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        person={person}
      />
    </div>
  );
}
