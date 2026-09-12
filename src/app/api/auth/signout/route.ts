import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function POST(request: NextRequest) {
  if (!isDemoMode()) {
    try {
      const supabase = await supabaseServer();
      await supabase.auth.signOut();
    } catch {
      // Ignora erro se não conectado
    }
  }

  return NextResponse.redirect(new URL('/entrar', request.url), { status: 303 });
}
