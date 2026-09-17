"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, CircleNotch, MagnifyingGlass, X, WarningCircle, Info } from '@phosphor-icons/react';

import { number, date, initials, fieldName, readable } from '@/lib/format';
export { number, date, initials, fieldName, readable };

const statuses: Record<string, { label: string; tone: string }> = {
  confirmed: { label: 'Identificado', tone: 'green' }, verified: { label: 'Verificado', tone: 'green' }, identified: { label: 'Identificado', tone: 'green' },
  pending: { label: 'Em revisão', tone: 'amber' }, unverified: { label: 'A conferir', tone: 'neutral' }, incomplete: { label: 'Incompleto', tone: 'amber' },
  approved: { label: 'Aprovado', tone: 'green' }, rejected: { label: 'Não aprovado', tone: 'neutral' }, merged: { label: 'Mesclado', tone: 'neutral' },
  capturing: { label: 'Capturando', tone: 'blue' }, captured: { label: 'Capturado', tone: 'blue' }, reviewing: { label: 'Em análise', tone: 'blue' }, ready: { label: 'Pronto para revisar', tone: 'amber' }, applying: { label: 'Aplicando', tone: 'blue' }, completed: { label: 'Concluído', tone: 'green' }, failed: { label: 'Falha no processamento', tone: 'red' }, inconsistent: { label: 'Captura inconsistente', tone: 'red' },
  active: { label: 'Ativo', tone: 'green' }, suspended: { label: 'Acesso suspenso', tone: 'amber' },
};

export function Badge({ status, children, tone }: { status?: string; children?: ReactNode; tone?: string }) {
  const value = status ? statuses[status.toLowerCase()] : undefined;
  return <span className={`badge badge-${tone ?? value?.tone ?? 'neutral'}`}><span className="badge-dot" />{children ?? value?.label ?? status ?? 'Não informado'}</span>;
}

export function Avatar({ name, large = false, src }: { name: string; large?: boolean; src?: string | null }) {
  if (src) {
    return (
      <span
        aria-hidden="true"
        className={`avatar${large ? ' avatar-large' : ''}`}
        style={{ padding: 0, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
        />
      </span>
    );
  }
  return <span aria-hidden="true" className={`avatar${large ? ' avatar-large' : ''}`}>{initials(name)}</span>;
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><MagnifyingGlass size={27} weight="regular" /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Feedback({ message, error = false }: { message?: string; error?: boolean }) {
  if (!message) return null;
  return <div role={error ? 'alert' : 'status'} className={`feedback ${error ? 'feedback-error' : 'feedback-success'}`}>{error ? <WarningCircle size={20} /> : <CheckCircle size={20} />}<span>{message}</span></div>;
}

export function Note({ children }: { children: ReactNode }) { return <div className="note"><Info size={20} /><div>{children}</div></div>; }

export function SubmitButton({ busy, children, className = 'button-primary', style, ...props }: { busy: boolean; children: ReactNode; className?: string; disabled?: boolean; type?: 'submit' | 'button'; onClick?: () => void; style?: React.CSSProperties }) {
  return <button className={`button ${className}`} style={style} disabled={busy || props.disabled} {...props}>{busy ? <CircleNotch size={18} className="spin" aria-hidden="true" /> : null}{busy ? 'Aguarde…' : children}</button>;
}

export function Modal({ open, title, description, onClose, children, wide = false }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; if (open && element && !element.open) element.showModal(); if (!open && element?.open) element.close(); }, [open]);
  useEffect(() => { if (!open) return; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, [open]);
  return <dialog ref={dialog} className={`dialog${wide ? ' dialog-wide' : ''}`} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }} aria-labelledby="dialog-title"><div className="dialog-header"><div><h2 id="dialog-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" type="button" aria-label="Fermer la fenêtre" onClick={onClose}><X size={21} /></button></div><div className="dialog-body">{open && children}</div></dialog>;
}

export function Pagination({ total, page, pageSize, base, filters }: { total: number; page: number; pageSize: number; base: string; filters: Record<string, string> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (next: number) => { const q = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '')); q.set('page', String(next)); return `${base}?${q}`; };
  return <div className="pagination"><p>{total === 0 ? 'Nenhum resultado' : <><strong>{number((page - 1) * pageSize + 1)}–{number(Math.min(total, page * pageSize))}</strong> de {number(total)} registros</>}</p><div className="pagination-controls">{page > 1 ? <Link className="icon-button" aria-label="Página anterior" href={href(page - 1)}><ArrowLeft size={17} /></Link> : <button className="icon-button" disabled aria-label="Página anterior"><ArrowLeft size={17} /></button>}<span>Página <strong>{page}</strong> de {pages}</span>{page < pages ? <Link className="icon-button" aria-label="Próxima página" href={href(page + 1)}><ArrowRight size={17} /></Link> : <button className="icon-button" disabled aria-label="Próxima página"><ArrowRight size={17} /></button>}</div></div>;
}

export async function post(path: string, body: Record<string, unknown> = {}) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({})) as { error?: string; message?: string; redirect?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(result.error || result.message || 'Não foi possível concluir. Tente novamente.');
  return result;
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<void>) { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.'); } finally { setBusy(false); } }
  return { busy, error, message, setMessage, run };
}
