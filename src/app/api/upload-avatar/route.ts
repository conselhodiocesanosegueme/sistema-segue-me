import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData.get('photo') || formData.get('file')) as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Nenhum arquivo de imagem foi enviado.' }, { status: 400 });
    }

    const mimeType = file.type || 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'Formato inválido. Envie uma imagem (JPG, PNG ou WebP).' }, { status: 400 });
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB.' }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        url: '/logo-segue-me.png',
        message: 'Upload simulado no modo de demonstração.',
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filePath = `signup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const admin = supabaseAdmin();
    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[UPLOAD-AVATAR] Erro no Supabase Storage:', uploadError);
      return NextResponse.json(
        { error: `Falha ao salvar imagem no servidor: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = admin.storage.from('avatars').getPublicUrl(filePath);
    const photoUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      url: photoUrl,
    });
  } catch (error: any) {
    console.error('[UPLOAD-AVATAR] Erro geral:', error);
    return NextResponse.json(
      { error: error.message || 'Erro inesperado ao processar upload.' },
      { status: 500 }
    );
  }
}
