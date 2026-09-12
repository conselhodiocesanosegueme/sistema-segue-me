-- Sistema Segue-me: all identifiers are synthetic UUIDs; historical IDs remain unique.
-- Apply to a fresh Supabase project. No production data or secrets are included.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
alter default privileges in schema private revoke execute on functions from public;

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'participant' check (role in ('participant','reviewer','admin')),
  disabled_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.people (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  name text not null check (length(trim(name)) > 0), phone text, email text,
  birth_date_text text, sex text, identification_status text not null default 'Pendente', notes text,
  protected_fields jsonb not null default '[]' check (jsonb_typeof(protected_fields) = 'array'),
  merged_into uuid references public.people(id), version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (merged_into is distinct from id)
);
create index people_name_search on public.people using gin (to_tsvector('simple', name));
create index people_name_order on public.people (lower(name), id) where merged_into is null;
create index people_merged_into on public.people(merged_into) where merged_into is not null;
create table public.encounters (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  edition text not null default '', year integer, parish text not null default '', city text not null default '',
  name text not null default '', date_text text not null default '', source_name text,
  extraction_status text not null default '', notes text, version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index encounters_year on public.encounters(year desc, id);
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'capturing' check(status in ('capturing','captured','reviewing','ready','applying','completed','failed','inconsistent')),
  source_id text not null, source_revision text, snapshot_hash text,
  progress jsonb not null default '{}', summary jsonb not null default '{}', error text,
  created_by uuid references public.app_users(id), created_at timestamptz not null default now(), completed_at timestamptz,
  lease_token uuid, lease_expires_at timestamptz
);
create index import_jobs_latest on public.import_jobs(created_at desc);
create table public.import_rows (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.import_jobs(id),
  sheet_name text not null, row_number integer not null, fingerprint text not null, occurrence integer not null default 1 check (occurrence > 0),
  payload jsonb not null, action text not null check(action in ('insert','unchanged','review','remove')),
  status text not null default 'pending' check(status in ('pending','approved','applied','rejected')),
  entity_type text not null, entity_id uuid, expected_version integer, message text,
  unique(job_id,sheet_name,fingerprint,occurrence)
);
create index import_rows_queue on public.import_rows(job_id,status,entity_type,row_number);
create table public.source_evidence (
  id uuid primary key default gen_random_uuid(), sheet_name text not null, fingerprint text not null,
  occurrence integer not null, payload jsonb not null,
  first_job_id uuid not null references public.import_jobs(id), last_job_id uuid not null references public.import_jobs(id),
  entity_type text, entity_id uuid,
  unique(sheet_name,fingerprint,occurrence)
);
create index source_evidence_entity on public.source_evidence(entity_type,entity_id);
create table public.participations (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
  encounter_id uuid not null references public.encounters(id), kind text not null,
  condition text not null default '', team text, circle text, role text, patron text, source_page text, notes text,
  source_row_id uuid references public.source_evidence(id), version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- No uniqueness on person/enounter: multiple real functions are valid history.
create unique index participation_source_once on public.participations(source_row_id) where source_row_id is not null;
create index participations_person_history on public.participations(person_id,encounter_id);
create index participations_encounter on public.participations(encounter_id);
create table public.couples (
  id uuid primary key default gen_random_uuid(), legacy_id text unique,
  person_1_id uuid not null references public.people(id), person_2_id uuid not null references public.people(id),
  start_text text, end_text text, notes text, version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (person_1_id <> person_2_id)
);
create index couples_first on public.couples(person_1_id);
create index couples_second on public.couples(person_2_id);
create table public.person_observations (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
  field_name text not null, value text not null, source_evidence_id uuid references public.source_evidence(id),
  created_at timestamptz not null default now()
);
create index observations_person on public.person_observations(person_id);
create table public.circles (
  id uuid primary key default gen_random_uuid(), encounter_id uuid not null references public.encounters(id),
  color text, patron text, youth_count integer, details jsonb not null default '{}', source_evidence_id uuid references public.source_evidence(id)
);
create index circles_encounter on public.circles(encounter_id);
create table public.talks (
  id uuid primary key default gen_random_uuid(), encounter_id uuid not null references public.encounters(id),
  title text not null, location text, source_page text, notes text, source_evidence_id uuid references public.source_evidence(id)
);
create index talks_encounter on public.talks(encounter_id);
create table public.talk_speakers (
  id uuid primary key default gen_random_uuid(), talk_id uuid not null references public.talks(id),
  person_id uuid not null references public.people(id), source_evidence_id uuid references public.source_evidence(id)
);
create index speakers_person on public.talk_speakers(person_id);
create index speakers_talk on public.talk_speakers(talk_id);
create table public.mandates (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
  encounter_id uuid references public.encounters(id), body text not null, role text not null,
  condition text, start_year integer, end_year integer, record_type text, notes text,
  source_row_id uuid references public.source_evidence(id), version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_year is null or start_year is null or end_year >= start_year)
);
create index mandates_person on public.mandates(person_id);
create index mandates_encounter on public.mandates(encounter_id);
create unique index mandate_source_once on public.mandates(source_row_id) where source_row_id is not null;
create table public.source_documents (
  id uuid primary key default gen_random_uuid(), encounter_id uuid references public.encounters(id),
  name text not null, storage_path text, external_reference text, checksum text, created_at timestamptz not null default now()
);
create table public.account_links (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id),
  person_id uuid not null references public.people(id), status text not null check(status in ('active','suspended')),
  approved_by uuid references public.app_users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_user on public.account_links(user_id) where status = 'active';
