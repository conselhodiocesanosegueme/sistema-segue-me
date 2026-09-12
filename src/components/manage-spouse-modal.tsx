"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MagnifyingGlass,
  Trash,
  UserCheck,
  Warning,
  X,
  Check,
  ArrowsLeftRight,
  Plus
} from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback } from '@/components/ui';
import type { Person, SpouseInfo } from '@/lib/types';

interface ManageSpouseModalProps {
  person: Person;
  currentCouple?: {
    id: string;
    legacy_id?: string | null;
    start_text?: string | null;
    notes?: string | null;
    spouse?: SpouseInfo | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function ManageSpouseModal({
  person,
  currentCouple,
  open,
  onClose,
}: ManageSpouseModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpouse, setSelectedSpouse] = useState<any | null>(null);
  const [startText, setStartText] = useState(currentCouple?.start_text || '');
  const [notes, setNotes] = useState(currentCouple?.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(searchQuery.trim())}&excludeId=${person.id}`);
        const data = await res.json();
        setSearchResults(data.items || []);
      } catch (err) {
        console.error('Erro na busca de pessoas:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, person.id]);

  async function handleSaveCouple(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSpouse && !currentCouple?.spouse) {
      setError('Selecione uma pessoa para vincular como cônjuge.');
      return;
    }

    const targetSpouseId = selectedSpouse?.id || currentCouple?.spouse?.id;
    if (!targetSpouseId) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/people/${person.id}/couple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spouse_id: targetSpouseId,
          start_text: startText || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível salvar o vínculo matrimonial.');
      }

      setSuccess('Vínculo conjugal atualizado com sucesso!');
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar vínculo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlinkCouple() {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/people/${person.id}/couple`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível desvincular o casal.');
      }

      setSuccess('Cônjuge desvinculado com sucesso.');
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desvincular.');
    } finally {
      setBusy(false);
      setConfirmUnlink(false);
    }
  }

  const currentSpouse = currentCouple?.spouse;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerenciar Vínculo Matrimonial / Casal"
      description={`Configuração de cônjuge e vínculo de casal para ${person.name} (${person.legacy_id || 'Base'})`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <Feedback message={error} error />
        <Feedback message={success} />

        {/* Cônjuge Atual (se houver) */}
        {currentSpouse && !selectedSpouse && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-base)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={20} weight="fill" color="#dc2626" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                  Cônjuge Atual Vinculado
                </span>
              </div>
              {currentCouple?.legacy_id && (
                <span style={{ fontSize: '0.74rem', background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {currentCouple.legacy_id}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', display: 'block' }}>
                  {currentSpouse.name}
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {currentSpouse.legacy_id ? `${currentSpouse.legacy_id} · ` : ''}
                  {currentSpouse.phone || 'Telefone não informado'}
                  {currentSpouse.parish ? ` · ${currentSpouse.parish}` : ''}
                </span>
              </div>

              {!confirmUnlink ? (
                <button
                  type="button"
                  onClick={() => setConfirmUnlink(true)}
                  className="button button-secondary"
                  style={{ color: '#b91c1c', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <Trash size={15} /> Desvincular Cônjuge
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleUnlinkCouple}
                    disabled={busy}
                    className="button"
                    style={{ background: '#b91c1c', color: '#fff', fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Confirmar Desvinculação
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmUnlink(false)}
                    className="button button-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Novo Cônjuge Selecionado */}
        {selectedSpouse && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#f0fdf4',
              border: '2px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} weight="bold" /> Novo Cônjuge Selecionado
              </span>
              <strong style={{ fontSize: '1rem', color: '#14532d', display: 'block', marginTop: '2px' }}>
                {selectedSpouse.name}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#15803d' }}>
                {selectedSpouse.legacy_id ? `${selectedSpouse.legacy_id} · ` : ''}
                {selectedSpouse.phone || 'Sem telefone'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSpouse(null)}
              className="button button-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              <X size={14} /> Trocar Seleção
            </button>
          </div>
        )}

        {/* Campo de Busca de Nova Pessoa para Casal */}
        {!selectedSpouse && (
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              {currentSpouse ? 'Trocar cônjuge por outra pessoa da base:' : 'Buscar parceiro(a) na base de participantes:'}
            </label>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou código PES-xxxxx..."
                className="filter-input"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>

            {/* Lista de Resultados de Busca */}
            {isSearching && (
              <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Buscando participantes...
              </div>
            )}

            {searchResults.length > 0 && (
              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-base)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '8px',
                  background: '#ffffff',
                }}
              >
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedSpouse(item);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-light)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-canvas)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div>
                      <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-main)' }}>
                        {item.name}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.legacy_id ? `${item.legacy_id} · ` : ''}
                        {item.phone || 'Sem telefone'}
                        {item.parish ? ` · ${item.parish}` : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={16} /> Selecionar
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campos Opcionais de Período e Observações */}
        {(selectedSpouse || currentSpouse) && (
          <form onSubmit={handleSaveCouple} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Ano / Início conhecido do casal
                </label>
                <input
                  type="text"
                  value={startText}
                  onChange={(e) => setStartText(e.target.value)}
                  placeholder="Ex: 2011"
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Observações do casal
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Casal dirigente ou tio..."
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={onClose}
                className="button button-secondary"
                disabled={busy}
              >
                Cancelar
              </button>

              <SubmitButton busy={busy} type="submit" className="button-primary">
                {selectedSpouse ? 'Salvar Novo Vínculo de Casal' : 'Salvar Alterações'}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
