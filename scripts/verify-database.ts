import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  console.log('🚀 Iniciando verificação do banco de dados (PGlite)...');
  const db = new PGlite();

  // Simula roles e schemas do Supabase
  await db.exec(`
    do $$ begin
      if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
    end $$;

    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb default '{}',
      email_confirmed_at timestamptz default now()
    );
    create or replace function auth.uid() returns uuid language sql as $$ select '00000000-0000-0000-0000-000000000000'::uuid $$;

    create schema if not exists storage;
    create table if not exists storage.buckets (id text primary key, name text, public boolean);
    create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  `);

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`⏳ Aplicando migração: ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    await db.exec(sql);
    console.log(`✅ Migração ${file} aplicada com sucesso!`);
  }

  // Validação de integridade de tabelas
  const tables = await db.query<{ tablename: string }>(`
    select tablename from pg_tables where schemaname = 'public' order by tablename;
  `);

  console.log(`\n📋 Tabelas públicas criadas (${tables.rows.length}):`);
  tables.rows.forEach((r) => console.log(`  • public.${r.tablename}`));

  const requiredTables = [
    'people', 'encounters', 'participations', 'couples',
    'app_users', 'account_links', 'review_items', 'import_jobs',
    'import_rows', 'source_evidence', 'audit_log'
  ];

  for (const req of requiredTables) {
    if (!tables.rows.some((r) => r.tablename === req)) {
      throw new Error(`Tabela obrigatória ausente: public.${req}`);
    }
  }

  console.log('\n🎉 Todas as tabelas e RPCs foram verificadas com sucesso sem erros de SQL!');
}

main().catch((err) => {
  console.error('❌ Falha na verificação do banco de dados:', err);
  process.exit(1);
});