create unique index one_active_person on public.account_links(person_id) where status = 'active';
create index account_links_user on public.account_links(user_id);
create index account_links_person on public.account_links(person_id);
create table public.review_items (
  id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('correction','duplicate','identity','import_conflict')),
  person_id uuid references public.people(id), related_person_id uuid references public.people(id),
  requester_id uuid references public.app_users(id), title text not null,
  proposed_changes jsonb not null default '{}', evidence jsonb not null default '{}',
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  resolution text, resolved_by uuid references public.app_users(id), created_at timestamptz not null default now(),
  resolved_at timestamptz, version integer not null default 1,
  import_row_id uuid unique references public.import_rows(id)
);
create index reviews_queue on public.review_items(status,created_at desc);
create index reviews_person on public.review_items(person_id);
create table public.audit_log (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.app_users(id),
  action text not null, entity_type text not null, entity_id uuid,
  before_data jsonb, after_data jsonb, reason text not null,
  created_at timestamptz not null default now()
);
create index audit_entity on public.audit_log(entity_type,entity_id,created_at desc);
create table public.person_redirects (
  obsolete_id uuid primary key references public.people(id), canonical_id uuid not null references public.people(id),
  audit_id uuid references public.audit_log(id), created_at timestamptz not null default now(),
  check(obsolete_id <> canonical_id)
);
create index redirects_target on public.person_redirects(canonical_id);
create table private.merge_operations (
  audit_id uuid primary key references public.audit_log(id), source_id uuid not null, target_id uuid not null,
  before_data jsonb not null, after_data jsonb not null, reversed_at timestamptz
);
alter table private.merge_operations enable row level security;

