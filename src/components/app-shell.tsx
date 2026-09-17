"use client";

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ArrowsClockwise, BookOpen, Buildings, CalendarBlank, CaretDown, GearSix, House, List, MagnifyingGlass, MicrophoneStage, Path, Scroll, ShieldCheck, SignOut, UsersThree, X } from '@phosphor-icons/react';
import type { Viewer } from '@/lib/types';
import { Avatar } from './ui';

const navigation = [
  { href: '/', label: 'Visão geral', icon: House },
  { href: '/pessoas', label: 'Pessoas', icon: UsersThree },
  { href: '/encontros', label: 'Encontros', icon: CalendarBlank },
  { href: '/mandatos', label: 'Mandatos', icon: Scroll },
  { href: '/palestrantes', label: 'Palestrantes', icon: MicrophoneStage },
  { href: '/setores', label: 'Setores e Paróquias', icon: Buildings },
  { href: '/pendencias', label: 'Pendências', icon: ShieldCheck },
  { href: '/importacoes', label: 'Importações', icon: ArrowsClockwise },
];
const roles = {
  participant: 'Usuário Comum',
  reviewer: 'Acesso Paroquial (Equipe Dirigente)',
  admin: 'Coordenação Diocesana (Acesso Geral)'
};

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand${light ? ' brand-light' : ''}`}>
      <span className="brand-symbol" style={{ background: '#fff', border: '1.5px solid var(--brand-primary)', padding: '2px' }}>
        <img
          src="/logo-segue-me.png"
          alt="Logo Oficial Segue-me Diocese de Anápolis"
          width={34}
          height={34}
          style={{ objectFit: 'contain', borderRadius: '50%' }}
        />
      </span>
      <span className="brand-words">
        Segue-me
        <small>DIOCESE DE ANÁPOLIS</small>
      </span>
    </span>
  );
}

export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const staff = viewer.role !== 'participant';
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { if (!mobileOpen) return; const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); }; window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle); }, [mobileOpen]);

  const navItems = viewer.role === 'admin'
    ? navigation
    : navigation.filter((item) => item.href !== '/importacoes');

  const title = navItems.find((item) => active(item.href))?.label ?? (pathname.startsWith('/me') ? 'Meu histórico' : pathname.startsWith('/gestao') ? 'Gestão de acessos' : 'Sistema Segue-me');

  const workspaceSubtitle = viewer.role === 'admin'
    ? 'Coordenação Diocesana · Diocese de Anápolis'
    : viewer.role === 'reviewer'
    ? `Acesso Paroquial · ${viewer.parish || 'Equipe Dirigente'}`
    : 'Portal do participante';

  return <div className="app-layout">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    {mobileOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`} aria-label="Menu principal">
      <div className="sidebar-brand"><Link href={staff ? '/' : '/me'} aria-label="Segue-me, início"><Brand /></Link><button type="button" className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={22} /></button></div>
      <div className="workspace-label"><span className="workspace-dot" />{workspaceSubtitle}</div>
      {staff && <><p className="nav-caption">ESPAÇO DE TRABALHO</p><nav>{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item${active(href) ? ' nav-active' : ''}`} aria-current={active(href) ? 'page' : undefined}><Icon size={21} weight={active(href) ? 'fill' : 'regular'} /><span>{label}</span>{active(href) && <span className="nav-active-dot" />}</Link>)}</nav></>}
      <p className="nav-caption">MEU ESPAÇO</p><nav><Link href="/me" className={`nav-item${active('/me') ? ' nav-active' : ''}`} aria-current={active('/me') ? 'page' : undefined}><BookOpen size={21} weight={active('/me') ? 'fill' : 'regular'} /><span>Meu histórico</span></Link>{viewer.role === 'admin' && <Link href="/gestao" className={`nav-item${active('/gestao') ? ' nav-active' : ''}`}><GearSix size={21} /><span>Gestão de acessos</span></Link>}</nav>
      <div className="sidebar-bottom"><div className="sidebar-mission"><span className="mission-line" /><p>Documentação da Base<br /><em>Diocese de Anápolis</em></p><span>Mapeamento de quem já vivenciou o encontro em todas as paróquias.</span></div><div className="sidebar-user"><Avatar name={viewer.name} /><div><strong>{viewer.name}</strong><span>{roles[viewer.role]}</span></div><form action="/api/auth/signout" method="post"><button className="icon-button" aria-label="Sair da conta" title="Sair da conta"><SignOut size={20} /></button></form></div></div>
    </aside>
    <div className="main-layout">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" aria-expanded={mobileOpen}>
            <List size={23} />
          </button>
          <Link href={staff ? '/' : '/me'} className="topbar-mobile-brand" aria-label="Início Segue-me">
            <span className="brand-symbol" style={{ width: '32px', height: '32px', background: '#fff', border: '1.5px solid var(--brand-primary)', padding: '2px', borderRadius: '8px' }}>
              <img
                src="/logo-segue-me.png"
                alt="Logo Segue-me"
                width={26}
                height={26}
                style={{ objectFit: 'contain', borderRadius: '50%' }}
              />
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
              Segue-me
            </span>
          </Link>
          {staff && (
            <form className="topbar-search" action="/pessoas" role="search">
              <MagnifyingGlass size={18} />
              <input aria-label="Buscar pessoa em toda a base" type="search" name="q" placeholder="Encontre uma pessoa…" />
              <kbd>↵</kbd>
            </form>
          )}
        </div>
        <div className="topbar-right">
          <details className="account-menu">
            <summary aria-label="Opções da conta">
              <Avatar name={viewer.name} />
              <CaretDown size={13} />
            </summary>
            <div className="account-dropdown">
              <strong>{viewer.name}</strong>
              <span>{viewer.email}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--brand-primary)', fontWeight: 600, padding: '2px 0' }}>{roles[viewer.role]}</span>
              <Link href="/me">Meu histórico <ArrowUpRight size={15} /></Link>
              <form action="/api/auth/signout" method="post">
                <button><SignOut size={17} />Sair da conta</button>
              </form>
            </div>
          </details>
        </div>
      </header>
      {viewer.demo && (
        <div className="demo-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="demo-dot" />
            <span>Perfil Ativo: <strong>{roles[viewer.role]}</strong>{viewer.parish ? ` (${viewer.parish})` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginRight: '2px' }}>Testar perfil:</span>
            <form action="/api/demo/switch-role" method="post" style={{ display: 'inline', margin: 0 }}>
              <input type="hidden" name="role" value="admin" />
              <button
                type="submit"
                className={`button ${viewer.role === 'admin' ? 'button-primary' : 'button-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem', height: 'auto', cursor: 'pointer' }}
              >
                1. Coordenação Diocesana
              </button>
            </form>
            <form action="/api/demo/switch-role" method="post" style={{ display: 'inline', margin: 0 }}>
              <input type="hidden" name="role" value="reviewer" />
              <button
                type="submit"
                className={`button ${viewer.role === 'reviewer' ? 'button-primary' : 'button-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem', height: 'auto', cursor: 'pointer' }}
              >
                2. Acesso Paroquial (São Francisco)
              </button>
            </form>
            <form action="/api/demo/switch-role" method="post" style={{ display: 'inline', margin: 0 }}>
              <input type="hidden" name="role" value="participant" />
              <button
                type="submit"
                className={`button ${viewer.role === 'participant' ? 'button-primary' : 'button-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem', height: 'auto', cursor: 'pointer' }}
              >
                3. Usuário Comum
              </button>
            </form>
          </div>
        </div>
      )}
      <main id="conteudo" className="main-content" tabIndex={-1}>{children}</main>
      <footer className="app-footer">
        <span>Sistema Segue-me <span className="footer-dot">·</span> Diocese de Anápolis</span>
        <span><ShieldCheck size={14} />Acesso restrito a participantes autorizados</span>
      </footer>
    </div>
  </div>;
}
