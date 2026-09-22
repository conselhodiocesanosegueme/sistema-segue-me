import { NextResponse, type NextRequest } from 'next/server';
import { authorize, apiError, HttpError } from '@/lib/http';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config';
import { mutateDemo } from '@/lib/demo';

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
      let profilePersonId: string | null = null;
      try {
        const db = await supabaseServer();
        const { data: profileData } = await db.rpc('get_my_profile');
        if (profileData && (profileData as any).id) {
          profilePersonId = (profileData as any).id;
        }
      } catch {}

      const linkRes = await admin
        .from('account_links')
        .select('id')
        .eq('user_id', viewer.id)
        .eq('person_id', personId)
        .eq('status', 'active')
        .maybeSingle();

      const isLinked = Boolean(linkRes.data) || profilePersonId === personId;
      if (!isLinked) {
        throw new HttpError(403, 'Você só pode alterar a foto do seu próprio perfil.');
      }
    }

    const formData = await request.formData();
    const action = formData.get('action')?.toString();
    const file = formData.get('photo') as File | null;

    if (isDemoMode()) {
      let photoUrl: string | null = null;
      if (action !== 'remove' && file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'image/jpeg';
        photoUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }

      await mutateDemo((state) => {
        const p = state.people.find((pe) => pe.id === personId);
        if (p) {
          p.photo_url = photoUrl;
          let notesObj: any = {};
          try {
            if (p.notes) notesObj = JSON.parse(p.notes);
          } catch {}
          if (photoUrl) {
            notesObj.photo_url = photoUrl;
          } else {
            delete notesObj.photo_url;
          }
          p.notes = JSON.stringify(notesObj);
        }
      });

      return NextResponse.json({
        success: true,
        photo_url: photoUrl,
        message: action === 'remove' ? 'Foto removida com sucesso.' : 'Foto atualizada no modo de demonstração.',
      });
    }

    // 1. Remover foto
    if (action === 'remove') {
      try {
        await admin.from('people').update({ photo_url: null }).eq('id', personId);
      } catch {}

      // Limpar também no JSON do notes se houver
      const { data: p } = await admin.from('people').select('notes').eq('id', personId).single();
      if (p?.notes) {
        try {
          const notesObj = JSON.parse(p.notes);
          delete notesObj.photo_url;
          await admin.from('people').update({ notes: JSON.stringify(notesObj) }).eq('id', personId);
        } catch {}
      }

      if (viewer.id) {
        try {
          await admin.from('app_users').update({ photo_url: null }).eq('id', viewer.id);
          await admin.auth.admin.updateUserById(viewer.id, {
            user_metadata: { photo_url: null, avatar_url: null }
          });
        } catch {}
      }

      return NextResponse.json({ success: true, photo_url: null, message: 'Foto removida com sucesso.' });
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

    // Garantir que o bucket avatars existe
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      if (!buckets?.some((b) => b.name === 'avatars')) {
        await admin.storage.createBucket('avatars', { public: true });
      }
    } catch (bucketErr) {
      console.warn('[PHOTO] Aviso ao verificar bucket avatars:', bucketErr);
    }

    // Upload para o bucket publico 'avatars'
    let photoUrl = '';
    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[PHOTO] Erro no upload Supabase Storage, utilizando fallback Base64 Data URI:', uploadError.message);
      photoUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    } else {
      const { data: publicUrlData } = admin.storage.from('avatars').getPublicUrl(filePath);
      photoUrl = publicUrlData.publicUrl;
    }

    // 3. Atualizar photo_url na tabela people com tolerância a falha
    await admin
      .from('people')
      .update({ photo_url: photoUrl })
      .eq('id', personId);

    // Salvar também no notes JSON como garantia adicional
    const { data: currentPerson } = await admin.from('people').select('notes').eq('id', personId).single();
    let notesObj: Record<string, any> = {};
    try {
      notesObj = JSON.parse(currentPerson?.notes || '{}');
    } catch {
      notesObj = { raw_notes: currentPerson?.notes || '' };
    }
    notesObj.photo_url = photoUrl;
    await admin.from('people').update({ notes: JSON.stringify(notesObj) }).eq('id', personId);

    // Sincronizar também com app_users e auth metadata se houver usuário autenticado
    if (viewer.id) {
      try {
        await admin.from('app_users').update({ photo_url: photoUrl }).eq('id', viewer.id);
        await admin.auth.admin.updateUserById(viewer.id, {
          user_metadata: { photo_url: photoUrl, avatar_url: photoUrl }
        });
      } catch {}
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
