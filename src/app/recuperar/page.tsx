import Link from 'next/link';
import { ArrowLeft, EnvelopeSimple, Path, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

export default function RecuperarPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(ellipse at top, #eef7f2 0%, #f8f8f5 60%)' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#fff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/entrar" className="text-link" style={{ fontSize: '0.84rem' }}>
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
            Recuperar Senha
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.45' }}>
            Informe o e-mail cadastrado na sua conta. Enviaremos um link seguro para você redefinir sua senha.
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              E-mail cadastrado
            </label>
            <input
              type="email"
              placeholder="seu.email@exemplo.com"
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '6px' }}>
            Enviar instruções de recuperação
          </button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          <ShieldCheck size={16} />
          Instruções enviadas com criptografia
        </div>
      </div>
    </div>
  );
}
