'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, EnvelopeSimple, Lock, Phone, User, Church, CalendarBlank } from '@phosphor-icons/react';

export function AuthForm() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [parish, setParish] = useState('');
  const [encounterInfo, setEncounterInfo] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error === 'credenciais_invalidas' ? 'E-mail ou senha incorretos.' : (data.error || 'Erro ao entrar.'));
      }

      window.location.href = data.targetUrl || '/';
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          parish,
          encounterInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar cadastro.');
      }

      setSuccessMsg(data.message || 'Cadastro enviado com sucesso! Verifique seu e-mail.');
      // Limpar campos
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setParish('');
      setEncounterInfo('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Abas de Navegação */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-canvas)',
          padding: '4px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          border: '1px solid var(--border-light)',
        }}
      >
        <button
          type="button"
          onClick={() => { setTab('signin'); setErrorMsg(null); }}
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '0.84rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: tab === 'signin' ? '#fff' : 'transparent',
            color: tab === 'signin' ? 'var(--brand-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'signin' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Entrar na conta
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setErrorMsg(null); }}
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '0.84rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: tab === 'signup' ? '#fff' : 'transparent',
            color: tab === 'signup' ? 'var(--brand-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'signup' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Solicitar cadastro
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.82rem',
            lineHeight: '1.45',
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <CheckCircle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#16a34a' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
              Solicitação enviada com sucesso!
            </strong>
            Enviamos um e-mail de confirmação para você. A Coordenação Diocesana fará a conferência da sua vivência nos quadrantes oficiais e liberará seu acesso em breve.
          </div>
        </div>
      )}

      {tab === 'signin' ? (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              E-mail de acesso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Sua senha
              </label>
              <Link href="/recuperar" style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', textDecoration: 'none' }}>
                Esqueceu a senha?
              </Link>
            </div>
            <input
              type="password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-primary"
            style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}
          >
            {loading ? 'Entrando...' : 'Entrar na conta'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Nome completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como consta no quadrante"
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                E-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                WhatsApp / Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(62) 99999-9999"
                className="filter-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Sua Paróquia atual
            </label>
            <input
              type="text"
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              placeholder="Ex.: Paróquia São Francisco de Assis"
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Quando você vivenciou o Segue-me?
            </label>
            <input
              type="text"
              value={encounterInfo}
              onChange={(e) => setEncounterInfo(e.target.value)}
              placeholder="Ex.: 1ª Etapa em 2019 na Paróquia São Benedito"
              className="filter-input"
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
              Ajuda a equipe a localizar o seu histórico nos quadrantes.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Crie uma senha de acesso * (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-primary"
            style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}
          >
            {loading ? 'Enviando solicitação...' : 'Enviar solicitação de cadastro'}
          </button>
        </form>
      )}
    </div>
  );
}
