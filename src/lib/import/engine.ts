import { createHash } from 'node:crypto';
import { SHEET_HEADERS, SHEET_NAMES, type SheetName } from './schema';

export type Cell = string | number | boolean | null;
export type Canonical = Record<string, string | number | null>;
export type Issue = { code: string; message: string };
export type RawSheet = { name: string; headers: Cell[]; rows: { rowNumber: number; values: Cell[] }[] };
export type SourceRow = { sheet_name: string; row_number: number; fingerprint: string; occurrence: number; payload: { raw: { headers: Cell[]; values: Cell[] }; canonical: Canonical; references: Record<string, string>; issues: Issue[] }; entity_type: EntityType };
export type EntityType = 'person' | 'encounter' | 'participation' | 'couple' | 'mandate' | 'evidence';
export type Snapshot = { hash: string; rows: SourceRow[]; counts: Record<string, number>; sourceRevision: string; capturedAt: string };
export type ExistingEntity = { id: string; legacy_id: string; version: number; protected_fields?: string[]; merged_into?: string | null; [key: string]: unknown };
export type ExistingEvidence = { sheet_name: string; fingerprint: string; occurrence: number; payload: SourceRow['payload']; entity_id?: string | null; entity_type?: EntityType };
export type ExistingState = { people: ExistingEntity[]; encounters: ExistingEntity[]; couples?: ExistingEntity[]; evidence: ExistingEvidence[] };
export type PlannedRow = SourceRow & { action: 'insert' | 'unchanged' | 'review' | 'remove'; status: 'pending'; entity_id: string | null; expected_version: number | null; message: string | null };
export type ImportPlan = { rows: PlannedRow[]; summary: Record<string, number> };

