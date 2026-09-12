import { NextResponse, type NextRequest } from 'next/server';
import { isDemoMode } from '@/lib/config';

export async function POST(request: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Modo de demonstração inativo' }, { status: 403 });
  }

  const formData = await request.formData();
  const role = formData.get('role')?.toString() || 'admin';
  const targetUrl = role === 'participant' ? '/me' : '/';

  const response = NextResponse.redirect(new URL(targetUrl, request.url), { status: 303 });
  response.cookies.set('demo_role', role, { path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}
