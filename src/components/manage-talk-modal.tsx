"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MicrophoneStage,
  MagnifyingGlass,
  X,
  User,
  Heart,
  Church,
  CalendarBlank,
  FileText,
  CheckCircle,
  Sparkle
} from '@phosphor-icons/react';
import { DIOCESAN_SECTORS } from '@/lib/sectors';

const COMMON_TALK_THEMES = [
  'O Filho Pródigo',
  'Amor e Sexualidade',
  'A Vida em Família',
  'Um Homem Chamado Jesus',
  'Uma Jovem Chamada Maria',
  'O Jovem Cristão no Mundo de Hoje',
  'Reconciliação, uma Proposta de Paz',
  'Conhecendo a Ceia Eucarística',
  'As Dimensões do Ser Humano e suas Vocações',
  'Olhando para o Alto',
  'Testemunho do Jovem',
];

interface ManageTalkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPerson?: { id: string; name: string; legacy_id?: string | null; parish?: string | null } | null;
}

export function ManageTalkModal({
  isOpen,
  onClose,
  defaultPerson = null,
}: ManageTalkModalProps) {
  const router = useRouter();

  // Busca de pessoa (se não pré-selecionada)
  const [personQuery, setPersonQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(defaultPerson);

  // Campos da palestra
  const [themeSelect, setThemeSelect] = useState<string>(COMMON_TALK_THEMES[0]);
  const [customTheme, setCustomTheme] = useState<string>('');
  const [condition, setCondition] = useState<'Jovem' | 'Casal'>('Jovem');
  const [parish, setParish] = useState<string>(defaultPerson?.parish || '');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (defaultPerson) {
      setSelectedPerson(defaultPerson);
      if (defaultPerson.parish) setParish(defaultPerson.parish);
    }
  }, [defaultPerson]);

  // Debounced search de pessoas
  useEffect(() => {
    if (defaultPerson || personQuery.trim().length < 2) {
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
  }, [personQuery, defaultPerson]);

  if (!isOpen) return null;

  const allParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes).map((p) => {
    const canonicalDbName = p.dbNames.find((n) => !n.includes('(')) || p.name;
    const finalParishName =
      canonicalDbName.startsWith('Paróquia') ||
      canonicalDbName.startsWith('Santuário') ||
      canonicalDbName.startsWith('Catedral')
        ? canonicalDbName
        : `Paróquia ${canonicalDbName}`;

    return {
      name: finalParishName,
      label: `${p.name} (${p.city.replace(/\s*-\s*GO/i, '')})`,
    };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPerson) {
      setError('Por favor, selecione a pessoa que ministrou a palestra.');
      return;
    }

    const finalTheme = themeSelect === 'custom' ? customTheme.trim() : themeSelect;
    if (!finalTheme) {
      setError('Informe o tema da palestra ministrada.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/talks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          theme: finalTheme,
          condition,
          parish: parish.trim() || undefined,
          year: Number(year),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar palestra');
      }

      setSuccess('Palestra registrada com sucesso!');
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar');
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
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
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
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MicrophoneStage size={20} weight="fill" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                Registrar Palestra Ministrada
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Vincule o tema da palestra ministrada no Segue-me a um pregador oficial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} weight="fill" />
              {success}
            </div>
          )}

          {/* 1. Seleção da Pessoa / Palestrante */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Palestrante *
            </label>

            {selectedPerson ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} color="#16a34a" weight="bold" />
                  <div>
                    <strong style={{ fontSize: '0.90rem', color: '#166534', display: 'block' }}>
                      {selectedPerson.name}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#15803d' }}>
                      {selectedPerson.legacy_id || 'sem código'} &bull; {selectedPerson.parish || 'sem paróquia vinculada'}
                    </span>
                  </div>
                </div>

                {!defaultPerson && (
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(null)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Trocar
                  </button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder="Digite o nome do palestrante para buscar na base..."
                  className="filter-input"
                  style={{ width: '100%', paddingLeft: '34px' }}
                />
                <MagnifyingGlass size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />

                {searching && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                    Buscando na base de dados...
                  </span>
                )}

                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-md)', marginTop: '4px', maxHeight: '180px', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                    {searchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPerson(p);
                          if (p.parish) setParish(p.parish);
                          setSearchResults([]);
                          setPersonQuery('');
                        }}
                        style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '0.82rem' }}
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
                )}
              </div>
            )}
          </div>

          {/* 2. Tema da Palestra */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Tema da Palestra *
            </label>
            <select
              value={themeSelect}
              onChange={(e) => setThemeSelect(e.target.value)}
              className="filter-input"
              style={{ width: '100%', marginBottom: themeSelect === 'custom' ? '8px' : '0' }}
            >
              {COMMON_TALK_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
              <option value="custom">+ Outro tema personalizado...</option>
            </select>

            {themeSelect === 'custom' && (
              <input
                type="text"
                required
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Digite o título ou tema da palestra..."
                className="filter-input"
                style={{ width: '100%' }}
              />
            )}
          </div>

          {/* 3. Condição (Jovem ou Casal) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Condição do Palestrante *
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCondition('Jovem')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${condition === 'Jovem' ? '#2563eb' : 'var(--border-base)'}`,
                  background: condition === 'Jovem' ? '#eff6ff' : '#fff',
                  color: condition === 'Jovem' ? '#1d4ed8' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <User size={16} />
                Jovem
              </button>

              <button
                type="button"
                onClick={() => setCondition('Casal')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${condition === 'Casal' ? '#d97706' : 'var(--border-base)'}`,
                  background: condition === 'Casal' ? '#fef3c7' : '#fff',
                  color: condition === 'Casal' ? '#92400e' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Heart size={16} weight="fill" />
                Casal
              </button>
            </div>
          </div>

          {/* 4. Paróquia e Ano */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Paróquia do Encontro
              </label>
              <select
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                className="filter-input"
                style={{ width: '100%' }}
              >
                <option value="">Selecione a paróquia...</option>
                {allParishes.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Ano do Encontro *
              </label>
              <input
                type="number"
                required
                min={1970}
                max={2035}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 5. Observações */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Palestra muito elogiada pela juventude, testemunho de fé..."
              className="filter-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Rodapé do Modal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? 'Salvando...' : 'Salvar Palestra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
