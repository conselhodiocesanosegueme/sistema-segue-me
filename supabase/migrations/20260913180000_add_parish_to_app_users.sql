-- Adiciona coluna parish na tabela app_users para vínculo com a paróquia da Equipe Dirigente
alter table public.app_users add column if not exists parish text;
