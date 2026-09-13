"use client";

import { useState, useEffect } from 'react';
import { Check, X, UserCheck, UserPlus, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback, post } from '@/components/ui';
import type { ReviewItem } from '@/lib/types';

interface SearchedPerson {
  id: string;
  legacy_id?: string;
  name: string;
  phone?: string;
  parish?: string;
}

export function ReviewActions({ item }: { item: ReviewItem }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados específicos para validação de identidade
  const isIdentity = item.kind === 'identity';
  const [personMode, setPersonMode] = useState<'new' | 'existing'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedPerson[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<SearchedPerson | null>(null);

  // Busca em tempo real de pessoas existentes
  useEffect(() => {
    if (personMode !== 'existing' || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data.items || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, personMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (!reason.trim()) {
        throw new Error('A justificativa da decisão é obrigatória.');
      }

      let targetPersonId: string | undefined = undefined;

      if (isIdentity && decision === 'approved') {
        if (item.person_id) {
          targetPersonId = item.person_id;
        } else if (personMode === 'new') {
          targetPersonId = 'create_new';
        } else if (personMode === 'existing') {
          if (!selectedPerson) {
            throw new Error('Pesquise e selecione a pessoa nos quadrantes para vincular.');
          }
          targetPersonId = selectedPerson.id;
        }
      }

      await post(`/api/reviews/${item.id}`, {
        decision,
        reason: reason.trim(),
        expected_version: item.version,
        person_id: targetPersonId,
      });

      setSuccess(`Pendência ${decision === 'approved' ? 'aprovada' : 'não aprovada'} com sucesso.`);
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
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          onClick={() => {
            setDecision('approved');
            setError('');
            setSuccess('');
            setReason('Identidade e histórico confirmados nos registros oficiais da diocese.');
            setPersonMode('new');
            setSelectedPerson(null);
            setModalOpen(true);
          }}
        >
          <Check size={15} weight="bold" />
          Aprovar
        </button>

        <button
          type="button"
          className="button button-secondary"
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          onClick={() => {
            setDecision('rejected');
            setError('');
            setSuccess('');
            setReason('Dados de participação não puderam ser validados com os quadrantes arquivados.');
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
        title={decision === 'approved' ? 'Aprovar Solicitação de Cadastro' : 'Recusar Solicitação'}
        description={`Item: ${item.title}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Feedback message={error} error />
          <Feedback message={success} />

          {/* Seleção de Vínculo de Pessoa (apenas na aprovação de identidade se ainda não vinculado) */}
          {isIdentity && decision === 'approved' && !item.person_id && (
            <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
                Vínculo da Ficha no Sistema:
              </label>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPersonMode('new');
                    setSelectedPerson(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${personMode === 'new' ? 'var(--brand-primary)' : 'var(--border-base)'}`,
                    background: personMode === 'new' ? 'rgba(180, 83, 9, 0.06)' : '#fff',
                    color: personMode === 'new' ? 'var(--brand-primary)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <UserPlus size={16} />
                  Criar Nova Ficha Oficial
                </button>

                <button
                  type="button"
                  onClick={() => setPersonMode('existing')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${personMode === 'existing' ? 'var(--brand-primary)' : 'var(--border-base)'}`,
                    background: personMode === 'existing' ? 'rgba(180, 83, 9, 0.06)' : '#fff',
                    color: personMode === 'existing' ? 'var(--brand-primary)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <UserCheck size={16} />
                  Vincular a Cadastro Existente
                </button>
              </div>

              {personMode === 'new' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  ℹ️ Uma nova ficha oficial de participante será criada com os dados informados nesta solicitação e vinculada à conta do usuário.
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nome nos quadrantes já cadastrados..."
                      className="filter-input"
                      style={{ width: '100%', paddingLeft: '32px' }}
                    />
                    <MagnifyingGlass
                      size={16}
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
                    />
                  </div>

                  {searchLoading && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', padding: '4px 0' }}>
                      Buscando...
                    </div>
                  )}

                  {selectedPerson ? (
                    <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#166534', display: 'block' }}>
                          ✓ {selectedPerson.name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#15803d' }}>
                          Código: {selectedPerson.legacy_id || 'sem código'} &bull; Paróquia: {selectedPerson.parish || 'não informada'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPerson(null)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.76rem', cursor: 'pointer' }}
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    searchResults.length > 0 && (
                      <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: '#fff' }}>
                        {searchResults.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPerson(p);
                              setSearchResults([]);
                              setSearchQuery(p.name);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid var(--border-light)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                          >
                            <strong>{p.name}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginLeft: '8px' }}>
                              ({p.legacy_id || 'sem código'} &bull; {p.parish || 'sem paróquia'})
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Justificativa da decisão (para auditoria da Diocese) *
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
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
              Confirmar {decision === 'approved' ? 'Aprovação' : 'Recusa'}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
