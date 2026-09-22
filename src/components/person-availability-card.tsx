"use client";

import React, { useState } from 'react';
import {
  HandHeart,
  Sparkle,
  CalendarCheck,
  CheckCircle,
  WarningCircle,
  XCircle,
  PencilSimple,
  Check,
  X,
  Buildings,
  UsersThree,
  Info,
  Clock,
  ChatCircleText,
} from '@phosphor-icons/react';
import type { PersonAvailability } from '@/lib/types';
import { DIOCESAN_SECTORS } from '@/lib/sectors';
import { SubmitButton, Feedback } from '@/components/ui';

interface PersonAvailabilityCardProps {
  personId: string;
  personName: string;
  initialAvailability?: PersonAvailability | null;
  canEdit?: boolean;
}

const COMMON_TEAMS = [
  'Acolhida / Recepção',
  'Animação / Trânsito',
  'Apoio / Serviços Gerais',
  'Cozinha',
  'Decoração / Cenografia',
  'Espiritualidade / Vigília',
  'Liturgia / Canto',
  'Secretaria / Fichas',
  'Som / Multimídia',
  'Teatro / Expressão',
  'Montagem / Sala',
];

const READINESS_OPTIONS = [
  {
    value: 'disponivel',
    label: 'Disponível para Servir',
    badge: '🟢 Disponível',
    desc: 'Estou disponível e com o coração aberto para trabalhar nos próximos encontros.',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    value: 'restrito',
    label: 'Disponível com Restrições',
    badge: '🟡 Com restrições',
    desc: 'Posso ajudar, dependendo das datas, horários e compromissos.',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    value: 'indisponivel',
    label: 'No Momento Impossibilitado',
    badge: '⏸️ No momento ausente',
    desc: 'Estou impossibilitado temporariamente por estudos, trabalho ou motivos pessoais.',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
  },
];

const SECOND_STAGE_OPTIONS = [
  {
    value: 'desejo_vivenciar',
    label: 'Tenho muito desejo de vivenciar a 2ª Etapa!',
    badge: '🌟 Deseja 2ª Etapa',
    desc: 'Quero dar esse novo passo na fé e participar da 2ª Etapa do Segue-me.',
    color: '#854d0e',
    bg: '#fef9c3',
    border: '#fde047',
  },
  {
    value: 'ja_vivenciou',
    label: 'Já vivenciei a 2ª Etapa',
    badge: '✅ 2ª Etapa Vivenciada',
    desc: 'Já completei a 2ª Etapa do Segue-me.',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    value: 'aguardar',
    label: 'Ainda não vivenciei / Prefiro aguardar',
    badge: '⏳ 2ª Etapa Futura',
    desc: 'Ainda não é o momento ou prefiro aguardar uma próxima oportunidade.',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#cbd5e1',
  },
];

