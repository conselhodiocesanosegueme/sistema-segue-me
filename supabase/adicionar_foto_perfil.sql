-- ====================================================================
-- MIGRAÇÃO: Adicionar suporte a Foto de Perfil nas fichas de participantes
-- ====================================================================

-- 1. Adicionar coluna photo_url na tabela oficial de pessoas
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Adicionar coluna photo_url na tabela de usuários do sistema
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS photo_url text;

-- 3. Atualizar private.get_my_profile para incluir photo_url
create or replace function private.get_my_profile() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; begin
  perform private.require_user();
  select jsonb_build_object('id',p.id,'legacy_id',p.legacy_id,'name',p.name,'phone',p.phone,'email',p.email,
    'birth_date_text',p.birth_date_text,'sex',p.sex,'identification_status',p.identification_status,'version',p.version,
    'photo_url', coalesce(p.photo_url, (p.notes::jsonb->>'photo_url')))
  into result from public.account_links l join public.people p on p.id=l.person_id
  where l.user_id=auth.uid() and l.status='active' and p.merged_into is null;
  return result;
end $$;

-- 4. Notificar o PostgREST para recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
