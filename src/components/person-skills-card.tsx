"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MicrophoneStage,
  Guitar,
  PianoKeys,
  MusicNotes,
  Sparkle,
  PencilSimple,
  Check,
  X,
  SpeakerHigh,
  MaskHappy,
  Plus,
} from '@phosphor-icons/react';
import type { PersonSkills } from '@/lib/types';
import { SubmitButton, Feedback } from '@/components/ui';

interface PersonSkillsCardProps {
  personId: string;
  personName: string;
  initialSkills?: PersonSkills | null;
  canEdit?: boolean;
}

const COMMON_INSTRUMENTS = [
  'Violão',
  'Teclado / Piano',
  'Bateria / Percussão',
  'Baixo',
  'Guitarra',
  'Flauta / Sopro',
  'Cavaquinho / Ukulele',
  'Sanfona / Acordeom',
];

const COMMON_OTHER_SKILLS = [
  'Animação',
  'Dom de cozinhar para muitas pessoas',
  'Facilidade com comida / Cozinha',
  'Facilidade com limpeza',
  'Sonorização / Mesa de Som',
  'Liturgia / Proclamação',
  'Cenografia / Decoração',
];

export function PersonSkillsCard({
  personId,
  personName,
  initialSkills,
  canEdit = false,
}: PersonSkillsCardProps) {
  const router = useRouter();
  const [skills, setSkills] = useState<PersonSkills>(initialSkills || {});
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados locais do editor
  const [sings, setSings] = useState(Boolean(initialSkills?.sings));
  const [singingTypes, setSingingTypes] = useState<string[]>(initialSkills?.singing_types || []);
  const [instruments, setInstruments] = useState<string[]>(initialSkills?.instruments || []);
  const [customInstrument, setCustomInstrument] = useState('');
  const [otherSkills, setOtherSkills] = useState<string[]>(initialSkills?.other_skills || []);

  const toggleSingingType = (type: string) => {
    setSingingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const addCustomInstrument = () => {
    const trimmed = customInstrument.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!instruments.some((i) => i.toLowerCase() === formatted.toLowerCase())) {
      setInstruments((prev) => [...prev, formatted]);
    }
    setCustomInstrument('');
  };

  const toggleOtherSkill = (skill: string) => {
    setOtherSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    const newSkills: PersonSkills = {
      sings,
      singing_types: sings ? singingTypes : [],
      instruments,
      other_skills: otherSkills,
    };

    try {
      const res = await fetch(`/api/people/${personId}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: newSkills }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar habilidades.');
      }

      setSkills(newSkills);
      setSuccess('Talentos e habilidades atualizados com sucesso!');
      router.refresh();
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  const hasAnySkill =
    skills.sings ||
    (skills.instruments && skills.instruments.length > 0) ||
    (skills.other_skills && skills.other_skills.length > 0);

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-lg)' }}>
      {/* Cabeçalho do Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MusicNotes size={22} color="var(--brand-primary)" weight="bold" />
          <h3 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Talentos & Habilidades Musicais
          </h3>
        </div>

        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="button button-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PencilSimple size={14} />
            Editar Habilidades
          </button>
        )}
      </div>

      <Feedback message={error} error />
      <Feedback message={success} />

      {/* MODO DE EDIÇÃO */}
      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. CANTO / VOCAL */}
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={sings}
                onChange={(e) => setSings(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
              />
              <MicrophoneStage size={18} color="var(--brand-primary)" weight="bold" />
              Canta? ou participou da equipe do canto
            </label>

            {sings && (
              <div style={{ marginTop: '10px', marginLeft: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Solista', 'Coral / Coro', 'Salmista', 'Backing Vocal'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleSingingType(type)}
                    className="button"
                    style={{
                      fontSize: '0.76rem',
                      padding: '3px 10px',
                      height: 'auto',
                      borderRadius: '16px',
                      background: singingTypes.includes(type) ? 'var(--brand-primary)' : '#ffffff',
                      color: singingTypes.includes(type) ? '#ffffff' : 'var(--text-muted)',
                      border: singingTypes.includes(type) ? '1px solid var(--brand-primary)' : '1px solid var(--border-base)',
                    }}
                  >
                    {singingTypes.includes(type) && <Check size={12} style={{ marginRight: '4px' }} />}
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. INSTRUMENTOS */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Instrumentos Musicais que Toca:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {COMMON_INSTRUMENTS.map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => toggleInstrument(inst)}
                  className="button"
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    height: 'auto',
                    borderRadius: '18px',
                    background: instruments.includes(inst) ? '#0284c7' : '#ffffff',
                    color: instruments.includes(inst) ? '#ffffff' : 'var(--text-main)',
                    border: instruments.includes(inst) ? '1px solid #0284c7' : '1px solid var(--border-base)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {instruments.includes(inst) && <Check size={13} />}
                  {inst}
                </button>
              ))}
            </div>

            {/* Instrumentos personalizados já adicionados */}
            {instruments.filter((i) => !COMMON_INSTRUMENTS.includes(i)).length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>
                  Instrumentos adicionados por você:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {instruments
                    .filter((i) => !COMMON_INSTRUMENTS.includes(i))
                    .map((inst) => (
                      <span
                        key={inst}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          borderRadius: '18px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Guitar size={13} />
                        {inst}
                        <button
                          type="button"
                          onClick={() => setInstruments((prev) => prev.filter((i) => i !== inst))}
                          title={`Remover ${inst}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px',
                            marginLeft: '2px',
                          }}
                        >
                          <X size={13} weight="bold" />
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Adicionar outro instrumento personalizado */}
            <div style={{ display: 'flex', gap: '8px', maxWidth: '380px' }}>
              <input
                type="text"
                value={customInstrument}
                onChange={(e) => setCustomInstrument(e.target.value)}
                placeholder="Outro instrumento (ex: Saxofone, Trompete...)"
                className="filter-input"
                style={{ fontSize: '0.8rem', padding: '6px 10px', flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomInstrument();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomInstrument}
                className="button button-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>

          {/* 3. OUTRAS HABILIDADES PASTORAIS */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Outras Habilidades & Talentos no Movimento:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COMMON_OTHER_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleOtherSkill(skill)}
                  className="button"
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    height: 'auto',
                    borderRadius: '18px',
                    background: otherSkills.includes(skill) ? '#7c3aed' : '#ffffff',
                    color: otherSkills.includes(skill) ? '#ffffff' : 'var(--text-main)',
                    border: otherSkills.includes(skill) ? '1px solid #7c3aed' : '1px solid var(--border-base)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {otherSkills.includes(skill) && <Check size={13} />}
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Botões do Editor */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <SubmitButton busy={busy} type="submit" className="button-primary" style={{ padding: '6px 16px', fontSize: '0.84rem' }}>
              <Check size={16} /> Salvar Habilidades
            </SubmitButton>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={busy}
              className="button button-secondary"
              style={{ padding: '6px 14px', fontSize: '0.84rem' }}
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        /* MODO DE VISUALIZAÇÃO PÚBLICA (VISÍVEL POR TODOS) */
        <div>
          {!hasAnySkill ? (
            <div style={{ padding: '16px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Nenhuma habilidade musical ou talento cadastrado no perfil.
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'block',
                    margin: '8px auto 0',
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  + Clique aqui para cadastrar suas habilidades
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Seção Canto */}
              {skills.sings && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <MicrophoneStage size={15} weight="bold" />
                    Canto / Equipe de Canto
                  </span>
                  {skills.singing_types?.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: '#f1f5f9',
                        color: 'var(--text-muted)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.74rem',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Seção Instrumentos */}
              {skills.instruments && skills.instruments.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Instrumentos:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {skills.instruments.map((inst) => (
                      <span
                        key={inst}
                        style={{
                          background: '#f0f9ff',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Guitar size={14} />
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção Outros Talentos */}
              {skills.other_skills && skills.other_skills.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Outras Áreas:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {skills.other_skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          background: '#faf5ff',
                          color: '#6b21a8',
                          border: '1px solid #e9d5ff',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Sparkle size={14} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
