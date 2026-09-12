"use client";

import { useState } from 'react';
import { ArrowsClockwise, CloudArrowDown } from '@phosphor-icons/react';
import { SubmitButton, Feedback, post } from '@/components/ui';

export function ImportActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSync() {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await post('/api/imports', { action: 'capture' });
      setSuccess((res.message as string) || 'Verificação da planilha iniciada com sucesso.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar com a planilha.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Feedback message={error} error />
      <Feedback message={success} />
      <SubmitButton busy={busy} onClick={handleSync} className="button-primary">
        <ArrowsClockwise size={17} />
        Buscar atualizações na planilha
      </SubmitButton>
    </div>
  );
}
