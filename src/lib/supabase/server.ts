import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isConfigured } from '@/lib/config';

export async function supabaseServer() {
  if (!isConfigured()) throw new Error('CONFIGURATION_REQUIRED');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Read-only server render. Proxy refreshes cookies. */ } },
    },
  });
}
export function supabaseAdmin() {
  if (!isConfigured() || !process.env.SUPABASE_SECRET_KEY) throw new Error('CONFIGURATION_REQUIRED');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
