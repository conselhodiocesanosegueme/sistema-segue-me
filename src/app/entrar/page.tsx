import Link from 'next/link';
import { Lock, EnvelopeSimple, ArrowRight, ShieldCheck, Path } from '@phosphor-icons/react/dist/ssr';
import { isDemoMode } from '@/lib/config';

export default async function EntrarPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const demo = isDemoMode();
  const params = await searchParams;
  const error = params?.error;

  const errorMessages: Record<string, string> = {
    credenciais_invalidas: 'E-mail ou senha incorretos. Verifique suas credenciais.',
    campos_obrigatorios: 'Por favor, informe seu e-mail e sua senha de acesso.',
    erro_servidor: 'Ocorreu um erro ao validar seu acesso. Tente novamente em instantes.',
    auth_failed: 'Falha na verificação de acesso. Solicite um novo link.',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(ellipse at top, #eef7f2 0%, #f8f8f5 60%)' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#fff', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', boxShadow: 'var(--shadow-xl)' }}>
        {/* Marca Oficial */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', borderRadius: '50%', background: '#fff', border: '3px solid var(--brand-primary)', boxShadow: '0 4px 12px rgba(180, 83, 9, 0.15)', marginBottom: '14px', padding: '4px' }}>
            <img
              src="/logo-segue-me.png"
              alt="Logo Oficial Segue-me Diocese de Anápolis"
              width={80}
              height={80}
              style={{ objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--brand-primary)', lineHeight: 1.15 }}>
            Sistema Segue-me
          </h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
            Diocese de Anápolis
          </p>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
            Documentação da base de participantes e paróquias que já vivenciaram o Segue-me.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.84rem', lineHeight: '1.45' }}>
            {errorMessages[error] || 'Não foi possível entrar. Verifique seus dados.'}
          </div>
        )}

        {demo && (
          <div style={{ marginBottom: '24px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', textAlign: 'center' }}>
            <span className="badge badge-green" style={{ marginBottom: '8px' }}>
              Modo de Demonstração Ativo
            </span>
            <p style={{ fontSize: '0.84rem', color: 'var(--brand-text)', lineHeight: '1.45', marginBottom: '14px' }}>
              Escolha abaixo o nível de acesso para testar os perfis e permissões do sistema:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <form action="/api/demo/switch-role" method="post">
                <input type="hidden" name="role" value="admin" />
                <button type="submit" className="button button-primary" style={{ width: '100%', fontSize: '0.82rem' }}>
                  1. Coordenação Diocesana (Acesso Geral) <ArrowRight size={17} />
                </button>
              </form>
              <form action="/api/demo/switch-role" method="post">
                <input type="hidden" name="role" value="reviewer" />
                <button type="submit" className="button button-secondary" style={{ width: '100%', background: '#fff', fontSize: '0.82rem' }}>
                  2. Acesso Paroquial (Equipe Dirigente · São Francisco) <ArrowRight size={17} />
                </button>
              </form>
              <form action="/api/demo/switch-role" method="post">
                <input type="hidden" name="role" value="participant" />
                <button type="submit" className="button button-secondary" style={{ width: '100%', background: '#fff', fontSize: '0.82rem' }}>
                  3. Usuário Comum (Meu Histórico) <ArrowRight size={17} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Formulário Oficial */}
        <form action="/api/auth/signin" method="post" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              E-mail de acesso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
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
              name="password"
              placeholder="••••••••"
              required
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '8px' }}>
            Entrar na conta
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-canvas)', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45', textAlign: 'center' }}>
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>Análise e autorização de acesso</strong>
          Ao criar seu cadastro, a solicitação passa por análise da equipe diocesana para confirmar que você já vivenciou o Segue-me antes de liberar a visualização.
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          <ShieldCheck size={16} />
          Acesso restrito e autorizado pela equipe
        </div>
      </div>
    </div>
  );
}
