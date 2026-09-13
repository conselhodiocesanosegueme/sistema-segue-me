import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body?.password?.toString();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Senha atualizada com sucesso no modo de demonstração.',
      });
    }

    const supabase = await supabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Sessão de recuperação expirada ou inválida. Solicite um novo link.' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao redefinir a senha: ${updateError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erro ao processar alteração de senha.' },
      { status: 500 }
    );
  }
}
