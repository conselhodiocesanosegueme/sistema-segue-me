import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito à Coordenação Diocesana.' }, { status: 403 });
    }

    if (isDemoMode()) {
      return NextResponse.json({
        users: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            email: 'coordenacao.diocesana@example.invalid',
            full_name: 'Coordenação Diocesana',
            role: 'admin',
            parish: null,
            created_at: new Date().toISOString(),
          },
          {
            id: '00000000-0000-4000-8000-000000000002',
            email: 'dirigente.saofrancisco@example.invalid',
            full_name: 'Equipe Dirigente · São Francisco de Assis',
            role: 'reviewer',
            parish: 'Paróquia São Francisco de Assis',
            created_at: new Date().toISOString(),
          },
          {
            id: '00000000-0000-4000-8000-000000000003',
            email: 'participante@example.invalid',
            full_name: 'Participante Fictício',
            role: 'participant',
            parish: null,
            created_at: new Date().toISOString(),
          },
        ],
      });
    }

    const adminClient = supabaseAdmin();

    // 1. Obter usuários do Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // 2. Obter perfis da tabela app_users
    const { data: profiles, error: profilesError } = await adminClient
      .from('app_users')
      .select('*');

    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const users = authData.users.map((u) => {
      const p = profilesMap.get(u.id);
      return {
        id: u.id,
        email: u.email || '',
        full_name: p?.full_name || (u.user_metadata?.full_name as string) || 'Sem nome',
        role: p?.role || (u.user_metadata?.role as string) || 'reviewer',
        parish: p?.parish || (u.user_metadata?.parish as string) || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar usuários' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito à Coordenação Diocesana.' }, { status: 403 });
    }

    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const fullName = (body.full_name || '').trim();
    const parish = (body.parish || '').trim() || null;
    const role = (body.role || 'reviewer').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail institucional inválido.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'A senha deve conter no mínimo 6 caracteres.' }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: 'O nome da conta / equipe dirigente é obrigatório.' }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json(
        {
          success: true,
          user: {
            id: `demo-${Date.now()}`,
            email,
            full_name: fullName,
            role,
            parish,
            created_at: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }

    const adminClient = supabaseAdmin();

    // 1. Criar usuário no Supabase Auth com confirmação direta de e-mail
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        parish,
        role,
      },
    });

    if (createError || !authData.user) {
      return NextResponse.json({ error: createError?.message || 'Falha ao criar usuário.' }, { status: 400 });
    }

    // 2. Persistir/sincronizar na tabela app_users
    try {
      await adminClient.from('app_users').upsert({
        id: authData.user.id,
        full_name: fullName,
        role,
        parish,
      });
    } catch (e) {
      console.warn('Não foi possível salvar paróquia em app_users, utilizando user_metadata:', e);
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          parish,
          created_at: authData.user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar usuário' }, { status: 500 });
  }
}
