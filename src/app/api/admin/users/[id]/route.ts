import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito à Coordenação Diocesana.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { password, full_name, parish, role } = body;

    if (password && password.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json({ success: true, message: 'Dados atualizados no modo de demonstração.' });
    }

    const adminClient = supabaseAdmin();

    // 1. Atualizar credenciais no Auth
    const authUpdates: Record<string, any> = {};
    if (password) authUpdates.password = password;
    if (full_name || parish || role) {
      authUpdates.user_metadata = {};
      if (full_name) authUpdates.user_metadata.full_name = full_name;
      if (parish !== undefined) authUpdates.user_metadata.parish = parish;
      if (role) authUpdates.user_metadata.role = role;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(id, authUpdates);
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // 2. Atualizar perfil em app_users
    const profileUpdates: Record<string, any> = {};
    if (full_name) profileUpdates.full_name = full_name;
    if (parish !== undefined) profileUpdates.parish = parish;
    if (role) profileUpdates.role = role;

    if (Object.keys(profileUpdates).length > 0) {
      await adminClient.from('app_users').update(profileUpdates).eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
