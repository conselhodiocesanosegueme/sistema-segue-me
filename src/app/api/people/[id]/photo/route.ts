import { NextResponse, type NextRequest } from 'next/server';
import { authorize, apiError, HttpError } from '@/lib/http';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await authorize(request, undefined, 10_000_000);
    const { id: personId } = await context.params;

    if (!personId) {
      throw new HttpError(400, 'ID da pessoa não informado.');
    }

    const admin = supabaseAdmin();

    // Se o usuário for participante comum, ele só pode alterar a sua própria ficha vinculada
    if (viewer.role === 'participant') {
      const { data: link } = await admin
        .from('account_links')
        .select('id')
        .eq('user_id', viewer.id)
        .eq('person_id', personId)
        .eq('status', 'active')
        .maybeSingle();

      if (!link) {
        throw new HttpError(403, 'Você só pode alterar a foto do seu próprio perfil.');
      }
    }

    const formData = await request.formData();
    const action = formData.get('action')?.toString();
    const file = formData.get('photo') as File | null;

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        photo_url: action === 'remove' ? null : '/logo-segue-me.png',
        message: 'Foto atualizada no modo de demonstração.',
      });
    }

    // 1. Remover foto
    if (action === 'remove') {
      try {
        await admin.from('people').update({ photo_url: null }).eq('id', personId);
      } catch {
        // fallback
      }

      // Limpar também no JSON do notes se houver
      const { data: p } = await admin.from('people').select('notes').eq('id', personId).single();
      if (p?.notes) {
        try {
          const notesObj = JSON.parse(p.notes);
          delete notesObj.photo_url;
          await admin.from('people').update({ notes: JSON.stringify(notesObj) }).eq('id', personId);
        } catch {}
      }

      return NextResponse.json({ success: true, photo_url: null });
    }

    // 2. Upload de nova foto
    if (!file || typeof file === 'string') {
      throw new HttpError(400, 'Nenhum arquivo de imagem foi enviado.');
    }

    const mimeType = file.type || 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      throw new HttpError(400, 'Formato inválido. Envie uma imagem (JPG, PNG, WebP).');
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new HttpError(400, 'A imagem deve ter no máximo 5MB.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filePath = `person-${personId}-${Date.now()}.${ext}`;

    // Upload para o bucket publico 'avatars'
    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[PHOTO] Erro no upload Supabase Storage:', uploadError);
      throw new HttpError(500, `Falha ao salvar imagem no servidor: ${uploadError.message}`);
    }

    const { data: publicUrlData } = admin.storage.from('avatars').getPublicUrl(filePath);
    const photoUrl = publicUrlData.publicUrl;

    // 3. Atualizar photo_url na tabela people com tolerância a falha
    const { error: updateError } = await admin
      .from('people')
      .update({ photo_url: photoUrl })
      .eq('id', personId);

    if (updateError) {
      console.warn('[PHOTO] Coluna photo_url ainda não existe em people, salvando no notes como fallback:', updateError.message);
      const { data: currentPerson } = await admin.from('people').select('notes').eq('id', personId).single();
      let notesObj: Record<string, any> = {};
      try {
        notesObj = JSON.parse(currentPerson?.notes || '{}');
      } catch {
        notesObj = { raw_notes: currentPerson?.notes || '' };
      }
      notesObj.photo_url = photoUrl;
      await admin.from('people').update({ notes: JSON.stringify(notesObj) }).eq('id', personId);
    }

    return NextResponse.json({
      success: true,
      photo_url: photoUrl,
      message: 'Foto de perfil salva com sucesso!',
    });
  } catch (error) {
    return apiError(error);
  }
}
