'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, CircleNotch, Lock, ShieldCheck, WarningCircle, Eye, EyeSlash } from '@phosphor-icons/react';

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível redefinir a senha.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir a senha. Tente solicitar um novo link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(ellipse at top, #eef7f2 0%, #f8f8f5 60%)' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#fff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/entrar" className="text-link" style={{ fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Voltar para o login
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '74px', height: '74px', borderRadius: '50%', background: '#fff', border: '2.5px solid var(--brand-primary)', boxShadow: '0 3px 10px rgba(180, 83, 9, 0.12)', marginBottom: '12px', padding: '3px' }}>
            <img
              src="/logo-segue-me.png"
              alt="Logo Oficial Segue-me Diocese de Anápolis"
              width={66}
              height={66}
              style={{ objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--brand-primary)', lineHeight: 1.2 }}>
            Nova Senha
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.45' }}>
            {isSuccess
              ? 'Sua senha foi redefinida com sucesso!'
              : 'Defina a sua nova senha de acesso ao portal do Segue-me.'}
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={32} weight="fill" />
            </div>

            <h3 style={{ fontSize: '1.15rem', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>
              Senha Alterada com Sucesso!
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5, marginBottom: '24px' }}>
              Sua nova senha já está ativa. Entrando diretamente no sistema…
            </p>

            <a
              href="/"
              className="button button-primary"
              style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'inline-block' }}
            >
              Acessar o Sistema Agora
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                <WarningCircle size={18} weight="bold" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Nova Senha
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-subtle)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  disabled={isSubmitting}
                  className="filter-input"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-subtle)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Confirmar Nova Senha
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-subtle)' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  disabled={isSubmitting}
                  className="filter-input"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-subtle)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="button button-primary"
              style={{
                width: '100%',
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? <CircleNotch size={18} className="spin" /> : <Lock size={18} />}
              <span>{isSubmitting ? 'Salvando nova senha…' : 'Salvar Nova Senha'}</span>
            </button>
          </form>
        )}

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          <ShieldCheck size={16} />
          Conexão segura com criptografia oficial
        </div>
      </div>
    </div>
  );
}