export function PersonAvailabilityCard({
  personId,
  personName,
  initialAvailability,
  canEdit = true,
}: PersonAvailabilityCardProps) {
  const [availability, setAvailability] = useState<PersonAvailability>(initialAvailability || {});
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [status, setStatus] = useState(availability.status || 'disponivel');
  const [scope, setScope] = useState(availability.scope || 'diocese_e_paroquia');
  const [secondStageStatus, setSecondStageStatus] = useState(availability.second_stage_status || '');
  const [secondStageYear, setSecondStageYear] = useState<string>(
    availability.second_stage_year ? String(availability.second_stage_year) : ''
  );
  const [secondStageParish, setSecondStageParish] = useState(availability.second_stage_parish || '');
  const [lastServedYear, setLastServedYear] = useState<string>(
    availability.last_served_year ? String(availability.last_served_year) : ''
  );
  const [lastServedParish, setLastServedParish] = useState(availability.last_served_parish || '');
  const [lastServedTeam, setLastServedTeam] = useState(availability.last_served_team || '');
  const [preferredTeams, setPreferredTeams] = useState<string[]>(availability.preferred_teams || []);
  const [notes, setNotes] = useState(availability.notes || '');

  const hasAnyData = Boolean(
    availability.status ||
    availability.second_stage_status ||
    availability.last_served_year ||
    availability.last_served_team ||
    (availability.preferred_teams && availability.preferred_teams.length > 0) ||
    availability.notes
  );

  function toggleTeam(team: string) {
    setPreferredTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    const payload: PersonAvailability = {
      status: (status as any) || null,
      scope: (scope as any) || null,
      second_stage_status: (secondStageStatus as any) || null,
      second_stage_year: secondStageYear ? Number(secondStageYear) : null,
      second_stage_parish: secondStageParish.trim() || null,
      last_served_year: lastServedYear ? Number(lastServedYear) : null,
      last_served_parish: lastServedParish.trim() || null,
      last_served_team: lastServedTeam.trim() || null,
      preferred_teams: preferredTeams,
      notes: notes.trim() || null,
    };

    try {
      const res = await fetch(`/api/people/${personId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: payload }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Erro ao salvar disponibilidade.');
      }

      setAvailability(payload);
      setSuccess('Sua disponibilidade foi salva e já está visível para a Equipe Dirigente!');
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setBusy(false);
    }
  }

  const currentReadiness = READINESS_OPTIONS.find((r) => r.value === availability.status);
  const currentSecondStage = SECOND_STAGE_OPTIONS.find((s) => s.value === availability.second_stage_status);

  return (
    <section className="panel" style={{ border: '1.5px solid var(--border-base)', position: 'relative' }}>
      {/* Cabeçalho do Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HandHeart size={22} weight="fill" />
          </div>
          <div>
            <span className="section-kicker" style={{ color: '#15803d', margin: 0 }}>ENGAJAMENTO & SERVIÇO</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', margin: '2px 0 0 0', color: 'var(--text-main)' }}>
              Prontidão & Jornada Pastoral
            </h3>
          </div>
        </div>

        {canEdit && !isEditing && hasAnyData && (
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setIsEditing(true)}
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PencilSimple size={14} />
            Atualizar Prontidão
          </button>
        )}
      </div>

      {error && <Feedback message={error} error />}
      {success && <Feedback message={success} />}

      {/* Modo de Edição */}
      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px' }}>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-main)' }}>📋 Para que serve este espaço?</strong><br />
            Ao informar sua prontidão e interesse na 2ª Etapa, você ajuda diretamente as <strong>Equipes Dirigentes e o Conselho Diocesano</strong> na montagem das equipes de trabalho e na seleção dos participantes dos próximos encontros.
          </div>

          {/* 1. Status de Prontidão */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              1. Qual é a sua disponibilidade para servir nos próximos encontros?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {READINESS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => setStatus(opt.value as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-light)',
                      background: isSelected ? opt.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="readiness_status"
                      checked={isSelected}
                      onChange={() => setStatus(opt.value as any)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: isSelected ? opt.color : 'var(--text-main)' }}>
                        {opt.label}
                      </strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Raio de atuação */}
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="avail-scope"
                checked={scope === 'diocese_e_paroquia'}
                onChange={(e) => setScope(e.target.checked ? 'diocese_e_paroquia' : 'apenas_paroquia')}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="avail-scope" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Aceito convites para apoiar e trabalhar em <strong>outras paróquias da Diocese</strong> quando precisarem
              </label>
            </div>
          </div>

          {/* 2. Jornada da 2ª Etapa */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              2. Como está sua caminhada em relação à 2ª Etapa do Segue-me?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '10px' }}>
              {SECOND_STAGE_OPTIONS.map((opt) => {
                const isSelected = secondStageStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => setSecondStageStatus(opt.value as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-light)',
                      background: isSelected ? opt.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="second_stage_choice"
                      checked={isSelected}
                      onChange={() => setSecondStageStatus(opt.value as any)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: isSelected ? opt.color : 'var(--text-main)' }}>
                        {opt.label}
                      </strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {secondStageStatus === 'ja_vivenciou' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
                    Ano da 2ª Etapa
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 2023"
                    value={secondStageYear}
                    onChange={(e) => setSecondStageYear(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
                    Paróquia onde vivenciou
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paróquia São Francisco"
                    value={secondStageParish}
                    onChange={(e) => setSecondStageParish(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Última vez que serviu */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              3. Quando foi a última vez que você trabalhou em um encontro?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
                  Ano
                </label>
                <input
                  type="number"
                  placeholder="Ex: 2024"
                  value={lastServedYear}
                  onChange={(e) => setLastServedYear(e.target.value)}
                  className="input"
                  style={{ fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
                  Equipe em que serviu
                </label>
                <input
                  type="text"
                  placeholder="Ex: Apoio, Cozinha..."
                  value={lastServedTeam}
                  onChange={(e) => setLastServedTeam(e.target.value)}
                  className="input"
                  style={{ fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
                  Paróquia
                </label>
                <input
                  type="text"
                  placeholder="Paróquia do serviço"
                  value={lastServedParish}
                  onChange={(e) => setLastServedParish(e.target.value)}
                  className="input"
                  style={{ fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          {/* 4. Equipes de Afinidade */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              4. Em quais equipes você tem mais afinidade ou gostaria de servir?
            </label>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Selecione uma ou mais equipes para a coordenação saber onde você mais se identifica:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMON_TEAMS.map((team) => {
                const isSelected = preferredTeams.includes(team);
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => toggleTeam(team)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.78rem',
                      borderRadius: '999px',
                      border: isSelected ? '1px solid #16a34a' : '1px solid var(--border-light)',
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      color: isSelected ? '#15803d' : 'var(--text-main)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected && <Check size={12} weight="bold" />}
                    {team}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Recado / Observações */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              5. Recado ou Observação para os Dirigentes (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Finais de semana disponíveis, disponibilidade para carona, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              style={{ fontSize: '0.84rem', resize: 'vertical' }}
            />
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setIsEditing(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <SubmitButton busy={busy}>Salvar Disponibilidade</SubmitButton>
          </div>
        </form>
      ) : hasAnyData ? (
        /* Modo de Visualização com Dados */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Status de Prontidão */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                Disponibilidade p/ Trabalhar
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: currentReadiness ? currentReadiness.bg : '#f1f5f9',
                    color: currentReadiness ? currentReadiness.color : '#475569',
                    border: `1px solid ${currentReadiness ? currentReadiness.border : '#cbd5e1'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {currentReadiness ? currentReadiness.badge : 'Status não informado'}
                </span>

                {availability.scope === 'diocese_e_paroquia' && (
                  <span
                    title="Disponível para apoiar outras paróquias da diocese"
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#f8fafc',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    🌐 Apoia outras paróquias
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Jornada da 2ª Etapa */}
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Caminhada da 2ª Etapa
            </span>
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: currentSecondStage ? currentSecondStage.bg : '#f8fafc',
                  color: currentSecondStage ? currentSecondStage.color : 'var(--text-main)',
                  border: `1px solid ${currentSecondStage ? currentSecondStage.border : 'var(--border-light)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {currentSecondStage ? currentSecondStage.badge : 'Não informado'}
                {availability.second_stage_year ? ` · ${availability.second_stage_year}` : ''}
                {availability.second_stage_parish ? ` (${availability.second_stage_parish})` : ''}
              </span>
            </div>
          </div>

          {/* Última vez que serviu */}
          {(availability.last_served_year || availability.last_served_team || availability.last_served_parish) && (
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                Último Encontro Trabalhado
              </span>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                <strong>
                  {availability.last_served_team || 'Equipe de trabalho'}
                </strong>
                {availability.last_served_year ? ` em ${availability.last_served_year}` : ''}
                {availability.last_served_parish ? ` · ${availability.last_served_parish}` : ''}
              </p>
            </div>
          )}

          {/* Equipes de Preferência */}
          {availability.preferred_teams && availability.preferred_teams.length > 0 && (
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                Equipes de Afinidade / Preferência
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {availability.preferred_teams.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-main)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recado / Observações */}
          {availability.notes && (
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                Recado para a Equipe Dirigente
              </span>
              "{availability.notes}"
            </div>
          )}
        </div>
      ) : (
        /* Card Vazio Convidativo */
        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-base)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
            Você ainda não informou sua prontidão para servir ou interesse na 2ª Etapa. Informe quando estiver disponível para que a Equipe Dirigente possa te convidar!
          </p>
          {canEdit && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setIsEditing(true)}
              style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <HandHeart size={16} /> Definir Minha Disponibilidade
            </button>
          )}
        </div>
      )}
    </section>
  );
}
