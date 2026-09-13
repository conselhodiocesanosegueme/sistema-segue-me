import 'server-only';
import { NextResponse } from 'next/server';
import { getViewer } from './auth';
import type { Role } from './types';
import { appOrigin, isDemoMode } from './config';
import { ZodError } from 'zod';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function authorize(request: Request, roles?: Role[], maxContentLength = 100_000) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const requestOrigin = new URL(request.url).origin;
    if (!origin || (origin !== appOrigin() && origin !== requestOrigin)) throw new HttpError(403, 'Origem da solicitação não permitida.');
    const length = Number(request.headers.get('content-length') || 0);
    if (length > maxContentLength) throw new HttpError(413, 'Solicitação muito grande.');
  }
  const viewer = await getViewer();
  if (!viewer) throw new HttpError(401, 'Entre na sua conta para continuar.');
  if (roles && !roles.includes(viewer.role)) throw new HttpError(403, 'Seu perfil não permite esta ação.');
  return viewer;
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 100_000) throw new HttpError(413, 'Solicitação muito grande.');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Confira os dados enviados.'); }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: 'Confira os campos e preencha a justificativa.' }, { status: 400 });
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  console.error('request_failed', { code: code || 'internal' });
  const message = code === '40001' ? 'O registro mudou. Atualize a página e revise novamente.' : code === '42501' ? 'Você não tem permissão para esta ação.' : code === '23505' ? 'Este vínculo ou registro já existe. Revise antes de continuar.' : 'Não foi possível concluir. Atualize a página e tente novamente.';
  return NextResponse.json({ error: message }, { status: code === '40001' || code === '23505' ? 409 : code === '42501' ? 403 : 500 });
}
export function checkDb(error: unknown) { if (error) throw error; }
