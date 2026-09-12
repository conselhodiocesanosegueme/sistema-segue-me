'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, EnvelopeSimple, Lock, User, ShieldCheck } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

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

  async function handleGoogleSignIn() {
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.sistemasegueme.com.br';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/confirm?next=/me`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível conectar com o Google. Verifique se o provedor está ativo no painel.');
      setLoading(false);
    }
  }

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
      setErrorMsg(err?.message || 'Erro ao realizar login.');
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar cadastro.');
      }

      setSuccessMsg(data.message || 'Cadastro realizado! Verifique sua caixa de entrada.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Botão Oficial do Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="button button-secondary"
        style={{
          width: '100%',
          padding: '12px 16px',
          justifyContent: 'center',
          background: '#ffffff',
          border: '1px solid var(--border-base)',
          fontWeight: 600,
          fontSize: '0.88rem',
          color: 'var(--text-main)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continuar com o Google
      </button>

      {/* Divisor Visual */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 16px', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ou com e-mail
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
      </div>

      {/* Abas de Navegação */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-canvas)',
          padding: '4px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '18px',
          border: '1px solid var(--border-light)',
        }}
      >
        <button
          type="button"
          onClick={() => { setTab('signin'); setErrorMsg(null); }}
          style={{
            flex: 1,
            padding: '9px 12px',
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
            padding: '9px 12px',
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
          Criar cadastro
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
              Conta criada com sucesso!
            </strong>
            Enviamos um e-mail de confirmação para você. Faça login para informar os dados do seu encontro e vincular seu histórico oficial!
          </div>
        </div>
      )}

      {tab === 'signin' ? (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
              E-mail de acesso
            </label>
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

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
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
            style={{ width: '100%', marginTop: '6px', justifyContent: 'center' }}
          >
            {loading ? 'Entrando...' : 'Entrar na conta'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
              Seu nome completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome como saía no crachá ou quadrante"
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
              Seu e-mail *
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
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
              Você receberá as notificações e confirmações neste e-mail.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>
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

          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-light)',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
            }}
          >
            🛡️ Ao criar sua conta, na próxima tela você poderá informar os encontros que vivenciou ou trabalhou para que o Conselho Diocesano valide seu histórico.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-primary"
            style={{ width: '100%', marginTop: '4px', justifyContent: 'center' }}
          >
            {loading ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>
      )}
    </div>
  );
}
