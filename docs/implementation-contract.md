# Integration contract

App: Next.js App Router / TypeScript, Supabase. Portuguese user-facing copy. No real data in fixtures or repository. Explicit local DEMO_MODE only; production never silently falls back to demo.

## Database names shared with app and import engine

All domain IDs UUID, legacy_id unique text on people/encounters/couples. Version integer default 1, created_at/updated_at timestamptz where mutable.

- people: id, legacy_id, name, phone, email, birth_date_text, sex, identification_status, notes, version, protected_fields jsonb default [], merged_into UUID nullable.
- encounters: id, legacy_id, edition, year integer nullable, parish, city, name, date_text, source_name, extraction_status, notes.
- participations: id, person_id, encounter_id, kind, condition, team, circle, role, patron, source_page, notes, source_row_id nullable.
- app_users: id = auth.users.id, full_name, role (participant/reviewer/admin).
- account_links: user_id, person_id, status (active/suspended); one active per user/person.
- review_items: id, kind (correction/duplicate/identity/import_conflict), person_id nullable, related_person_id nullable, requester_id nullable, title, proposed_changes jsonb, evidence jsonb, status (pending/approved/rejected), resolution, resolved_by, created_at, resolved_at, version.
- import_jobs: id, status (capturing/captured/reviewing/ready/applying/completed/failed/inconsistent), source_id, source_revision, snapshot_hash, progress jsonb, summary jsonb, error, created_by, created_at, completed_at.
- import_rows: id, job_id, sheet_name, row_number, fingerprint, occurrence integer, payload jsonb, action (insert/unchanged/review/remove), status (pending/approved/applied/rejected), entity_type, entity_id nullable, expected_version nullable, message nullable.
- source_evidence: id, sheet_name, fingerprint, occurrence, payload jsonb, first_job_id, last_job_id; unique(sheet_name,fingerprint,occurrence). Raw evidence is staff-only.
- audit_log: id, actor_id, action, entity_type, entity_id, before_data jsonb, after_data jsonb, reason, created_at.

Additional normalized domain tables: person_observations, couples, circles, talks, talk_speakers, mandates, source_documents. Preserve fields beyond master sheets via raw evidence.

## Authorization/RPC contract

Staff-only direct domain SELECT; no public access. Participant only gets whitelisted own fields via get_my_profile()/get_my_history() RPCs. No exposed function can grant role or arbitrary person access. current_app_role() derives from table, never user_metadata. Supabase service secrets server only.

RPCs expected: get_my_profile(), get_my_history(), submit_identity_request(p_name,p_context), submit_correction(p_person_id,p_changes,p_reason), resolve_review(p_review_id,p_decision,p_reason,p_expected_version), merge_people(p_source_id,p_target_id,p_reason,p_source_version,p_target_version), reverse_merge(p_audit_id,p_reason). App staff reads via tables with RLS. Errors return safe messages to user. Staff changes transactional; audit writes privileged only.

## Root/agent ownership

- Root: package, data adapters, auth, API routes/actions, deployment, app layout/provider integration, operational docs, browser tests.
- Database agent: supabase/** and scripts/verify-database.ts and database tests. May add extra RPCs; report signatures.
- Import agent: src/lib/import/**, import unit tests, scripts/reconcile-workbook.py, docs/imports.md. No API routes or database migration writes; return requested SQL interfaces.
- UI agent: src/components/** and src/app/globals.css only. Own standalone client view components fed via src/lib/types.ts contract. Do not author layout/pages/data providers.
