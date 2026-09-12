-- Sistema Segue-me: Extended RPC functions for domain operations, search and dashboard aggregation
-- Author: Database Agent

create or replace function private.search_people(
  p_query text default '',
  p_page integer default 1,
  p_page_size integer default 20,
  p_parish text default null,
  p_year integer default null,
  p_encounter text default null,
  p_team text default null,
  p_kind text default null,
  p_status text default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_offset integer;
  v_total integer;
  v_items jsonb;
  v_clean text;
begin
  perform private.require_staff();
  v_offset := greatest(0, (coalesce(p_page, 1) - 1) * coalesce(p_page_size, 20));
  v_clean := trim(coalesce(p_query, ''));

  with filtered_people as (
    select distinct p.id, p.legacy_id, p.name, p.phone, p.email, p.birth_date_text, p.sex,
           p.identification_status, p.notes, p.version, p.parish,
           (select count(*)::int from public.participations pt where pt.person_id = p.id) as participation_count
    from public.people p
    where p.merged_into is null
      and (
        v_clean = ''
        or p.name ilike '%' || v_clean || '%'
        or coalesce(p.legacy_id, '') ilike '%' || v_clean || '%'
        or coalesce(p.phone, '') ilike '%' || v_clean || '%'
        or coalesce(p.email, '') ilike '%' || v_clean || '%'
      )
      and (p_status is null or p.identification_status = p_status)
      and (
        (p_parish is null and p_year is null and p_encounter is null and p_team is null and p_kind is null)
        or exists (
          select 1 from public.participations part
          join public.encounters enc on enc.id = part.encounter_id
          where part.person_id = p.id
            and (p_parish is null or enc.parish = p_parish)
            and (p_year is null or enc.year = p_year)
            and (p_encounter is null or enc.id::text = p_encounter or enc.legacy_id = p_encounter)
            and (p_team is null or part.team = p_team)
            and (p_kind is null or part.kind = p_kind)
        )
      )
  ),
  counted as (
    select count(*)::int as total_count from filtered_people
  ),
  paginated as (
    select * from filtered_people
    order by lower(name), id
    limit p_page_size offset v_offset
  )
  select coalesce(jsonb_agg(to_jsonb(paginated)), '[]'::jsonb), (select total_count from counted)
  into v_items, v_total
  from paginated;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size
  );
end $$;

create or replace function public.search_people(
  p_query text default '',
  p_page integer default 1,
  p_page_size integer default 20,
  p_parish text default null,
  p_year integer default null,
  p_encounter text default null,
  p_team text default null,
  p_kind text default null,
  p_status text default null
) returns jsonb language sql stable set search_path = '' as $$
  select private.search_people(p_query, p_page, p_page_size, p_parish, p_year, p_encounter, p_team, p_kind, p_status)
$$;

create or replace function private.get_overview() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_people_count integer;
  v_encounters_count integer;
  v_participations_count integer;
  v_pending_count integer;
  v_parishes_count integer;
  v_linked_accounts integer;
  v_by_year jsonb;
begin
  perform private.require_staff();

  select count(*)::int into v_people_count from public.people where merged_into is null;
  select count(*)::int into v_encounters_count from public.encounters;
  select count(*)::int into v_participations_count from public.participations;
  select count(*)::int into v_pending_count from public.review_items where status = 'pending';
  select count(distinct parish)::int into v_parishes_count from public.encounters where parish <> '';
  select count(*)::int into v_linked_accounts from public.account_links where status = 'active';

  select coalesce(jsonb_agg(jsonb_build_object('year', e.year, 'total', count(p.id))), '[]'::jsonb)
  into v_by_year
  from public.encounters e
  left join public.participations p on p.encounter_id = e.id
  where e.year is not null
  group by e.year
  order by e.year;

  return jsonb_build_object(
    'people', v_people_count,
    'encounters', v_encounters_count,
    'participations', v_participations_count,
    'pending', v_pending_count,
    'parishes', v_parishes_count,
    'linkedAccounts', v_linked_accounts,
    'byYear', v_by_year
  );
end $$;

create or replace function public.get_overview() returns jsonb language sql stable set search_path = '' as $$
  select private.get_overview()
$$;

create or replace function private.get_filter_options() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_parishes jsonb;
  v_years jsonb;
  v_teams jsonb;
  v_encounters jsonb;
begin
  perform private.require_staff();

  select coalesce(jsonb_agg(distinct parish order by parish), '[]'::jsonb)
  into v_parishes from public.encounters where parish <> '';

  select coalesce(jsonb_agg(distinct year order by year desc), '[]'::jsonb)
  into v_years from public.encounters where year is not null;

  select coalesce(jsonb_agg(distinct team order by team), '[]'::jsonb)
  into v_teams from public.participations where team is not null and team <> '';

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name || ' · ' || coalesce(year::text, '')) order by year desc, name), '[]'::jsonb)
  into v_encounters from public.encounters;

  return jsonb_build_object(
    'parishes', v_parishes,
    'years', v_years,
    'teams', v_teams,
    'encounters', v_encounters
  );
