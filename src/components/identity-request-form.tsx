"use client";

import { useState } from 'react';
import { IdentificationCard, PaperPlaneTilt } from '@phosphor-icons/react';
import { SubmitButton, Feedback, post } from '@/components/ui';

export function IdentityRequestForm() {
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (!name.trim()) throw new Error('Informe seu nome completo.');
      if (!context.trim()) throw new Error('Informe detalhes para ajudar a equipe a identificar seu cadastro.');

      await post('/api/identity', {
        name: name.trim(),
        context: context.trim(),
      });

      setSuccess('Solicitação enviada! Nossa equipe fará a análise na base diocesana para autorizar e confirmar sua vivência no Segue-me.');
      setName('');
      setContext('');
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Feedback message={error} error />
      <Feedback message={success} />

      <div>
        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
          Seu Nome Completo
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome como costumava constar no crachá ou quadrante"
          required
          className="filter-input"
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
          Detalhes para Identificação (Ano do encontro, Paróquia, Equipes)
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Ex: Vivenciei no 12º Segue-me em 2021 na Paróquia São Francisco de Assis, depois trabalhei na Cozinha em 2022..."
          required
          rows={4}
          className="filter-input"
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div style={{ marginTop: '8px' }}>
        <SubmitButton busy={busy} type="submit" className="button-primary">
          <PaperPlaneTilt size={17} />
          Enviar para análise e confirmação da equipe
        </SubmitButton>
      </div>
    </form>
  );
}
