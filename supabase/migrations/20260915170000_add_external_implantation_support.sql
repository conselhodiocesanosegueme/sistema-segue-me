-- Sistema Segue-me: Suporte a Encontros de Implantação Externa e Remessas Pioneiras de Jovens
-- Encontros em outras dioceses apadrinhadas por Anápolis (Missões de Implantação)
-- Identificação de encontristas vindos de fora como remessa preparatória para implantação

alter table public.encounters
  add column if not exists target_diocese text default null,
  add column if not exists is_external_implantation boolean not null default false;

alter table public.participations
  add column if not exists is_external_seed boolean not null default false,
  add column if not exists external_diocese text default null;

create index if not exists encounters_external_implantation on public.encounters(is_external_implantation) where is_external_implantation = true;
create index if not exists participations_external_seed on public.participations(is_external_seed) where is_external_seed = true;
