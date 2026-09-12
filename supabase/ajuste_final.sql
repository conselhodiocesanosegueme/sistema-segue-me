-- ==============================================================================
-- AJUSTE FINAL: Permissões, Coluna parish e Função get_overview Completa
-- Execute este script no SQL Editor do Supabase para finalizar a ativação!
-- ==============================================================================

-- 1. Coluna de paróquia na tabela de pessoas
alter table public.people add column if not exists parish text;

-- 2. Permissões de acesso ao schema interno
grant usage on schema private to service_role, anon, authenticated;
grant execute on all functions in schema private to service_role, authenticated;

-- 3. Função get_overview (Visão Diocesana e Paroquial completas com todas as métricas)
drop function if exists public.get_overview();
drop function if exists public.get_overview(text);
drop function if exists private.get_overview();
drop function if exists private.get_overview(text);

create or replace function private.get_overview(p_parish text default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_people_count integer;
  v_encounters_count integer;
  v_participations_count integer;
  v_pending_count integer;
  v_parishes_count integer;
  v_linked_accounts integer;
  v_youth_vivenciou_count integer;
  v_people_made_count integer;
  v_people_worked_count integer;
  v_couples_count integer;
  v_all_parishes jsonb;
  v_by_year jsonb;
begin
  perform private.require_staff();

  -- Se p_parish for informado, calcula com escopo da paróquia:
  if p_parish is not null and p_parish <> '' then
    select count(distinct p.id)::int into v_people_count
    from public.people p
    where p.merged_into is null
      and (p.parish = p_parish or exists (
        select 1 from public.participations pt
        join public.encounters enc on enc.id = pt.encounter_id
        where pt.person_id = p.id and enc.parish = p_parish
      ));

    select count(*)::int into v_encounters_count
    from public.encounters where parish = p_parish;

    select count(*)::int into v_participations_count
    from public.participations pt
    join public.encounters enc on enc.id = pt.encounter_id
    where enc.parish = p_parish;

    select count(*)::int into v_pending_count
    from public.review_items where status = 'pending';

    v_parishes_count := 1;
    v_linked_accounts := 1;

    -- Jovens que vivenciaram na paróquia
    select count(distinct pt.person_id)::int into v_youth_vivenciou_count
    from public.participations pt
    join public.encounters enc on enc.id = pt.encounter_id
    where enc.parish = p_parish and pt.kind = 'Vivenciou' and pt.condition = 'Jovem';

    -- Pessoas que já fizeram (vivenciaram)
    select count(distinct pt.person_id)::int into v_people_made_count
    from public.participations pt
    join public.encounters enc on enc.id = pt.encounter_id
    where enc.parish = p_parish and pt.kind = 'Vivenciou';

    -- Pessoas que já trabalharam em equipes de serviço (exclui mandatos institucionais)
    select count(distinct pt.person_id)::int into v_people_worked_count
    from public.participations pt
    join public.encounters enc on enc.id = pt.encounter_id
    where enc.parish = p_parish
      and pt.kind = 'Trabalhou'
      and coalesce(pt.team, '') not ilike '%dirigente%'
      and coalesce(pt.team, '') not ilike '%conselho%'
      and coalesce(pt.role, '') not ilike '%conselho%'
      and coalesce(pt.role, '') not ilike '%dirigente%'
      and coalesce(pt.role, '') not ilike '%pasta montagem%'
      and coalesce(pt.role, '') not ilike '%pasta ficha%'
      and coalesce(pt.role, '') not ilike '%pasta finança%'
      and coalesce(pt.role, '') not ilike '%pasta palestra%'
      and coalesce(pt.role, '') not ilike '%pasta pós-encontro%'
      and coalesce(pt.role, '') not ilike '%diretor espiritual%';

    -- Casais atuantes
    select count(distinct c.id)::int into v_couples_count
    from public.couples c
    where exists (
      select 1 from public.participations pt
      join public.encounters enc on enc.id = pt.encounter_id
      where (pt.person_id = c.person_1_id or pt.person_id = c.person_2_id)
        and enc.parish = p_parish
    );

    select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_by_year
    from (
      select jsonb_build_object('year', enc.year, 'total', count(pt.id)) as item
      from public.encounters enc
      left join public.participations pt on pt.encounter_id = enc.id
      where enc.parish = p_parish and enc.year is not null
      group by enc.year
      order by enc.year
    ) sub;

  else
    -- Escopo Diocesano Geral
    select count(*)::int into v_people_count from public.people where merged_into is null;
    select count(*)::int into v_encounters_count from public.encounters;
    select count(*)::int into v_participations_count from public.participations;
    select count(*)::int into v_pending_count from public.review_items where status = 'pending';
    select count(distinct parish)::int into v_parishes_count from public.encounters where parish <> '';
    select count(*)::int into v_linked_accounts from public.account_links where status = 'active';

    select count(distinct person_id)::int into v_youth_vivenciou_count
    from public.participations where kind = 'Vivenciou' and condition = 'Jovem';

    select count(distinct person_id)::int into v_people_made_count
    from public.participations where kind = 'Vivenciou';

    select count(distinct person_id)::int into v_people_worked_count
    from public.participations
    where kind = 'Trabalhou'
      and coalesce(team, '') not ilike '%dirigente%'
      and coalesce(team, '') not ilike '%conselho%'
      and coalesce(role, '') not ilike '%conselho%'
      and coalesce(role, '') not ilike '%dirigente%'
      and coalesce(role, '') not ilike '%pasta montagem%'
      and coalesce(role, '') not ilike '%pasta ficha%'
      and coalesce(role, '') not ilike '%pasta finança%'
      and coalesce(role, '') not ilike '%pasta palestra%'
      and coalesce(role, '') not ilike '%pasta pós-encontro%'
      and coalesce(role, '') not ilike '%diretor espiritual%';

    select count(*)::int into v_couples_count from public.couples;

    select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_by_year
    from (
      select jsonb_build_object('year', e.year, 'total', count(p.id)) as item
      from public.encounters e
      left join public.participations p on p.encounter_id = e.id
      where e.year is not null
      group by e.year
      order by e.year
    ) sub;
  end if;

  select coalesce(jsonb_agg(distinct parish order by parish), '[]'::jsonb)
  into v_all_parishes
  from public.encounters
  where parish <> '';

  return jsonb_build_object(
    'people', v_people_count,
    'encounters', v_encounters_count,
    'participations', v_participations_count,
    'pending', v_pending_count,
    'parishes', v_parishes_count,
    'linkedAccounts', v_linked_accounts,
    'youthVivenciouCount', v_youth_vivenciou_count,
    'peopleMadeCount', v_people_made_count,
    'peopleWorkedCount', v_people_worked_count,
    'couplesCount', v_couples_count,
    'isParochial', (p_parish is not null and p_parish <> ''),
    'parishName', p_parish,
    'allParishes', v_all_parishes,
    'byYear', v_by_year
  );
end $$;

create or replace function public.get_overview(p_parish text default null) returns jsonb language sql stable set search_path = '' as $$
  select private.get_overview(p_parish);
$$;

-- 4. Função para obter o resumo de cada paróquia e setor (contagem de pessoas e encontros)
drop function if exists public.get_sectors_summary();
drop function if exists private.get_sectors_summary();

create or replace function private.get_sectors_summary() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_result jsonb;
begin
  perform private.require_staff();

  select coalesce(jsonb_agg(item), '[]'::jsonb)
  into v_result
  from (
    select
      enc.parish,
      coalesce(enc.city, '') as city,
      count(distinct enc.id)::int as encounter_count,
      count(distinct pt.person_id)::int as people_count,
      count(distinct case when pt.kind = 'Vivenciou' and pt.condition = 'Jovem' then pt.person_id end)::int as youth_vivenciou_count,
      count(distinct case when pt.kind = 'Trabalhou'
        and coalesce(pt.team, '') not ilike '%dirigente%'
        and coalesce(pt.team, '') not ilike '%conselho%'
        and coalesce(pt.role, '') not ilike '%conselho%'
        and coalesce(pt.role, '') not ilike '%dirigente%'
        and coalesce(pt.role, '') not ilike '%pasta montagem%'
        and coalesce(pt.role, '') not ilike '%pasta ficha%'
        and coalesce(pt.role, '') not ilike '%pasta finança%'
        and coalesce(pt.role, '') not ilike '%pasta palestra%'
        and coalesce(pt.role, '') not ilike '%pasta pós-encontro%'
        and coalesce(pt.role, '') not ilike '%diretor espiritual%'
      then pt.person_id end)::int as people_worked_count
    from public.encounters enc
    left join public.participations pt on pt.encounter_id = enc.id
    where enc.parish <> ''
    group by enc.parish, enc.city
    order by count(distinct pt.person_id) desc
  ) item;

  return v_result;
end $$;

create or replace function public.get_sectors_summary() returns jsonb language sql stable set search_path = '' as $$
  select private.get_sectors_summary();
$$;

-- 5. Suporte aos 4 Tipos de Encontro, Níveis e Equipes Customizadas
alter table public.encounters add column if not exists type text default '1ª Etapa';
alter table public.encounters add column if not exists level text default 'Paroquial';
alter table public.encounters add column if not exists teams jsonb default '[]'::jsonb;
alter table public.encounters add column if not exists theme text;

-- 6. Suporte a Paróquia e Setor nos Mandatos (Conselho Diocesano, Setoriais e Equipes Dirigentes)
alter table public.mandates add column if not exists parish text;
alter table public.mandates add column if not exists sector_id text;
alter table public.mandates add column if not exists status text default 'Ativo';