export function textValue(value: Cell | undefined): string { return value == null ? '' : String(value).normalize('NFC').trim(); }
export function nameKey(value: string): string { return value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
export function fingerprint(value: unknown): string { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
const blank = (value: Cell | undefined) => textValue(value) || null;
const year = (value: Cell | undefined): number | null => /^\d{4}$/.test(textValue(value)) ? Number(value) : null;
export function canonicalTeam(value: string): string { const key = nameKey(value); return ['compras', 'equipe de compras', 'prover'].includes(key) ? 'Prover' : ({ 'mini mercado': 'Minimercado', 'minimercado': 'Minimercado', 'intercessao paroquial': 'Intercessão Paroquial', 'espiritualizacao': 'Espiritualização', 'sala': 'Sala', 'circulo': 'Círculo' }[key] ?? value); }
export function canonicalKind(value: string): string { return ['vivenciou', 'vivenciante', 'vivenciando', 'jovem vivenciante'].includes(nameKey(value)) ? 'Vivenciou' : value; }

function transform(sheet: string, headers: Cell[], values: Cell[]): Pick<SourceRow, 'payload' | 'entity_type'> {
  const get = (label: string) => values[headers.findIndex(h => textValue(h) === label)];
  let entity_type: EntityType = 'evidence';
  let canonical: Canonical = {};
  const references: Record<string, string> = {};
  const issues: Issue[] = [];
  const person = textValue(get('ID da pessoa'));
  const encounter = textValue(get('ID do encontro'));
  if (person) references.person_legacy_id = person;
  if (encounter && sheet !== 'Encontros') references.encounter_legacy_id = encounter;
  if (sheet === 'Pessoas') {
    entity_type = 'person';
    canonical = { legacy_id: person, name: textValue(get('Nome completo')), phone: blank(get('Telefone principal')), email: blank(get('E-mail principal')), birth_date_text: blank(get('Nascimento')), sex: blank(get('Sexo')), identification_status: blank(get('Situação da identificação')), notes: blank(get('Observação')) };
    if (!/^PES-\d{5,}$/.test(person)) issues.push({ code: 'invalid_person_id', message: 'Código de pessoa ausente ou fora do padrão PES.' });
    if (!canonical.name) issues.push({ code: 'missing_name', message: 'Pessoa sem nome na fonte.' });
  } else if (sheet === 'Encontros') {
    entity_type = 'encounter';
    canonical = { legacy_id: encounter, edition: blank(get('Edição')), year: year(get('Ano')), parish: blank(get('Paróquia')), city: blank(get('Cidade/UF')), name: blank(get('Nome do evento')), date_text: blank(get('Data')), source_name: blank(get('Documento de origem')), extraction_status: blank(get('Status da extração')), notes: blank(get('Observação')) };
    if (!encounter) issues.push({ code: 'missing_encounter_id', message: 'Código de encontro ausente.' });
    if (textValue(get('Ano')) && !canonical.year) issues.push({ code: 'invalid_year', message: 'Ano não reconhecido; original preservado.' });
  } else if (sheet === 'Participações') {
    entity_type = 'participation';
    canonical = { kind: canonicalKind(textValue(get('Participação'))), condition: blank(get('Condição na época')), team: canonicalTeam(textValue(get('Equipe/Órgão'))) || null, circle: blank(get('Círculo')), role: blank(get('Cargo/Função')), patron: blank(get('Padroeiro')), source_page: blank(get('Página PDF')), notes: blank(get('Observação')) };
    if (!person || !encounter) issues.push({ code: 'missing_reference', message: 'Participação sem pessoa ou encontro identificado.' });
    if (nameKey(String(canonical.team)) === 'visitacao' && nameKey(String(canonical.condition)) !== 'casal') issues.push({ code: 'visitation_exception', message: 'Visitação exige casal ou confirmação de exceção documentada; preservar a fonte para revisão.' });
  } else if (sheet === 'Casais') {
    entity_type = 'couple';
    references.person_1_legacy_id = textValue(get('ID pessoa 1')); references.person_2_legacy_id = textValue(get('ID pessoa 2'));
    canonical = { legacy_id: textValue(get('ID do casal')), start_text: blank(get('Início conhecido')), end_text: blank(get('Fim conhecido')), notes: blank(get('Observação')) };
    if (!/^CAS-\d{5,}$/.test(String(canonical.legacy_id))) issues.push({ code: 'invalid_couple_id', message: 'Código de casal ausente ou fora do padrão CAS.' });
    if (!references.person_1_legacy_id || !references.person_2_legacy_id || references.person_1_legacy_id === references.person_2_legacy_id) issues.push({ code: 'invalid_couple', message: 'O vínculo precisa de duas pessoas distintas identificadas.' });
  } else if (sheet === 'Mandatos') {
    entity_type = 'mandate';
    canonical = { body: canonicalTeam(textValue(get('Órgão/Equipe'))), role: blank(get('Cargo')), condition: blank(get('Condição')), start_year: year(get('Ano inicial')), end_year: year(get('Ano final')), record_type: blank(get('Tipo de registro')), notes: blank(get('Observação')) };
    if (!person || !encounter) issues.push({ code: 'missing_reference', message: 'Mandato sem pessoa ou encontro identificado.' });
    for (const label of ['Ano inicial', 'Ano final']) if (textValue(get(label)) && year(get(label)) === null) issues.push({ code: 'partial_year', message: 'Período incompleto preservado na fonte; exige revisão.' });
  } else if (sheet !== 'Resumo') {
    // Names and shared contacts are evidence, never an automatic identity join.
    issues.push({ code: 'unlinked_detail', message: 'Detalhe preservado como evidência; vínculo com pessoa depende de revisão.' });
  }
  return { entity_type, payload: { raw: { headers: [...headers], values: [...values] }, canonical, references, issues } };
}

export function createSnapshot(sheets: RawSheet[], metadata: { sourceRevision: string; capturedAt?: string }): Snapshot {
  const byName = new Map(sheets.map(sheet => [sheet.name, sheet]));
  if (byName.size !== sheets.length) throw new Error('Abas duplicadas na captura.');
  const missing = SHEET_NAMES.filter(name => !byName.has(name));
  if (missing.length) throw new Error(`Captura incompleta: faltam ${missing.join(', ')}.`);
  const rows: SourceRow[] = [];
  const counts: Record<string, number> = {};
  for (const sheetName of SHEET_NAMES) {
    const sheet = byName.get(sheetName)!;
    const expected = SHEET_HEADERS[sheetName];
    if (expected.some((label, index) => textValue(sheet.headers[index]) !== label)) throw new Error(`Cabeçalho de ${sheetName} mudou; revisão do mapeamento necessária.`);
    if (sheet.headers.slice(expected.length).some(cell => textValue(cell))) throw new Error(`Colunas novas em ${sheetName}; revisão do mapeamento necessária.`);
    const occurrences = new Map<string, number>();
    for (const raw of sheet.rows) {
      if (raw.rowNumber < 4 || raw.values.every(value => !textValue(value))) continue;
      if (raw.values.slice(expected.length).some(value => textValue(value))) throw new Error(`Dados sem cabeçalho em ${sheetName}, linha ${raw.rowNumber}.`);
      const padded = Array.from({ length: expected.length }, (_, i) => raw.values[i] ?? null);
      // Raw cell type and value remain intact in payload. The identity ignores trailing empty cell padding only.
      const hash = fingerprint([sheetName, padded.map(value => value === '' ? null : value)]);
      const occurrence = (occurrences.get(hash) ?? 0) + 1;
      occurrences.set(hash, occurrence);
      rows.push({ sheet_name: sheetName, row_number: raw.rowNumber, fingerprint: hash, occurrence, ...transform(sheetName, [...expected], padded) });
    }
    counts[sheetName] = [...occurrences.values()].reduce((a, b) => a + b, 0);
  }
  const multiset = rows.map(row => `${row.sheet_name}:${row.fingerprint}:${row.occurrence}`).sort();
  return { hash: fingerprint(multiset), rows, counts, sourceRevision: metadata.sourceRevision, capturedAt: metadata.capturedAt ?? new Date().toISOString() };
}

const evidenceKey = (r: Pick<SourceRow, 'sheet_name' | 'fingerprint' | 'occurrence'>) => `${r.sheet_name}:${r.fingerprint}:${r.occurrence}`;
const historyGroup = (r: Pick<SourceRow, 'entity_type' | 'payload'>) => ['participation', 'mandate'].includes(r.entity_type) ? `${r.entity_type}:${r.payload.references.person_legacy_id}:${r.payload.references.encounter_legacy_id}` : null;
export function planImport(snapshot: Snapshot, state: ExistingState): ImportPlan {
  const people = new Map(state.people.map(p => [p.legacy_id, p]));
  const encounters = new Map(state.encounters.map(e => [e.legacy_id, e]));
  const couples = new Map((state.couples ?? []).map(c => [c.legacy_id, c]));
  const seen = new Set(snapshot.rows.map(evidenceKey));
  const previous = new Map(state.evidence.map(e => [evidenceKey(e), e]));
  const validMasters = new Map<string, SourceRow[]>();
  for (const row of snapshot.rows) if (['person', 'encounter', 'couple'].includes(row.entity_type)) {
    const key = `${row.entity_type}:${row.payload.canonical.legacy_id}`;
    validMasters.set(key, [...(validMasters.get(key) ?? []), row]);
  }
  const priorGroups = new Set(state.evidence.map(row => historyGroup({ ...row, entity_type: row.entity_type ?? (row.sheet_name === 'Participações' ? 'participation' : row.sheet_name === 'Mandatos' ? 'mandate' : 'evidence') })).filter(Boolean));
  const safeMaster = (kind: string, legacy: string) => { const masters = validMasters.get(`${kind}:${legacy}`); return masters?.length === 1 && masters[0].payload.issues.length === 0; };
  const rows = snapshot.rows.map<PlannedRow>(original => {
    const row: PlannedRow = { ...original, payload: structuredClone(original.payload), action: 'insert', status: 'pending', entity_id: null, expected_version: null, message: null };
    const canonical = row.payload.canonical;
    const legacy = String(canonical.legacy_id ?? '');
    const entity = row.entity_type === 'person' ? people.get(legacy) : row.entity_type === 'encounter' ? encounters.get(legacy) : row.entity_type === 'couple' ? couples.get(legacy) : undefined;
    if (entity) { row.entity_id = entity.id; row.expected_version = entity.version; }
    const issue = (code: string, message: string) => row.payload.issues.push({ code, message });
    if (['person', 'encounter', 'couple'].includes(row.entity_type) && (validMasters.get(`${row.entity_type}:${legacy}`)?.length ?? 0) > 1) issue('duplicate_master_id', 'Código mestre repetido; todas as ocorrências exigem revisão.');
    for (const [field, id] of Object.entries(row.payload.references)) {
      if (field.includes('person')) {
        const found = people.get(id);
        if (found?.merged_into) issue('retired_id', 'ID de pessoa aposentado por mesclagem; confirmar vínculo com cadastro canônico.');
        else if (!found && !safeMaster('person', id)) issue('orphan_person', 'Pessoa referenciada não existe ou seu cadastro está em revisão.');
      } else if (field === 'encounter_legacy_id' && !encounters.has(id) && !safeMaster('encounter', id)) issue('orphan_encounter', 'Encontro referenciado não existe ou está em revisão.');
    }
    if (entity?.merged_into) issue('retired_id', 'Cadastro aposentado não pode ser recriado pela planilha.');
    if (entity && !entity.merged_into) {
      const differences = Object.keys(canonical).filter(key => key !== 'legacy_id' && (entity[key] ?? null) !== canonical[key]);
      if (differences.length) {
        const protectedDifferences = differences.filter(key => entity.protected_fields?.includes(key));
        issue(protectedDifferences.length ? 'protected_field' : 'master_changed', protectedDifferences.length ? 'A planilha diverge de campos corrigidos no app; a correção aprovada prevalece.' : 'Cadastro existente diverge da fonte; comparar antes de alterar.');
        row.payload.canonical = { ...canonical };
      } else row.action = 'unchanged';
    }
    const prior = previous.get(evidenceKey(row));
    if (prior && !row.payload.issues.some(i => ['retired_id', 'protected_field', 'master_changed', 'duplicate_master_id', 'orphan_person', 'orphan_encounter'].includes(i.code))) {
      // An identical unlinked detail remains stored once; do not regenerate its review on every import.
      row.action = 'unchanged';
      row.payload.issues = row.payload.issues.filter(i => i.code !== 'unlinked_detail');
    } else if (historyGroup(row) && priorGroups.has(historyGroup(row))) issue('ambiguous_history_change', 'Há histórico da mesma pessoa neste encontro; pode ser nova função ou edição de uma linha sem ID próprio.');
    if (row.occurrence > 1 && !prior) issue('repeated_source_row', 'Linha idêntica repetida na fonte; confirmar multiplicidade antes de criar outro fato.');
    if (row.payload.issues.length) row.action = 'review';
    row.message = row.payload.issues.map(i => i.message).join(' ') || null;
    return row;
  });
  for (const removed of state.evidence) if (!seen.has(evidenceKey(removed))) rows.push({ sheet_name: removed.sheet_name, row_number: 0, fingerprint: removed.fingerprint, occurrence: removed.occurrence, payload: { ...structuredClone(removed.payload), issues: [{ code: 'missing_source_row', message: 'Linha ausente desta captura. O histórico existente será preservado.' }] }, entity_type: removed.entity_type ?? 'evidence', action: 'remove', status: 'pending', entity_id: removed.entity_id ?? null, expected_version: null, message: 'Ausência na planilha não exclui o histórico.' });
  return { rows, summary: { rows: snapshot.rows.length, insert: rows.filter(r => r.action === 'insert').length, unchanged: rows.filter(r => r.action === 'unchanged').length, review: rows.filter(r => r.action === 'review').length, removed: rows.filter(r => r.action === 'remove').length, people: snapshot.counts.Pessoas ?? 0, encounters: snapshot.counts.Encontros ?? 0, participations: snapshot.counts.Participações ?? 0 } };
}
