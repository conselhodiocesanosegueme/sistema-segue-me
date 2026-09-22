"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  EnvelopeSimple,
  Phone,
  CalendarBlank,
  Church,
  MicrophoneStage,
  Check,
  CheckCircle,
  PencilSimple,
} from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback } from '@/components/ui';
import { DIOCESAN_SECTORS } from '@/lib/sectors';
import type { Person } from '@/lib/types';

export const COMMON_TALK_THEMES = [
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

interface ManagePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  onSuccess?: (updated: Partial<Person>) => void;
}

export function ManagePersonModal({
  isOpen,
  onClose,
  person,
  onSuccess,
}: ManagePersonModalProps) {
  const router = useRouter();

  // Estados dos campos
  const [name, setName] = useState(person.name || '');
  const [email, setEmail] = useState(person.email || '');
  const [phone, setPhone] = useState(person.phone || '');
  const [birthDate, setBirthDate] = useState(person.birth_date_text || '');
  const [parish, setParish] = useState(person.parish || '');

  // Dados de palestrante
  const initialTalkData = (() => {
    try {
      const parsed = typeof person.notes === 'string' ? JSON.parse(person.notes) : (person.notes || {});
      const theme = parsed.speaker_talk || (parsed.speaker_talks && parsed.speaker_talks[0]) || '';
      return {
        isSpeaker: Boolean(parsed.is_speaker || theme),
        talk: theme,
      };
    } catch {
      return { isSpeaker: false, talk: '' };
    }
  })();

  const [isSpeaker, setIsSpeaker] = useState(initialTalkData.isSpeaker);
  const isCommonTheme = COMMON_TALK_THEMES.includes(initialTalkData.talk);
  const [speakerTalk, setSpeakerTalk] = useState<string>(() => {
    if (!initialTalkData.talk) return '';
    return isCommonTheme ? initialTalkData.talk : 'OUTRA';
  });
  const [customTalk, setCustomTalk] = useState<string>(() => {
    if (!initialTalkData.talk) return '';
    return isCommonTheme ? '' : initialTalkData.talk;
  });
  const [talkContext, setTalkContext] = useState<string>('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lista organizada de todas as paróquias da Diocese
  const allParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes).map((p) => {
    const fullName = p.dbNames[0] || `Paróquia ${p.name}`;
    const cleanCity = p.city.replace(/\s*-\s*GO/i, '');
    return {
      value: fullName,
      label: `${fullName} (${cleanCity})`,
    };
  });

  // Garante que a paróquia atual da pessoa esteja na lista caso tenha nome diferente
  if (person.parish && !allParishes.some((p) => p.value.toLowerCase() === person.parish?.toLowerCase())) {
    allParishes.unshift({
      value: person.parish,
      label: person.parish,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('O nome é obrigatório.');
      }
      const parts = trimmedName.split(/\s+/);
      if (parts.length < 2) {
        throw new Error('Por favor, informe seu nome e sobrenome completos.');
      }

      const resolvedTalk = isSpeaker
        ? (speakerTalk === 'OUTRA' ? customTalk.trim() : speakerTalk.trim())
        : null;

      const payload = {
        name: trimmedName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        birth_date_text: birthDate.trim() || null,
        parish: parish.trim() || null,
        is_speaker: isSpeaker,
        speaker_talk: resolvedTalk || null,
        speaker_talks: resolvedTalk ? [resolvedTalk] : [],
      };

      const res = await fetch(`/api/people/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar dados pessoais.');
      }

      // Se informou que é palestrante com tema especificado, sincroniza também em /api/talks
      if (isSpeaker && resolvedTalk) {
        try {
          await fetch('/api/talks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              person_id: person.id,
              theme: resolvedTalk,
              parish: talkContext.trim() || parish.trim() || person.parish || '',
              year: new Date().getFullYear(),
              condition: 'Jovem',
            }),
          });
        } catch (talkErr) {
          console.warn('Aviso ao registrar palestra nas participações:', talkErr);
        }
      }

      setSuccess('Dados cadastrais atualizados com sucesso no sistema!');
      if (onSuccess) {
        onSuccess(payload);
      }

      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar dados.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Editar Minhas Informações Pessoais">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 4px 0', lineHeight: 1.5 }}>
          Mantenha seus dados atualizados para facilitar o contato das equipes de trabalho e da coordenação diocesana.
          Tudo o que você salvar aqui será refletido no seu cartão de cadastro em todo o sistema.
        </p>

        {error && <Feedback message={error} error />}
        {success && <Feedback message={success} />}

        {/* Nome Completo */}
        <div>
          <label
            htmlFor="person-name"
            style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}
          >
            Nome Completo *
          </label>
          <div style={{ position: 'relative' }}>
            <User
              size={17}
              color="var(--text-subtle)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              id="person-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João da Silva Santos"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '34px' }}
              required
            />
          </div>
        </div>

        {/* Linha dupla: E-mail e Telefone */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label
              htmlFor="person-email"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}
            >
              E-mail de Contato
            </label>
            <div style={{ position: 'relative' }}>
              <EnvelopeSimple
                size={17}
                color="var(--text-subtle)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="person-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="filter-input"
                style={{ width: '100%', paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="person-phone"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}
            >
              Telefone / WhatsApp
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
                size={17}
                color="var(--text-subtle)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="person-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(62) 99999-9999"
                className="filter-input"
                style={{ width: '100%', paddingLeft: '34px' }}
              />
            </div>
          </div>
        </div>

        {/* Linha dupla: Data de Nascimento e Paróquia */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px' }}>
          <div>
            <label
              htmlFor="person-birth-date"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}
            >
              Data de Nascimento
            </label>
            <div style={{ position: 'relative' }}>
              <CalendarBlank
                size={17}
                color="var(--text-subtle)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="person-birth-date"
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="filter-input"
                style={{ width: '100%', paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="person-parish"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}
            >
              Paróquia de Frequência / Referência
            </label>
            <div style={{ position: 'relative' }}>
              <Church
                size={17}
                color="var(--text-subtle)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <select
                id="person-parish"
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                className="filter-input"
                style={{ width: '100%', paddingLeft: '34px' }}
              >
                <option value="">Selecione a paróquia...</option>
                {allParishes.map((p, idx) => (
                  <option key={`${p.value}-${idx}`} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Seção de Palestrante: Perguntas Interativas */}
        <div
          style={{
            background: isSpeaker ? '#faf5ff' : '#fafaf9',
            border: `1.5px solid ${isSpeaker ? '#c084fc' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <MicrophoneStage size={18} color={isSpeaker ? '#7c3aed' : 'var(--text-subtle)'} weight={isSpeaker ? 'fill' : 'bold'} />
            <strong style={{ fontSize: '0.88rem', color: isSpeaker ? '#6d28d9' : 'var(--text-main)' }}>
              Você já palestrou no Segue-me?
            </strong>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            Mapeamento diocesano de pregadores e palestrantes que já ministraram palestras nos encontros.
          </p>

          {/* Opções: Não / Sim */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setIsSpeaker(false);
                setSpeakerTalk('');
                setCustomTalk('');
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: !isSpeaker ? '2px solid #7c3aed' : '1px solid var(--border-base)',
                background: !isSpeaker ? '#ede9fe' : '#ffffff',
                color: !isSpeaker ? '#5b21b6' : 'var(--text-main)',
                fontWeight: !isSpeaker ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {!isSpeaker && <Check size={15} weight="bold" />}
              Não, nunca palestrei
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeaker(true);
                if (!speakerTalk) {
                  setSpeakerTalk(COMMON_TALK_THEMES[0]);
                }
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: isSpeaker ? '2px solid #7c3aed' : '1px solid var(--border-base)',
                background: isSpeaker ? '#7c3aed' : '#ffffff',
                color: isSpeaker ? '#ffffff' : 'var(--text-main)',
                fontWeight: isSpeaker ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: isSpeaker ? '0 2px 4px rgba(124, 58, 237, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {isSpeaker && <Check size={15} weight="bold" />}
              Sim, já palestrei
            </button>
          </div>

          {/* Se Sim: Pergunta 'Se sim, qual palestra você ministrou?' */}
          {isSpeaker && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #d8b4fe',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <label
                htmlFor="speaker-talk-select"
                style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#6d28d9' }}
              >
                Se sim, qual palestra você ministrou? *
              </label>

              <select
                id="speaker-talk-select"
                value={speakerTalk}
                onChange={(e) => setSpeakerTalk(e.target.value)}
                className="filter-input"
                style={{ width: '100%', background: '#ffffff', borderColor: '#c084fc' }}
              >
                <option value="">Selecione o tema da palestra...</option>
                {COMMON_TALK_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
                <option value="OUTRA">Outra palestra / Tema não listado...</option>
              </select>

              {speakerTalk === 'OUTRA' && (
                <input
                  type="text"
                  value={customTalk}
                  onChange={(e) => setCustomTalk(e.target.value)}
                  placeholder="Informe o tema ou título da palestra ministrada..."
                  className="filter-input"
                  style={{ width: '100%', background: '#ffffff', borderColor: '#c084fc' }}
                  autoFocus
                />
              )}

              {/* Botões rápidos com temas oficiais */}
              <div>
                <span style={{ display: 'block', fontSize: '0.70rem', color: 'var(--text-subtle)', marginBottom: '6px', fontWeight: 600 }}>
                  Ou toque em um dos temas oficiais para preencher direto:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {COMMON_TALK_THEMES.map((theme) => {
                    const isSelected = speakerTalk === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => {
                          setSpeakerTalk(theme);
                          setCustomTalk('');
                        }}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${isSelected ? '#7c3aed' : 'var(--border-base)'}`,
                          background: isSelected ? '#7c3aed' : '#ffffff',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paróquia ou ano opcional */}
              <div style={{ marginTop: '2px' }}>
                <label
                  htmlFor="speaker-talk-context"
                  style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '4px' }}
                >
                  Em qual paróquia ou ano você ministrou? (Opcional)
                </label>
                <input
                  id="speaker-talk-context"
                  type="text"
                  value={talkContext}
                  onChange={(e) => setTalkContext(e.target.value)}
                  placeholder="Ex: Paróquia São Benedito (2023)"
                  className="filter-input"
                  style={{ width: '100%', background: '#ffffff', fontSize: '0.80rem' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <SubmitButton busy={busy}>Salvar Alterações no Cadastro</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
