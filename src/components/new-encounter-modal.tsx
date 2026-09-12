"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarBlank,
  Church,
  MapPin,
  Plus,
  Tag,
  UsersThree,
  X,
  CheckCircle,
  Info
} from '@phosphor-icons/react';
import { ENCOUNTER_TYPES, type EncounterType, type EncounterLevel } from '@/lib/encounter-config';
import { DIOCESAN_SECTORS } from '@/lib/sectors';

interface NewEncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultParish?: string | null;
}

export function NewEncounterModal({ isOpen, onClose, defaultParish }: NewEncounterModalProps) {
  const router = useRouter();

  const [type, setType] = useState<EncounterType>('1ª Etapa');
  const [edition, setEdition] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [parish, setParish] = useState<string>(defaultParish || 'Paróquia São Francisco de Assis');
  const [city, setCity] = useState<string>('Anápolis - GO');
  const [name, setName] = useState<string>('');
  const [dateText, setDateText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Equipes selecionadas / customizadas
  const [teams, setTeams] = useState<string[]>(ENCOUNTER_TYPES['1ª Etapa'].defaultTeams);
  const [newTeamInput, setNewTeamInput] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTypeInfo = ENCOUNTER_TYPES[type];
  const isDiocesan = currentTypeInfo.level === 'Diocesano';

  // Todas as paróquias catalogadas nos 6 setores
  const allParishes = DIOCESAN_SECTORS.flatMap(s => s.parishes).map(p => ({
    name: p.dbNames[0] || p.name,
    label: `${p.name} (${p.city.replace(/\s*-\s*GO/i, '')})`,
    city: p.city
  }));

  function handleTypeChange(newType: EncounterType) {
    setType(newType);
    const info = ENCOUNTER_TYPES[newType];
    setTeams([...info.defaultTeams]);
    if (info.level === 'Diocesano') {
      setParish('Diocese de Anápolis');
      setCity('Anápolis - GO');
    } else if (defaultParish) {
      setParish(defaultParish);
    }
  }

  function handleAddTeam() {
    const trimmed = newTeamInput.trim();
    if (!trimmed) return;
    if (!teams.includes(trimmed)) {
      setTeams([...teams, trimmed]);
    }
    setNewTeamInput('');
  }

  function handleRemoveTeam(teamToRemove: string) {
    setTeams(teams.filter(t => t !== teamToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          level: currentTypeInfo.level,
          edition: edition.trim() || '1º',
          year: Number(year),
          parish: isDiocesan ? 'Diocese de Anápolis' : parish,
          city: city.trim(),
          name: name.trim() || `${edition || '1º'} ${type} Segue-me`,
          date_text: dateText.trim(),
          teams,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao cadastrar encontro');
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o encontro');
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
          maxWidth: '680px',
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
              <CalendarBlank size={20} weight="duotone" />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                Cadastrar Novo Encontro
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                1ª Etapa, 2ª Etapa, Retiro Mariano ou Congresso Eucarístico
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
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

            {/* Seletor de Tipo de Encontro */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Tipo de Encontro *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {(Object.keys(ENCOUNTER_TYPES) as EncounterType[]).map((t) => {
                  const info = ENCOUNTER_TYPES[t];
                  const isSelected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-base)',
                        background: isSelected ? 'var(--brand-light)' : '#ffffff',
                        color: isSelected ? 'var(--brand-text)' : 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>{t}</strong>
                      <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                        {info.level}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Banner Explicativo e Regra de Pré-requisito */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: currentTypeInfo.badgeBg,
                  border: `1px solid ${currentTypeInfo.badgeColor}33`,
                  color: currentTypeInfo.badgeColor,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Info size={18} weight="duotone" />
                <div>
                  <strong>{currentTypeInfo.description}</strong>
                  <div style={{ fontSize: '0.74rem', marginTop: '2px', opacity: 0.9 }}>
                    📋 <strong>Pré-requisito:</strong> {currentTypeInfo.prerequisiteRule}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Dados Básicos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Edição (ex: 1º, 24º) *
                </label>
                <input
                  type="text"
                  required
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="Ex: 24º"
                  className="filter-input"
                  style={{ width: '100%' }}
                />
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

            {/* Nome / Tema do Encontro */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Nome ou Tema Oficial do Encontro
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Ex: ${edition || '24º'} Encontro Segue-me - 'Vem e Segue-me'`}
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Paróquia e Cidade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  {isDiocesan ? 'Âmbito' : 'Paróquia *'}
                </label>
                {isDiocesan ? (
                  <input
                    type="text"
                    disabled
                    value="Diocese de Anápolis (Todos os Setores)"
                    className="filter-input"
                    style={{ width: '100%', background: 'var(--bg-canvas)', color: 'var(--text-muted)' }}
                  />
                ) : (
                  <select
                    value={parish}
                    onChange={(e) => {
                      setParish(e.target.value);
                      const matched = allParishes.find(p => p.name === e.target.value);
                      if (matched) setCity(matched.city);
                    }}
                    className="filter-input"
                    style={{ width: '100%' }}
                  >
                    {allParishes.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Cidade / Município
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Anápolis - GO"
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Datas descritivas */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Período ou Data de Realização
              </label>
              <input
                type="text"
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                placeholder="Ex: 24 a 26 de Julho de 2026"
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Seção de Equipes do Encontro */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Equipes de Trabalho do Encontro ({teams.length})
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {type === 'Congresso Eucarístico' ? 'Equipes específicas do Congresso' : 'Equipes padrão do movimento'}
                </span>
              </div>

              {/* Campo para Adicionar Nova Equipe Customizada */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newTeamInput}
                  onChange={(e) => setNewTeamInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTeam();
                    }
                  }}
                  placeholder="Nome de uma nova equipe (ex: Som e Palco, Adoração)..."
                  className="filter-input"
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="button button-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  <Plus size={15} />
                  Adicionar Equipe
                </button>
              </div>

              {/* Chips das Equipes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto', padding: '4px' }}>
                {teams.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-base)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.78rem',
                      color: 'var(--text-main)',
                    }}
                  >
                    <Tag size={12} color="var(--brand-primary)" />
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(t)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '1px',
                        color: 'var(--text-subtle)',
                        display: 'inline-flex',
                      }}
                      title={`Remover ${t}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
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
              {loading ? 'Cadastrando...' : 'Cadastrar Encontro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
