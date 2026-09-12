"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MagnifyingGlass,
  Plus,
  Scroll,
  User,
  UsersThree,
  X,
  Buildings,
  Church
} from '@phosphor-icons/react';
import { MANDATE_BODIES, type MandateBody } from '@/lib/encounter-config';
import { DIOCESAN_SECTORS } from '@/lib/sectors';

interface ManageMandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBody?: MandateBody;
  defaultParish?: string | null;
}

export function ManageMandateModal({
  isOpen,
  onClose,
  defaultBody = 'Equipe Dirigente - 1ª Etapa',
  defaultParish,
}: ManageMandateModalProps) {
  const router = useRouter();

  // Busca de pessoa
  const [personQuery, setPersonQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);

  // Campos do mandato
  const [body, setBody] = useState<MandateBody>(defaultBody);
  const [condition, setCondition] = useState<'Jovem' | 'Casal'>('Jovem');
  const [role, setRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [endYear, setEndYear] = useState<number>(new Date().getFullYear() + 1);
  const [parish, setParish] = useState<string>(defaultParish || '');
  const [sectorId, setSectorId] = useState<string>('setor-1');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Atualizar opções de pastas ao mudar o órgão ou condição
  const bodyInfo = MANDATE_BODIES[body];
  const availableRoles = condition === 'Jovem' ? bodyInfo.roles.jovem : bodyInfo.roles.casal;

  useEffect(() => {
    if (availableRoles.length > 0) {
      setRole(availableRoles[0]);
    }
  }, [body, condition]);

  // Debounced search de pessoas
  useEffect(() => {
    if (personQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(personQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [personQuery]);

  if (!isOpen) return null;

  const allParishes = DIOCESAN_SECTORS.flatMap(s => s.parishes).map(p => ({
    name: p.dbNames[0] || p.name,
    label: `${p.name} (${p.city.replace(/\s*-\s*GO/i, '')})`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPerson) {
      setError('Por favor, selecione a pessoa para o mandato.');
      return;
    }

    setLoading(true);
    setError(null);

    const finalRole = role === 'custom' ? customRole.trim() : role;
    if (!finalRole) {
      setError('Por favor, informe a pasta ou função.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/mandates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          body,
          role: finalRole,
          condition,
          start_year: Number(startYear),
          end_year: Number(endYear),
          parish: bodyInfo.level === 'Paroquial' ? parish : null,
          sector_id: bodyInfo.level === 'Setorial' ? sectorId : null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao cadastrar mandato');
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o mandato');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(28, 25, 23, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-canvas)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--brand-light)',
                color: 'var(--brand-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scroll size={20} weight="duotone" />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                Cadastrar Novo Mandato
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Conselho Diocesano, Setoriais e Equipes Dirigentes (1ª e 2ª Etapa)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Seleção de Pessoa */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                Pessoa / Liderança *
              </label>
              {selectedPerson ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--brand-light)',
                    border: '1.5px solid var(--brand-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--brand-primary)',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      {selectedPerson.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                        {selectedPerson.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {selectedPerson.legacy_id || 'PES-00000'} {selectedPerson.parish ? `· ${selectedPerson.parish}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Trocar pessoa
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <MagnifyingGlass
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
                  />
                  <input
                    type="text"
                    value={personQuery}
                    onChange={(e) => setPersonQuery(e.target.value)}
                    placeholder="Digite o nome da pessoa ou código PES-xxxxx..."
                    className="filter-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                  {searching && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Buscando...
                    </span>
                  )}

                  {/* Resultados da busca */}
                  {searchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#fff',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-base)',
                        boxShadow: 'var(--shadow-lg)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 10,
                      }}
                    >
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPerson(p);
                            setPersonQuery('');
                            setSearchResults([]);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-light)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-canvas)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{p.name}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {p.legacy_id || 'PES'} {p.parish ? `· ${p.parish}` : ''}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                            Selecionar
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Órgão e Condição */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Órgão / Esfera *
                </label>
                <select
                  value={body}
                  onChange={(e) => setBody(e.target.value as MandateBody)}
                  className="filter-input"
                  style={{ width: '100%' }}
                >
                  {(Object.keys(MANDATE_BODIES) as MandateBody[]).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Condição *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as 'Jovem' | 'Casal')}
                  className="filter-input"
                  style={{ width: '100%' }}
                >
                  <option value="Jovem">Jovem</option>
                  <option value="Casal">Casal</option>
                </select>
              </div>
            </div>

            {/* Pasta / Função */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Pasta / Função Oficial *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="filter-input"
                style={{ width: '100%', marginBottom: role === 'custom' ? '8px' : '0' }}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="custom">+ Outra Pasta / Função personalizada...</option>
              </select>

              {role === 'custom' && (
                <input
                  type="text"
                  required
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Nome da pasta ou função..."
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              )}
            </div>

            {/* Paróquia (se 1ª Etapa) ou Setor (se Setorial) */}
            {bodyInfo.level === 'Paroquial' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Paróquia de Atuação *
                </label>
                <select
                  value={parish}
                  onChange={(e) => setParish(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%' }}
                >
                  <option value="">Selecione a paróquia...</option>
                  {allParishes.map((p) => (
                    <option key={p.name} value={p.name}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}

            {bodyInfo.level === 'Setorial' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Setor Diocesano *
                </label>
                <select
                  value={sectorId}
                  onChange={(e) => setSectorId(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%' }}
                >
                  {DIOCESAN_SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.region}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Período (Anos Inicial e Final) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Ano de Início *
                </label>
                <input
                  type="number"
                  required
                  min={1970}
                  max={2035}
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Ano de Término
                </label>
                <input
                  type="number"
                  min={startYear}
                  max={2035}
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Observações do Mandato
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Mandato exercido durante a transição paroquial..."
                className="filter-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-base)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="button button-secondary"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="button button-primary"
            >
              {loading ? 'Salvando...' : 'Cadastrar Mandato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