create function private.touch_version() returns trigger language plpgsql set search_path = '' as $$
begin new.version := old.version + 1; new.updated_at := clock_timestamp(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['people','encounters','participations','couples','mandates'] loop
    execute format('create trigger touch_version before update on public.%I for each row execute function private.touch_version()',t);
  end loop;
end $$;

create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.app_users(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
insert into public.app_users(id,full_name) select id,coalesce(raw_user_meta_data->>'full_name','') from auth.users on conflict(id) do nothing;

create function private.current_app_role() returns text language sql stable security definer set search_path = '' as $$
  select a.role from public.app_users a join auth.users u on u.id=a.id
  where a.id=auth.uid() and a.disabled_at is null and u.email_confirmed_at is not null
$$;
create function public.current_app_role() returns text language sql stable set search_path = '' as $$ select private.current_app_role() $$;
create function private.require_user() returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or private.current_app_role() is null then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
  return auth.uid();
end $$;
create function private.require_staff(p_admin boolean default false) returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_user();
  if private.current_app_role() not in ('admin','reviewer') or (p_admin and private.current_app_role()<>'admin') then
    raise exception 'Acesso não autorizado.' using errcode='42501';
  end if;
  return auth.uid();
end $$;

-- Direct domain access is SELECT-only for verified staff. All writes use checked RPCs.
do $$ declare t text; begin
  foreach t in array array['people','encounters','participations','couples','person_observations','circles','talks','talk_speakers','mandates','source_documents','account_links','review_items','import_jobs','import_rows','source_evidence','audit_log','person_redirects'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy staff_read on public.%I for select to authenticated using ((select private.current_app_role()) in (''reviewer'',''admin''))',t);
  end loop;
end $$;
alter table public.app_users enable row level security;
revoke all on public.app_users from anon, authenticated;
grant select on public.app_users to authenticated;
grant all on public.app_users to service_role;
create policy users_read on public.app_users for select to authenticated using (id=(select auth.uid()) or (select private.current_app_role())='admin');

insert into storage.buckets(id,name,public) values('import-snapshots','import-snapshots',false) on conflict(id) do update set public=false;
create policy snapshots_staff_read on storage.objects for select to authenticated using (bucket_id='import-snapshots' and (select private.current_app_role()) in ('admin','reviewer'));
-- No client INSERT/UPDATE/DELETE policies: snapshot writes use server service credentials.

create function private.get_my_profile() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; begin
  perform private.require_user();
  select jsonb_build_object('id',p.id,'legacy_id',p.legacy_id,'name',p.name,'phone',p.phone,'email',p.email,
    'birth_date_text',p.birth_date_text,'sex',p.sex,'identification_status',p.identification_status,'version',p.version)
  into result from public.account_links l join public.people p on p.id=l.person_id
  where l.user_id=auth.uid() and l.status='active' and p.merged_into is null;
  return result;
end $$;
create function public.get_my_profile() returns jsonb language sql stable set search_path = '' as $$ select private.get_my_profile() $$;
create function private.get_my_history() returns setof jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_user();
  return query select jsonb_build_object('id',p.id,'person_id',p.person_id,'encounter_id',p.encounter_id,'kind',p.kind,
    'condition',p.condition,'team',p.team,'circle',p.circle,'role',p.role,'patron',p.patron,
    'encounter',jsonb_build_object('id',e.id,'legacy_id',e.legacy_id,'edition',e.edition,'year',e.year,'parish',e.parish,'city',e.city,'name',e.name,'date_text',e.date_text))
  from public.participations p join public.encounters e on e.id=p.encounter_id
  join public.account_links l on l.person_id=p.person_id and l.status='active'
  join public.people person on person.id=p.person_id and person.merged_into is null
  where l.user_id=auth.uid() order by e.year desc nulls last,e.edition,p.id;
end $$;
create function public.get_my_history() returns setof jsonb language sql stable set search_path = '' as $$ select * from private.get_my_history() $$;

create function private.submit_identity_request(p_name text,p_context text) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; begin
  perform private.require_user();
  if length(trim(p_name))<2 or length(p_name)>200 or length(coalesce(p_context,''))>4000 then raise exception 'Informe nome e contexto válidos.'; end if;
  if exists(select 1 from public.account_links where user_id=auth.uid() and status='active') then raise exception 'Sua conta já possui vínculo ativo.'; end if;
  if exists(select 1 from public.review_items where requester_id=auth.uid() and kind='identity' and status='pending') then raise exception 'Já existe uma solicitação em análise.'; end if;
  insert into public.review_items(kind,requester_id,title,proposed_changes,evidence)
  values('identity',auth.uid(),'Solicitação de vínculo',jsonb_build_object('name',p_name),jsonb_build_object('context',p_context)) returning id into result;
  return result;
end $$;
create function public.submit_identity_request(p_name text,p_context text) returns uuid language sql set search_path = '' as $$ select private.submit_identity_request(p_name,p_context) $$;

create function private.submit_correction(p_person_id uuid,p_changes jsonb,p_reason text) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; person_version integer; begin
  perform private.require_user();
  if private.current_app_role()='participant' and not exists(select 1 from public.account_links where person_id=p_person_id and user_id=auth.uid() and status='active') then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
  if jsonb_typeof(p_changes)<>'object' or p_changes='{}' or length(trim(coalesce(p_reason,'')))<3 or length(p_reason)>4000 then raise exception 'Informe alterações e justificativa.'; end if;
  if exists(select 1 from jsonb_each(p_changes) x where x.key not in ('name','phone','email','birth_date_text','sex') or jsonb_typeof(x.value) not in ('string','null') or length(x.value::text)>1000) then raise exception 'Campo de correção não permitido.'; end if;
  if p_changes ? 'name' and length(trim(coalesce(p_changes->>'name','')))<2 then raise exception 'Nome inválido.'; end if;
  select version into person_version from public.people where id=p_person_id and merged_into is null;
  if person_version is null then raise exception 'Cadastro indisponível.'; end if;
  insert into public.review_items(kind,person_id,requester_id,title,proposed_changes,evidence)
  values('correction',p_person_id,auth.uid(),'Correção de cadastro',p_changes,jsonb_build_object('reason',p_reason,'person_version',person_version)) returning id into result;
  return result;
end $$;
create function public.submit_correction(p_person_id uuid,p_changes jsonb,p_reason text) returns uuid language sql set search_path = '' as $$ select private.submit_correction(p_person_id,p_changes,p_reason) $$;

create function private.assign_identity_candidate(p_review_id uuid,p_person_id uuid,p_expected_version integer) returns integer language plpgsql security definer set search_path = '' as $$
declare result integer; begin
  perform private.require_staff();
  if not exists(select 1 from public.people where id=p_person_id and merged_into is null) then raise exception 'Cadastro indisponível.'; end if;
  update public.review_items set person_id=p_person_id,version=version+1 where id=p_review_id and kind='identity' and status='pending' and version=p_expected_version returning version into result;
  if result is null then raise exception 'Solicitação mudou; atualize a página.' using errcode='40001'; end if;
  return result;
end $$;
create function public.assign_identity_candidate(p_review_id uuid,p_person_id uuid,p_expected_version integer) returns integer language sql set search_path = '' as $$ select private.assign_identity_candidate(p_review_id,p_person_id,p_expected_version) $$;

create function private.resolve_review(p_review_id uuid,p_decision text,p_reason text,p_expected_version integer) returns void language plpgsql security definer set search_path = '' as $$
declare r public.review_items; old_person public.people; changes jsonb; begin
  perform private.require_staff();
  if p_decision not in ('approved','rejected') or length(trim(coalesce(p_reason,'')))<3 then raise exception 'Decisão e justificativa obrigatórias.'; end if;
  select * into r from public.review_items where id=p_review_id for update;
  if r.id is null or r.status<>'pending' or r.version<>p_expected_version then raise exception 'Solicitação mudou; atualize a página.' using errcode='40001'; end if;
  if p_decision='approved' and r.kind='identity' then
    if r.person_id is null or r.requester_id is null then raise exception 'Selecione a pessoa e confira a identidade antes de aprovar.'; end if;
    perform 1 from public.people where id=r.person_id and merged_into is null for update;
    if not found then raise exception 'Cadastro indisponível.'; end if;
    if not exists(select 1 from auth.users u join public.app_users a on a.id=u.id where u.id=r.requester_id and u.email_confirmed_at is not null and a.disabled_at is null) then raise exception 'A conta precisa estar ativa e ter e-mail verificado.'; end if;
    if exists(select 1 from public.account_links where status='active' and (user_id=r.requester_id or person_id=r.person_id)) then raise exception 'Já existe vínculo ativo; revise os acessos.'; end if;
    insert into public.account_links(user_id,person_id,status,approved_by) values(r.requester_id,r.person_id,'active',auth.uid());
  elsif p_decision='approved' and r.kind='correction' then
    select * into old_person from public.people where id=r.person_id and merged_into is null for update;
    if old_person.id is null or old_person.version is distinct from (r.evidence->>'person_version')::integer then raise exception 'Cadastro mudou; solicite nova revisão.' using errcode='40001'; end if;
    changes:=r.proposed_changes;
    update public.people set name=case when changes?'name' then changes->>'name' else name end,
      phone=case when changes?'phone' then changes->>'phone' else phone end,
      email=case when changes?'email' then changes->>'email' else email end,
      birth_date_text=case when changes?'birth_date_text' then changes->>'birth_date_text' else birth_date_text end,
      sex=case when changes?'sex' then changes->>'sex' else sex end,
      protected_fields=(select coalesce(jsonb_agg(distinct value),'[]') from (select value from jsonb_array_elements(old_person.protected_fields) union select to_jsonb(key) from jsonb_object_keys(changes) key) fields)
    where id=r.person_id;
    insert into public.audit_log(actor_id,action,entity_type,entity_id,before_data,after_data,reason)
    select auth.uid(),'correction','person',p.id,to_jsonb(old_person),to_jsonb(p),p_reason from public.people p where id=r.person_id;
  elsif p_decision='approved' and r.kind in ('duplicate','import_conflict') then
    raise exception 'Esta pendência exige tratamento específico; não pode ser aprovada genericamente.';
  end if;
  update public.review_items set status=p_decision,resolution=p_reason,resolved_by=auth.uid(),resolved_at=now(),version=version+1 where id=r.id;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,before_data,after_data,reason)
  values(auth.uid(),'resolve_review','review',r.id,to_jsonb(r),jsonb_build_object('status',p_decision),p_reason);
end $$;
create function public.resolve_review(p_review_id uuid,p_decision text,p_reason text,p_expected_version integer) returns void language sql set search_path = '' as $$ select private.resolve_review(p_review_id,p_decision,p_reason,p_expected_version) $$;

create function private.set_user_role(p_user_id uuid,p_role text,p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare before_row public.app_users; begin
  perform private.require_staff(true);
  if p_role not in ('participant','reviewer','admin') or length(trim(coalesce(p_reason,'')))<3 then raise exception 'Perfil e justificativa obrigatórios.'; end if;
  if p_user_id=auth.uid() then raise exception 'Outro administrador deve alterar seu perfil.'; end if;
  select * into before_row from public.app_users where id=p_user_id for update;
  if before_row.id is null then raise exception 'Conta não encontrada.'; end if;
  update public.app_users set role=p_role,updated_at=now() where id=p_user_id;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,before_data,after_data,reason) values(auth.uid(),'set_user_role','app_user',p_user_id,to_jsonb(before_row),jsonb_build_object('role',p_role),p_reason);
end $$;
create function public.set_user_role(p_user_id uuid,p_role text,p_reason text) returns void language sql set search_path = '' as $$ select private.set_user_role(p_user_id,p_role,p_reason) $$;
