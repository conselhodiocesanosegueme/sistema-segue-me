-- Sistema Segue-me: Extended RPC for participant's own mandates and couple/spouse information
-- Author: Database Agent

create or replace function private.get_my_extras() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_person_id uuid;
  v_mandates jsonb;
  v_couple jsonb;
begin
  perform private.require_user();
  select person_id into v_person_id from public.account_links where user_id = auth.uid() and status = 'active' limit 1;
  if v_person_id is null then
    return jsonb_build_object('mandates', '[]'::jsonb, 'couple', null);
  end if;

  -- Mandatos do próprio participante
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'person_id', m.person_id, 'encounter_id', m.encounter_id,
    'body', m.body, 'role', m.role, 'condition', m.condition,
    'start_year', m.start_year, 'end_year', m.end_year, 'record_type', m.record_type, 'notes', m.notes,
    'encounter', case when enc.id is not null then jsonb_build_object(
      'id', enc.id, 'edition', enc.edition, 'year', enc.year, 'parish', enc.parish, 'city', enc.city, 'name', enc.name
    ) else null end
  ) order by coalesce(m.start_year, 0) desc), '[]'::jsonb)
  into v_mandates
  from public.mandates m
  left join public.encounters enc on enc.id = m.encounter_id
  where m.person_id = v_person_id;

  -- Informações de casal e cônjuge
  select jsonb_build_object(
    'id', c.id, 'legacy_id', c.legacy_id, 'start_text', c.start_text, 'end_text', c.end_text, 'notes', c.notes,
    'spouse', jsonb_build_object(
      'id', sp.id, 'name', sp.name, 'phone', sp.phone, 'email', sp.email,
      'birth_date_text', sp.birth_date_text, 'parish', sp.parish
    )
  )
  into v_couple
  from public.couples c
  join public.people sp on sp.id = case when c.person_1_id = v_person_id then c.person_2_id else c.person_1_id end
  where c.person_1_id = v_person_id or c.person_2_id = v_person_id
  limit 1;

  return jsonb_build_object('mandates', v_mandates, 'couple', v_couple);
end $$;

create or replace function public.get_my_extras() returns jsonb language sql stable set search_path = '' as $$
  select private.get_my_extras();
$$;