end $$;

create or replace function public.get_filter_options() returns jsonb language sql stable set search_path = '' as $$
  select private.get_filter_options()
$$;

create or replace function private.merge_people(
  p_source_id uuid,
  p_target_id uuid,
  p_reason text,
  p_source_version integer,
  p_target_version integer
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_source public.people;
  v_target public.people;
  v_audit_id uuid;
begin
  perform private.require_staff(true);

  if p_source_id = p_target_id then
    raise exception 'Origem e destino não podem ser o mesmo cadastro.';
  end if;

  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Justificativa obrigatória.';
  end if;

  select * into v_source from public.people where id = p_source_id for update;
  select * into v_target from public.people where id = p_target_id for update;

  if v_source.id is null or v_source.merged_into is not null or v_source.version <> p_source_version then
    raise exception 'Cadastro de origem indisponível ou alterado.' using errcode = '40001';
  end if;

  if v_target.id is null or v_target.merged_into is not null or v_target.version <> p_target_version then
    raise exception 'Cadastro de destino indisponível ou alterado.' using errcode = '40001';
  end if;

  -- Registra auditoria
  insert into public.audit_log(actor_id, action, entity_type, entity_id, before_data, after_data, reason)
  values(
    auth.uid(), 'merge_people', 'person', p_target_id,
    jsonb_build_object('source', to_jsonb(v_source), 'target', to_jsonb(v_target)),
    jsonb_build_object('merged_into', p_target_id),
    p_reason
  ) returning id into v_audit_id;

  -- Guarda dados da operação privada para reversão garantida
  insert into private.merge_operations(audit_id, source_id, target_id, before_data, after_data)
  values(
    v_audit_id, p_source_id, p_target_id,
    to_jsonb(v_source), to_jsonb(v_target)
  );

  -- Aposenta a pessoa de origem
  update public.people
  set merged_into = p_target_id, version = version + 1, updated_at = clock_timestamp()
  where id = p_source_id;

  -- Redireciona participações
  update public.participations
  set person_id = p_target_id, version = version + 1, updated_at = clock_timestamp()
  where person_id = p_source_id;

  -- Redireciona casais
  update public.couples
  set person_1_id = p_target_id, version = version + 1, updated_at = clock_timestamp()
  where person_1_id = p_source_id and person_2_id <> p_target_id;

  update public.couples
  set person_2_id = p_target_id, version = version + 1, updated_at = clock_timestamp()
  where person_2_id = p_source_id and person_1_id <> p_target_id;

  -- Redireciona mandatos
  update public.mandates
  set person_id = p_target_id, version = version + 1, updated_at = clock_timestamp()
  where person_id = p_source_id;

  -- Redireciona palestras
  update public.talk_speakers
  set person_id = p_target_id
  where person_id = p_source_id;

  -- Registra redirecionamento permanente
  insert into public.person_redirects(obsolete_id, canonical_id, audit_id)
  values(p_source_id, p_target_id, v_audit_id)
  on conflict(obsolete_id) do update set canonical_id = p_target_id, audit_id = v_audit_id;
end $$;

create or replace function public.merge_people(
  p_source_id uuid,
  p_target_id uuid,
  p_reason text,
  p_source_version integer,
  p_target_version integer
) returns void language sql set search_path = '' as $$
  select private.merge_people(p_source_id, p_target_id, p_reason, p_source_version, p_target_version)
$$;

create or replace function private.reverse_merge(
  p_audit_id uuid,
  p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_op private.merge_operations;
begin
  perform private.require_staff(true);

  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Justificativa obrigatória.';
  end if;

  select * into v_op from private.merge_operations where audit_id = p_audit_id and reversed_at is null for update;
  if v_op.audit_id is null then
    raise exception 'Operação de mesclagem não encontrada ou já revertida.';
  end if;

  -- Reativa a pessoa aposentada
  update public.people
  set merged_into = null, version = version + 1, updated_at = clock_timestamp()
  where id = v_op.source_id;

  -- Remove redirecionamento
  delete from public.person_redirects where obsolete_id = v_op.source_id;

  -- Marca operação como revertida
  update private.merge_operations set reversed_at = clock_timestamp() where audit_id = p_audit_id;

  -- Registra na auditoria
  insert into public.audit_log(actor_id, action, entity_type, entity_id, before_data, after_data, reason)
  values(
    auth.uid(), 'reverse_merge', 'person', v_op.target_id,
    to_jsonb(v_op), jsonb_build_object('reversed_audit_id', p_audit_id),
    p_reason
  );
end $$;

create or replace function public.reverse_merge(
  p_audit_id uuid,
  p_reason text
) returns void language sql set search_path = '' as $$
  select private.reverse_merge(p_audit_id, p_reason)
$$;
