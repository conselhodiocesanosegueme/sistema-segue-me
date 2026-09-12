-- Executar no SQL Editor do Supabase para habilitar os tipos de encontros e mandatos:

-- 1. Suporte aos 4 Tipos de Encontro, Níveis e Equipes Customizadas
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS type text DEFAULT '1ª Etapa';
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS level text DEFAULT 'Paroquial';
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS teams jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS theme text;

-- 2. Suporte a Paróquia e Setor nos Mandatos (Conselho Diocesano, Setoriais e Equipes Dirigentes)
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS parish text;
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS sector_id text;
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS status text DEFAULT 'Ativo';
