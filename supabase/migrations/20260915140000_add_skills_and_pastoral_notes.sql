-- Sistema Segue-me: Adiciona campos de habilidades musicais/artísticas e notas pastorais à tabela people
-- Habilidades (skills): públicas e auto-declaradas
-- Notas pastorais (pastoral_notes / engagement_status): reservadas a dirigentes e conselho diocesano

alter table public.people
  add column if not exists skills jsonb not null default '{}'::jsonb,
  add column if not exists pastoral_notes text default '',
  add column if not exists engagement_status text not null default 'neutro'
    check (engagement_status in ('disponivel', 'justificou', 'sem_compromisso', 'neutro'));

create index if not exists people_engagement_status on public.people(engagement_status);
create index if not exists people_skills_gin on public.people using gin (skills);
