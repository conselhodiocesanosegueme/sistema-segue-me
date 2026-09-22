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
  CheckCircle,
  PencilSimple,
} from '@phosphor-icons/react';
import { Modal, SubmitButton, Feedback } from '@/components/ui';
import { DIOCESAN_SECTORS } from '@/lib/sectors';
import type { Person } from '@/lib/types';

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
  const [isSpeaker, setIsSpeaker] = useState(() => {
    try {
      const parsed = typeof person.notes === 'string' ? JSON.parse(person.notes) : (person.notes || {});
      return Boolean(parsed.is_speaker);
    } catch {
      return false;
    }
  });

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

      const payload = {
        name: trimmedName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        birth_date_text: birthDate.trim() || null,
        parish: parish.trim() || null,
        is_speaker: isSpeaker,
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

        {/* Seção de Palestrante / Formação */}
        <div
          style={{
            background: isSpeaker ? '#faf5ff' : 'var(--bg-canvas)',
            border: `1.5px solid ${isSpeaker ? '#d8b4fe' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            transition: 'all 0.18s ease',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
            <input
              type="checkbox"
              checked={isSpeaker}
              onChange={(e) => setIsSpeaker(e.target.checked)}
              style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#7c3aed' }}
            />
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: isSpeaker ? '#6d28d9' : 'var(--text-main)' }}>
                <MicrophoneStage size={16} weight={isSpeaker ? 'fill' : 'regular'} />
                Atuo como Palestrante / Pregador no Segue-me
              </strong>
              <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                Marque esta opção caso você já ministre ou esteja disponível para ministrar palestras e testemunhos nos encontros do Segue-me da Diocese.
              </span>
            </div>
          </label>
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
