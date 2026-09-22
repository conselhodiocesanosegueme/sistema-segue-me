import 'server-only';
import { cache } from 'react';
import { isDemoMode } from './config';
import { readDemo, hydrateParticipation, hydrateReview, demoPersonId } from './demo';
import { supabaseServer, supabaseAdmin } from './supabase/server';
import { getViewer } from './auth';
import { checkDb } from './http';
import { isMandateRecord, normalizeMandateBody } from './encounter-config';
import type {
  CoupleInfo,
  Encounter,
  EncounterType,
  ImportJob,
  Mandate,
  MyHistoryData,
  Overview,
  PageResult,
  Participation,
  Person,
  PersonAvailability,
  PublicDiocesanStats,
  ReviewItem,
} from './types';
import { ENCOUNTER_TYPES } from './encounter-config';
import { DIOCESAN_SECTORS, matchEncounterToParish } from './sectors';
import { mutateDemo } from './demo';
export function pageNumber(value:string|undefined){const parsed=Number(value||1);return Number.isFinite(parsed)?Math.max(1,Math.min(Math.floor(parsed),100000)):1;}
const text=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function hydratePerson<T extends Partial<Person>>(p: T | null | undefined): T | null {
  if (!p) return null;
  let photo_url = p.photo_url || null;
  let skills = p.skills || null;
  let pastoral_notes = p.pastoral_notes || '';
  let engagement_status = p.engagement_status || 'neutro';
  let availability: PersonAvailability | null = (p as any).availability || null;

  if ((p as any).notes) {
    try {
      const parsed = typeof (p as any).notes === 'string' ? JSON.parse((p as any).notes) : (p as any).notes;
      if (parsed && typeof parsed === 'object') {
        if (!photo_url && parsed.photo_url) photo_url = parsed.photo_url;
        if (!skills && parsed.skills) skills = parsed.skills;
        if (!pastoral_notes && parsed.pastoral_notes) pastoral_notes = parsed.pastoral_notes;
        if ((!engagement_status || engagement_status === 'neutro') && parsed.engagement_status) {
          engagement_status = parsed.engagement_status;
        }
        if (!availability && parsed.availability) {
          availability = parsed.availability;
        }
      }
    } catch {}
  }
  return { ...p, photo_url, skills, pastoral_notes, engagement_status, availability };
}

export async function getPeople(filters: Record<string, string>): Promise<PageResult<Person>> {
  const page = pageNumber(filters.page), pageSize = 20;
  if (isDemoMode()) {
    const state = await readDemo();
    const q = text(filters.q || '');
    const list = state.people.filter(p => {
      if (p.merged_into) return false;
      if (q && !text(`${p.name} ${p.legacy_id || ''} ${p.phone || ''} ${p.email || ''}`).includes(q)) return false;
      if (filters.status && p.identification_status !== filters.status) return false;

      // Filtro por paróquia
      if (filters.parish) {
        const belongsToParish = p.parish === filters.parish ||
          state.participations.some(h => h.person_id === p.id && state.encounters.some(e => e.id === h.encounter_id && e.parish === filters.parish));
        if (!belongsToParish) return false;
      }

      // Filtros rápidos específicos do movimento
      if (filters.quickFilter === 'youth_vivenciou') {
        const isYouthVivenciou = state.participations.some(h =>
          h.person_id === p.id &&
          h.kind === 'Vivenciou' &&
          h.condition === 'Jovem' &&
          (!filters.parish || state.encounters.some(e => e.id === h.encounter_id && e.parish === filters.parish))
        );
        if (!isYouthVivenciou) return false;
      } else if (filters.quickFilter === 'worked') {
        const hasWorked = state.participations.some(h =>
          h.person_id === p.id &&
          h.kind === 'Trabalhou' &&
          !isMandateRecord(h) &&
          (!filters.parish || state.encounters.some(e => e.id === h.encounter_id && e.parish === filters.parish))
        );
        if (!hasWorked) return false;
      } else if (filters.quickFilter === 'couples') {
        const isCouple = state.participations.some(h =>
          h.person_id === p.id &&
          h.condition === 'Casal' &&
          (!filters.parish || state.encounters.some(e => e.id === h.encounter_id && e.parish === filters.parish))
        ) || (state.couples || []).some(c => (c.person_1_id === p.id || c.person_2_id === p.id) && (!filters.parish || p.parish === filters.parish));
        if (!isCouple) return false;
      } else if (filters.quickFilter === 'musicians') {
        const hydrated = hydratePerson(p);
        const hasMusicalSkill = Boolean(
          hydrated?.skills?.sings ||
          (hydrated?.skills?.instruments && hydrated.skills.instruments.length > 0)
        );
        if (!hasMusicalSkill) return false;
      } else if (filters.quickFilter === 'speakers') {
        const hydrated = hydratePerson(p);
        const hasSpeakerSkill = (hydrated?.skills?.other_skills || []).some(s => s.toLowerCase().includes('palestr') || s.toLowerCase().includes('prega'));
        const parsedNotes = typeof p.notes === 'string' ? (() => { try { return JSON.parse(p.notes); } catch { return {}; } })() : (p.notes || {});
        const hasTalks = state.participations.some(h => h.person_id === p.id && (h.kind === 'Palestrou' || (h.team || '').toLowerCase() === 'palestrantes'));
        const isSpeaker = Boolean(hasTalks || parsedNotes.is_speaker || hasSpeakerSkill);
        if (!isSpeaker) return false;
      } else if (filters.quickFilter === 'talents') {
        const hydrated = hydratePerson(p);
        const hasAnyTalent = Boolean(
          hydrated?.skills?.sings ||
          (hydrated?.skills?.instruments && hydrated.skills.instruments.length > 0) ||
          (hydrated?.skills?.other_skills && hydrated.skills.other_skills.length > 0)
        );
        if (!hasAnyTalent) return false;
      } else if (filters.quickFilter === 'available') {
        const hydrated = hydratePerson(p);
        const isAvailable = hydrated?.availability?.status === 'disponivel' || hydrated?.engagement_status === 'disponivel';
        if (!isAvailable) return false;
      } else if (filters.quickFilter === 'second_stage') {
        const hydrated = hydratePerson(p);
        const wantsSecondStage = hydrated?.availability?.second_stage_status === 'desejo_vivenciar';
        if (!wantsSecondStage) return false;
      }

      // Filtros detalhados de encontro, equipe, tipo e ano
      if (filters.year || filters.encounter || filters.team || filters.kind) {
        const matchesParticipation = state.participations.some(h =>
          h.person_id === p.id &&
          (!filters.team || h.team === filters.team) &&
          (!filters.kind || h.kind === filters.kind) &&
          (!filters.encounter || h.encounter_id === filters.encounter) &&
          state.encounters.some(e => e.id === h.encounter_id && (!filters.parish || e.parish === filters.parish) && (!filters.year || e.year === Number(filters.year)))
        );
        if (!matchesParticipation) return false;
      }

      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return {
      items: list.slice((page - 1) * pageSize, page * pageSize).map(p => hydratePerson({
        ...p,
        participation_count: state.participations.filter(h => h.person_id === p.id).length
      }) as Person),
      total: list.length,
      page,
      pageSize
    };
  }

  const db = await supabaseServer();
  const admin = supabaseAdmin();

  // Tratamento de filtros rápidos para Músicos, Palestrantes, Habilidades, Disponibilidade e 2ª Etapa em modo Supabase
  if (
    filters.quickFilter === 'musicians' ||
    filters.quickFilter === 'speakers' ||
    filters.quickFilter === 'talents' ||
    filters.quickFilter === 'available' ||
    filters.quickFilter === 'second_stage'
  ) {
    try {
      let query = admin
        .from('people')
        .select('id, legacy_id, name, phone, email, birth_date_text, sex, identification_status, notes, version, parish, photo_url', { count: 'exact' })
        .is('merged_into', null);

      if (filters.quickFilter === 'speakers') {
        query = query.or('notes.ilike.%"is_speaker":true%,notes.ilike.%"Palestra%');
      } else if (filters.quickFilter === 'available') {
        query = query.or('notes.ilike.%"status":"disponivel"%,notes.ilike.%"engagement_status":"disponivel"%');
      } else if (filters.quickFilter === 'second_stage') {
        query = query.ilike('notes', '%"second_stage_status":"desejo_vivenciar"%');
      } else {
        query = query.ilike('notes', '%"skills"%');
      }

      if (filters.parish) query = query.eq('parish', filters.parish);
      if (filters.q) query = query.ilike('name', `%${filters.q}%`);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: peopleData, count, error: queryErr } = await query.order('name', { ascending: true }).range(from, to);

      if (!queryErr && peopleData) {
        return {
          items: peopleData.map(p => hydratePerson(p) as Person),
          total: count ?? peopleData.length,
          page,
          pageSize
        };
      }
    } catch {
      // segue para busca padrão em caso de fallback
    }
  }

  const { data, error } = await db.rpc('search_people', {
    p_query: filters.q || '',
    p_page: page,
    p_page_size: pageSize,
    p_parish: filters.parish || null,
    p_year: filters.year ? Number(filters.year) : null,
    p_encounter: filters.encounter || null,
    p_team: filters.team || null,
    p_kind: filters.kind || null,
    p_status: filters.status || null
  });
  checkDb(error);
  const result = data as PageResult<Person>;
  if (result && Array.isArray(result.items)) {
    result.items = result.items.map(p => hydratePerson(p) as Person);
  }
  return result;
}
export async function getPerson(id: string) {
  if (isDemoMode()) {
    const p = (await readDemo()).people.find(p => p.id === id) || null;
    return hydratePerson(p) as Person | null;
  }
  const db = await supabaseServer();
  let { data, error } = await db.from('people').select('*').eq('id', id).maybeSingle();
  if (!data) {
    const admin = supabaseAdmin();
    const res = await admin.from('people').select('*').eq('id', id).maybeSingle();
    data = res.data;
  }
  return hydratePerson(data) as Person | null;
}
export async function getParticipations(personId?: string, encounterId?: string): Promise<Participation[]> {
  if (isDemoMode()) {
    const state = await readDemo();
    return state.participations
      .filter(p => (!personId || p.person_id === personId) && (!encounterId || p.encounter_id === encounterId))
      .map(p => hydrateParticipation(p, state))
      .sort((a, b) => {
        const yA = a.encounter?.year || 0;
        const yB = b.encounter?.year || 0;
        if (yB !== yA) return yB - yA;
        const edA = typeof a.encounter?.edition === 'number' ? a.encounter.edition : Number(a.encounter?.edition || 0);
        const edB = typeof b.encounter?.edition === 'number' ? b.encounter.edition : Number(b.encounter?.edition || 0);
        return edB - edA;
      });
  }
  const db = await supabaseServer();
  let query = db.from('participations').select('*,encounter:encounters(*),person:people(*)').order('created_at', { ascending: false });
  if (personId) query = query.eq('person_id', personId);
  if (encounterId) query = query.eq('encounter_id', encounterId).limit(2500);
  else query = query.limit(500);
  const { data, error } = await query;
  checkDb(error);
  const items = ((data || []) as unknown as Participation[]);
  return items.sort((a, b) => {
    const yA = a.encounter?.year || 0;
    const yB = b.encounter?.year || 0;
    if (yB !== yA) return yB - yA;
    const edA = typeof a.encounter?.edition === 'number' ? a.encounter.edition : Number(a.encounter?.edition || 0);
    const edB = typeof b.encounter?.edition === 'number' ? b.encounter.edition : Number(b.encounter?.edition || 0);
    return edB - edA;
  });
}
export async function getEncounters(filters: Record<string, string> = {}): Promise<PageResult<Encounter>> {
  const page = pageNumber(filters.page), pageSize = filters.pageSize ? Math.min(Number(filters.pageSize), 1000) : 20;
  if (isDemoMode()) {
    const state = await readDemo();
    const list = state.encounters.filter(e =>
      (!filters.q || text(`${e.name} ${e.parish} ${e.city}`).includes(text(filters.q))) &&
      (!filters.year || e.year === Number(filters.year)) &&
      (!filters.parish || e.parish === filters.parish) &&
      (!filters.type || (e.type || '1ª Etapa') === filters.type) &&
      (!filters.level || (e.level || 'Paroquial') === filters.level)
    ).sort((a, b) => (b.year || 0) - (a.year || 0));
    return {
      items: list.slice((page - 1) * pageSize, page * pageSize).map(e => ({
        ...e,
        type: e.type || (e.is_external_implantation ? 'Implantação Externa' : '1ª Etapa'),
        level: e.level || (e.is_external_implantation ? 'Outra Diocese' : e.type === '1ª Etapa' || !e.type ? 'Paroquial' : 'Diocesano'),
        participation_count: state.participations.filter(p => p.encounter_id === e.id).length,
        target_diocese: e.target_diocese || null,
        is_external_implantation: Boolean(e.is_external_implantation || e.type === 'Implantação Externa'),
      })),
      total: list.length,
      page,
      pageSize
    };
  }
  const db = await supabaseServer();
  let query = db.from('encounters').select('*,participations(count)', { count: 'exact' }).order('year', { ascending: false, nullsFirst: false }).order('id').range((page - 1) * pageSize, page * pageSize - 1);
  if (filters.q) { const clean = filters.q.replace(/[%_(),]/g, ' ').slice(0, 100); query = query.or(`name.ilike.%${clean}%,parish.ilike.%${clean}%,city.ilike.%${clean}%`); }
  if (filters.year) query = query.eq('year', Number(filters.year));
  if (filters.parish) query = query.eq('parish', filters.parish);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.level) query = query.eq('level', filters.level);
  let { data, error, count } = await query;

  // Recuperação resiliente caso a coluna type/level ainda não exista no PostgreSQL (erro 42703)
  if (error && error.code === '42703' && (filters.type || filters.level)) {
    let fallbackQuery = db.from('encounters').select('*,participations(count)', { count: 'exact' }).order('year', { ascending: false, nullsFirst: false }).order('id');
    if (filters.q) { const clean = filters.q.replace(/[%_(),]/g, ' ').slice(0, 100); fallbackQuery = fallbackQuery.or(`name.ilike.%${clean}%,parish.ilike.%${clean}%,city.ilike.%${clean}%`); }
    if (filters.year) fallbackQuery = fallbackQuery.eq('year', Number(filters.year));
    if (filters.parish) fallbackQuery = fallbackQuery.eq('parish', filters.parish);
    const fallbackRes = await fallbackQuery;
    if (!fallbackRes.error && fallbackRes.data) {
      const allItems = fallbackRes.data.map((e: any) => {
        const encType = (e.type as EncounterType) || (e.is_external_implantation ? 'Implantação Externa' : '1ª Etapa');
        const typeInfo = ENCOUNTER_TYPES[encType] || ENCOUNTER_TYPES['1ª Etapa'];
        const pCount = (Array.isArray(e.participations) && e.participations[0]?.count) ?? e.participation_count ?? 0;
        return {
          ...e,
          type: encType,
          level: e.level || (encType === 'Implantação Externa' ? 'Outra Diocese' : encType === '1ª Etapa' ? 'Paroquial' : 'Diocesano'),
          teams: Array.isArray(e.teams) ? e.teams : (typeInfo.defaultTeams || []),
          participation_count: pCount,
          target_diocese: e.target_diocese || null,
          is_external_implantation: Boolean(e.is_external_implantation || encType === 'Implantação Externa'),
        };
      }) as Encounter[];
      const filtered = allItems.filter(e => {
        if (filters.type && e.type !== filters.type) return false;
        if (filters.level && e.level !== filters.level) return false;
        return true;
      });
      const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
      return { items: paged, total: filtered.length, page, pageSize };
    }
  }

  checkDb(error);
  const items = (data || []).map((e: any) => {
    const encType = (e.type as EncounterType) || (e.is_external_implantation ? 'Implantação Externa' : '1ª Etapa');
    const typeInfo = ENCOUNTER_TYPES[encType] || ENCOUNTER_TYPES['1ª Etapa'];
    const pCount = (Array.isArray(e.participations) && e.participations[0]?.count) ?? e.participation_count ?? 0;
    return {
      ...e,
      type: encType,
      level: e.level || (encType === 'Implantação Externa' ? 'Outra Diocese' : encType === '1ª Etapa' ? 'Paroquial' : 'Diocesano'),
      teams: Array.isArray(e.teams) ? e.teams : (typeInfo.defaultTeams || []),
      participation_count: pCount,
      target_diocese: e.target_diocese || null,
      is_external_implantation: Boolean(e.is_external_implantation || encType === 'Implantação Externa'),
    };
  }) as Encounter[];
  return { items, total: count || 0, page, pageSize };
}
export async function createEncounter(payload: Partial<Encounter>): Promise<Encounter> {
  const type = payload.type || '1ª Etapa';
  const level = payload.level || (type === '1ª Etapa' ? 'Paroquial' : 'Diocesano');
  const defaultTeams = ENCOUNTER_TYPES[type]?.defaultTeams || [];
  const teams = payload.teams && payload.teams.length > 0 ? payload.teams : defaultTeams;

  const newEncounter: Encounter = {
    id: crypto.randomUUID(),
    legacy_id: payload.legacy_id || `ENC-${Date.now().toString().slice(-5)}`,
    edition: payload.edition || '1º',
    year: payload.year ? Number(payload.year) : new Date().getFullYear(),
    parish: payload.parish || (level === 'Diocesano' ? 'Diocese de Anápolis' : 'Paróquia não informada'),
    city: payload.city || (level === 'Diocesano' ? 'Anápolis - GO' : ''),
    name: payload.name || `${payload.edition || '1º'} ${type} Segue-me`,
    date_text: payload.date_text || '',
    type,
    level,
    teams,
    extraction_status: 'manual',
    theme: payload.theme || null,
    notes: payload.notes || null,
  };

  if (isDemoMode()) {
    await mutateDemo((state) => {
      state.encounters.unshift(newEncounter);
    });
    return newEncounter;
  }

  const db = await supabaseServer();
  const { data, error } = await db.from('encounters').insert([newEncounter]).select().single();
  if (error && error.code === '42703') {
    // Se novas colunas ainda não existirem, insere com os campos básicos da tabela
    const baseEncounter = {
      id: newEncounter.id,
      legacy_id: newEncounter.legacy_id,
      edition: newEncounter.edition,
      year: newEncounter.year,
      parish: newEncounter.parish,
      city: newEncounter.city,
      name: newEncounter.name,
      date_text: newEncounter.date_text,
      extraction_status: newEncounter.extraction_status,
      notes: newEncounter.notes,
    };
    const retry = await db.from('encounters').insert([baseEncounter]).select().single();
    if (!retry.error) {
      return { ...newEncounter, ...(retry.data || {}) };
    }
  }
  checkDb(error);
  return (data || newEncounter) as Encounter;
}
export async function updateEncounter(id: string, payload: Partial<Encounter>): Promise<Encounter> {
  if (isDemoMode()) {
    let updated: Encounter | null = null;
    await mutateDemo((state) => {
      const idx = state.encounters.findIndex(e => e.id === id);
      if (idx !== -1) {
        state.encounters[idx] = { ...state.encounters[idx], ...payload };
        updated = state.encounters[idx];
      }
    });
    if (!updated) throw new Error('Encontro não encontrado');
    return updated;
  }

  const db = await supabaseServer();
  const { data, error } = await db.from('encounters').update(payload).eq('id', id).select().single();
  checkDb(error);
  return data as Encounter;
}
export async function getMandates(filters: Record<string, string | undefined> = {}, page = 1, pageSize = 30): Promise<PageResult<Mandate>> {
  if (isDemoMode()) {
    const state = await readDemo();
    let list = (state.mandates || []).filter(m => {
      if (filters.body && m.body !== filters.body) return false;
      if (filters.parish && m.parish !== filters.parish) return false;
      if (filters.sector_id && m.sector_id !== filters.sector_id) return false;
      if (filters.condition && m.condition !== filters.condition) return false;
      if (filters.year) {
        const y = Number(filters.year);
        if (m.start_year && m.end_year && (y < m.start_year || y > m.end_year)) return false;
        if (m.start_year && !m.end_year && m.start_year !== y) return false;
      }
      return true;
    });

    const items = list.slice((page - 1) * pageSize, page * pageSize).map(m => {
      const person = state.people.find(p => p.id === m.person_id);
      const encounter = state.encounters.find(e => e.id === m.encounter_id);
      let spouse: any = null;
      if (m.condition === 'Casal') {
        const couple = (state.couples || []).find(c => c.person_1_id === m.person_id || c.person_2_id === m.person_id);
        if (couple) {
          const spouseId = couple.person_1_id === m.person_id ? couple.person_2_id : couple.person_1_id;
          const spPerson = state.people.find(p => p.id === spouseId);
          if (spPerson) {
            spouse = {
              id: spPerson.id,
              name: spPerson.name,
              legacy_id: spPerson.legacy_id,
              phone: spPerson.phone,
              email: spPerson.email,
              parish: spPerson.parish,
              sex: spPerson.sex,
            };
          }
        }
      }
      return {
        ...m,
        person,
        encounter,
        spouse,
        status: (m.end_year && m.end_year < new Date().getFullYear()) ? 'Concluído' : 'Ativo'
      } as Mandate;
    });

    return { items, total: list.length, page, pageSize };
  }

  const db = await supabaseServer();
  let query = db.from('mandates').select('*, person:people(*), encounter:encounters(*)', { count: 'exact' })
    .order('start_year', { ascending: false, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.body) query = query.eq('body', filters.body);
  if (filters.parish) query = query.eq('parish', filters.parish);
  if (filters.sector_id) query = query.eq('sector_id', filters.sector_id);
  if (filters.condition) query = query.eq('condition', filters.condition);
  if (filters.year) query = query.gte('end_year', Number(filters.year)).lte('start_year', Number(filters.year));

  let { data, error, count } = await query;
  if (error && error.code === '42703') {
    // Fallback se colunas de filtro como parish/sector_id ainda não existirem em mandates
    const simpleQuery = await db.from('mandates').select('*, person:people(*), encounter:encounters(*)', { count: 'exact' })
      .order('start_year', { ascending: false, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    data = simpleQuery.data;
    error = simpleQuery.error;
    count = simpleQuery.count;
  }
  checkDb(error);
  const items: Mandate[] = [];
  const couplePersonIds: string[] = [];
  for (const raw of data || []) {
    const meta = normalizeMandateBody(raw.body, raw.role);
    if (!meta) continue;
    const roleLower = (raw.role || '').toLowerCase();
    const isCoupleCandidate = raw.condition === 'Casal' || roleLower.includes('casal') || roleLower.includes('tesour') || (raw.body || '').includes('Conselho');
    if (isCoupleCandidate && raw.person_id) {
      couplePersonIds.push(raw.person_id);
    }
    items.push({
      ...raw,
      body: meta.normalizedBody,
      sector_id: raw.sector_id || meta.sectorId || null,
      status: (raw.end_year && raw.end_year < new Date().getFullYear()) ? 'Concluído' : 'Ativo'
    } as Mandate);
  }

  // Resolução de cônjuges para casais
  if (couplePersonIds.length > 0) {
    try {
      const uniqueIds = Array.from(new Set(couplePersonIds));
      const spouseMap = new Map<string, string>();
      const spouseIds: string[] = [];

      // Consulta em lotes de 50 para contornar limites de URL no PostgREST
      for (let i = 0; i < uniqueIds.length; i += 50) {
        const chunk = uniqueIds.slice(i, i + 50);
        const { data: couplesData } = await db.from('couples')
          .select('person_1_id, person_2_id')
          .or(`person_1_id.in.(${chunk.join(',')}),person_2_id.in.(${chunk.join(',')})`);

        if (couplesData && couplesData.length > 0) {
          for (const c of couplesData) {
            if (uniqueIds.includes(c.person_1_id)) {
              spouseMap.set(c.person_1_id, c.person_2_id);
              spouseIds.push(c.person_2_id);
            }
            if (uniqueIds.includes(c.person_2_id)) {
              spouseMap.set(c.person_2_id, c.person_1_id);
              spouseIds.push(c.person_1_id);
            }
          }
        }
      }

      if (spouseIds.length > 0) {
        const uniqueSpouseIds = Array.from(new Set(spouseIds));
        const allSpouses: any[] = [];
        for (let i = 0; i < uniqueSpouseIds.length; i += 50) {
          const chunk = uniqueSpouseIds.slice(i, i + 50);
          const { data: spousesData } = await db.from('people')
            .select('id, name, legacy_id, phone, email, parish, sex')
            .in('id', chunk);
          if (spousesData) {
            allSpouses.push(...spousesData);
          }
        }

        const spMap = new Map(allSpouses.map(p => [p.id, p]));
        for (const item of items) {
          if (item.person_id) {
            // Mandatos com condição explicitamente Jovem NUNCA recebem cônjuge nem viram Casal
            if (item.condition === 'Jovem') {
              continue;
            }
            const spId = spouseMap.get(item.person_id);
            if (spId && spMap.has(spId)) {
              item.spouse = spMap.get(spId);
              // Se tiver cônjuge e o cargo ou corpo for de casal/tesouraria, define condition = 'Casal'
              const rLower = (item.role || '').toLowerCase();
              if (rLower.includes('casal') || rLower.includes('tesour') || item.condition === 'Casal') {
                item.condition = 'Casal';
              }
            }
          }
        }
      }
    } catch {
      // Ignora falha de busca de cônjuge em lote
    }
  }

  return { items, total: items.length, page, pageSize };
}
export async function createMandate(payload: Partial<Mandate>): Promise<Mandate> {
  const newMandate: Mandate = {
    id: crypto.randomUUID(),
    person_id: payload.person_id!,
    encounter_id: payload.encounter_id || null,
    body: payload.body || 'Equipe Dirigente - 1ª Etapa',
    role: payload.role || 'Membro',
    condition: payload.condition || 'Jovem',
    start_year: payload.start_year ? Number(payload.start_year) : new Date().getFullYear(),
    end_year: payload.end_year ? Number(payload.end_year) : (payload.start_year ? Number(payload.start_year) : new Date().getFullYear()),
    parish: payload.parish || null,
    sector_id: payload.sector_id || null,
    record_type: payload.record_type || 'manual',
    notes: payload.notes || null,
    status: 'Ativo',
  };

  if (isDemoMode()) {
    await mutateDemo((state) => {
      if (!state.mandates) state.mandates = [];
      state.mandates.unshift(newMandate);
    });
    return newMandate;
  }

  const db = await supabaseServer();
  const { data, error } = await db.from('mandates').insert([newMandate]).select('*, person:people(*)').single();
  if (error && error.code === '42703') {
    const baseMandate = {
      id: newMandate.id,
      person_id: newMandate.person_id,
      encounter_id: newMandate.encounter_id,
      body: newMandate.body,
      role: newMandate.role,
      condition: newMandate.condition,
      start_year: newMandate.start_year,
      end_year: newMandate.end_year,
      record_type: newMandate.record_type,
      notes: newMandate.notes,
    };
    const retry = await db.from('mandates').insert([baseMandate]).select('*, person:people(*)').single();
    if (!retry.error) {
      return { ...newMandate, ...(retry.data || {}) };
    }
  }
  checkDb(error);
  return (data || newMandate) as Mandate;
}
export async function deleteMandate(id: string): Promise<void> {
  if (isDemoMode()) {
    await mutateDemo((state) => {
      state.mandates = (state.mandates || []).filter(m => m.id !== id);
    });
    return;
  }

  const db = await supabaseServer();
  const { error } = await db.from('mandates').delete().eq('id', id);
  checkDb(error);
}
export async function getEncounter(id: string) { if (isDemoMode()) return (await readDemo()).encounters.find(e => e.id === id) || null; const db = await supabaseServer(); const { data, error } = await db.from('encounters').select('*').eq('id', id).maybeSingle(); checkDb(error); return data as Encounter | null; }
export async function getReviews(status = 'pending'): Promise<ReviewItem[]> {
  if (isDemoMode()) { const state = await readDemo(); return state.reviews.filter(r => status === 'all' || r.status === status).map(r => hydrateReview(r, state)); }
  const db = await supabaseServer(); let query = db.from('review_items').select('*').order('created_at', { ascending: false }).limit(100); if (status !== 'all') query = query.eq('status', status); const { data, error } = await query; checkDb(error); const items = data as ReviewItem[]; const ids = [...new Set(items.flatMap(r => [r.person_id, r.related_person_id]).filter(Boolean))] as string[]; if (!ids.length) return items; const { data: people, error: personError } = await db.from('people').select('*').in('id', ids); checkDb(personError); return items.map(r => ({ ...r, person: people?.find(p => p.id === r.person_id), related_person: people?.find(p => p.id === r.related_person_id) }));
}
export async function getImports(): Promise<ImportJob[]> { if (isDemoMode()) return (await readDemo()).imports; const db = await supabaseServer(); const { data, error } = await db.from('import_jobs').select('*').order('created_at', { ascending: false }).limit(30); checkDb(error); return data as ImportJob[]; }
export async function getDatabaseMetrics() {
  if (isDemoMode()) {
    const state = await readDemo();
    return {
      people: state.people.length,
      encounters: state.encounters.length,
      couples: (state.couples || []).length,
      participations: state.participations.length,
      mandates: (state.mandates || []).length,
    };
  }
  const db = await supabaseServer();
  const [peopleRes, encRes, couplesRes, partRes, mandatesRes] = await Promise.all([
    db.from('people').select('id', { count: 'exact', head: true }),
    db.from('encounters').select('id', { count: 'exact', head: true }),
    db.from('couples').select('id', { count: 'exact', head: true }),
    db.from('participations').select('id', { count: 'exact', head: true }),
    db.from('mandates').select('id', { count: 'exact', head: true }),
  ]);
  return {
    people: peopleRes.count || 0,
    encounters: encRes.count || 0,
    couples: couplesRes.count || 0,
    participations: partRes.count || 0,
    mandates: mandatesRes.count || 0,
  };
}
export const getOverview = cache(async (parishScope?: string | null): Promise<Overview> => {
  if (isDemoMode()) {
    const state = await readDemo();
    const allParishes = [...new Set(state.encounters.map(e => e.parish))].sort();

    if (parishScope) {
      const parishEncounters = state.encounters.filter(e => e.parish === parishScope);
      const parishEncounterIds = new Set(parishEncounters.map(e => e.id));
      const parishParticipations = state.participations.filter(p => parishEncounterIds.has(p.encounter_id));

      const peopleMadeIds = new Set(parishParticipations.filter(p => p.kind === 'Vivenciou').map(p => p.person_id));
      const youthVivenciouIds = new Set(parishParticipations.filter(p => p.kind === 'Vivenciou' && p.condition === 'Jovem').map(p => p.person_id));
      const peopleWorkedIds = new Set(parishParticipations.filter(p => p.kind === 'Trabalhou' && !isMandateRecord(p)).map(p => p.person_id));

      const couplePersonIds = new Set([
        ...parishParticipations.filter(p => p.condition === 'Casal').map(p => p.person_id),
        ...(state.mandates || []).filter(m => m.condition === 'Casal' && parishEncounterIds.has(m.encounter_id || '')).map(m => m.person_id)
      ]);
      const matchedCouples = (state.couples || []).filter(c => couplePersonIds.has(c.person_1_id) || couplePersonIds.has(c.person_2_id));
      const couplesCount = Math.max(matchedCouples.length, Math.ceil(couplePersonIds.size / 2));

      const parishPeopleIds = new Set([
        ...parishParticipations.map(p => p.person_id),
        ...state.people.filter(p => p.parish === parishScope).map(p => p.id)
      ]);

      const byYear = parishEncounters
        .map(e => ({ year: e.year!, total: state.participations.filter(p => p.encounter_id === e.id).length }))
        .sort((a, b) => a.year - b.year);

      const latestEncounters = [...parishEncounters]
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .slice(0, 4);

      const recentReviews = state.reviews
        .filter(r => r.status === 'pending' && (!r.person_id || parishPeopleIds.has(r.person_id)))
        .slice(0, 3)
        .map(r => hydrateReview(r, state));

      return {
        people: parishPeopleIds.size,
        encounters: parishEncounters.length,
        participations: parishParticipations.length,
        pending: recentReviews.length,
        parishes: 1,
        linkedAccounts: 1,
        byYear,
        latestEncounters,
        recentReviews,
        lastImport: state.imports[0] || null,
        isParochial: true,
        parishName: parishScope,
        youthVivenciouCount: youthVivenciouIds.size,
        peopleMadeCount: peopleMadeIds.size,
        peopleWorkedCount: peopleWorkedIds.size,
        couplesCount,
        allParishes,
      };
    }

    // Visão Diocesana Geral (Coordenação Diocesana)
    const youthVivenciouIds = new Set(state.participations.filter(p => p.kind === 'Vivenciou' && p.condition === 'Jovem').map(p => p.person_id));
    const peopleMadeIds = new Set(state.participations.filter(p => p.kind === 'Vivenciou').map(p => p.person_id));
    const peopleWorkedIds = new Set(state.participations.filter(p => p.kind === 'Trabalhou' && !isMandateRecord(p)).map(p => p.person_id));
    const couplePersonIds = new Set(state.participations.filter(p => p.condition === 'Casal').map(p => p.person_id));
    const couplesCount = Math.max((state.couples || []).length, Math.ceil(couplePersonIds.size / 2));

    return {
      people: state.people.filter(p => !p.merged_into).length,
      encounters: state.encounters.length,
      participations: state.participations.length,
      pending: state.reviews.filter(r => r.status === 'pending').length,
      parishes: new Set(state.encounters.map(e => e.parish)).size,
      linkedAccounts: 1,
      byYear: state.encounters.map(e => ({ year: e.year!, total: state.participations.filter(p => p.encounter_id === e.id).length })).sort((a, b) => a.year - b.year),
      latestEncounters: [...state.encounters].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 4),
      recentReviews: state.reviews.filter(r => r.status === 'pending').slice(0, 3).map(r => hydrateReview(r, state)),
      lastImport: state.imports[0] || null,
      isParochial: false,
      parishName: null,
      youthVivenciouCount: youthVivenciouIds.size,
      peopleMadeCount: peopleMadeIds.size,
      peopleWorkedCount: peopleWorkedIds.size,
      couplesCount,
      allParishes,
    };
  }

  const db = await supabaseServer();
  const { data, error } = await db.rpc('get_overview', { p_parish: parishScope || undefined });
  checkDb(error);
  const overview = data as Overview;
  return {
    ...overview,
    latestEncounters: (await getEncounters()).items.slice(0, 4),
    recentReviews: (await getReviews()).slice(0, 3),
    lastImport: (await getImports())[0] || null
  };
});

export const getPublicDiocesanStats = cache(async (): Promise<PublicDiocesanStats> => {
  if (isDemoMode()) {
    const state = await readDemo();
    let firstStage = 0, secondStage = 0, retiroMariano = 0, congressoEucaristico = 0;
    const yearCounts: Record<number, number> = {};

    for (const e of state.encounters) {
      const t = `${e.name || ''} ${e.notes || ''} ${e.edition || ''}`.toLowerCase();
      if (t.includes('congresso') || t.includes('eucaristico') || t.includes('eucarístico')) {
        congressoEucaristico++;
      } else if (t.includes('mariano') || t.includes('retiro mariano')) {
        retiroMariano++;
      } else if (t.includes('2ª etapa') || t.includes('2a etapa') || t.includes('segunda etapa')) {
        secondStage++;
      } else {
        firstStage++;
      }

      if (e.year) {
        yearCounts[e.year] = (yearCounts[e.year] || 0) + 1;
      }
    }

    const youthVivenciouCount = state.participations.filter(p => p.kind === 'Vivenciou' && p.condition === 'Jovem').length;
    const coupleCount = (state.couples || []).length;
    const peopleCount = state.people.filter(p => !p.merged_into).length;

    const bySector = DIOCESAN_SECTORS.map(s => {
      let encountersCount = 0;
      for (const e of state.encounters) {
        if (s.parishes.some(p => matchEncounterToParish({ parish: e.parish, city: e.city }, p))) {
          encountersCount++;
        }
      }
      return {
        id: s.id,
        roman: s.roman,
        name: s.name,
        region: s.region,
        parishCount: s.parishes.length,
        encountersCount,
      };
    });

    const byYear = Object.entries(yearCounts)
      .map(([y, c]) => ({ year: Number(y), encounters: c }))
      .sort((a, b) => a.year - b.year);

    const totalParishes = DIOCESAN_SECTORS.reduce((acc, s) => acc + s.parishes.length, 0);

    return {
      totalYouthVivenciou: youthVivenciouCount,
      totalCouples: coupleCount,
      totalPeople: peopleCount,
      totalParishes,
      totalSectors: DIOCESAN_SECTORS.length,
      totalEncounters: state.encounters.length,
      byStage: {
        firstStage,
        secondStage,
        retiroMariano,
        congressoEucaristico,
      },
      bySector,
      byYear,
    };
  }

  const admin = supabaseAdmin();

  const [encountersRes, youthRes, couplesRes, peopleRes] = await Promise.all([
    admin.from('encounters').select('id, name, notes, edition, year, parish, city'),
    admin.from('participations').select('id', { count: 'exact', head: true }).eq('kind', 'Vivenciou').ilike('condition', '%jovem%'),
    admin.from('couples').select('id', { count: 'exact', head: true }),
    admin.from('people').select('id', { count: 'exact', head: true }).is('merged_into', null),
  ]);

  const encounters = encountersRes.data || [];
  let firstStage = 0, secondStage = 0, retiroMariano = 0, congressoEucaristico = 0;
  const yearCounts: Record<number, number> = {};

  for (const e of encounters) {
    const t = `${e.name || ''} ${e.notes || ''} ${e.edition || ''}`.toLowerCase();
    if (t.includes('congresso') || t.includes('eucaristico') || t.includes('eucarístico')) {
      congressoEucaristico++;
    } else if (t.includes('mariano') || t.includes('retiro mariano')) {
      retiroMariano++;
    } else if (t.includes('2ª etapa') || t.includes('2a etapa') || t.includes('segunda etapa')) {
      secondStage++;
    } else {
      firstStage++;
    }

    if (e.year) {
      yearCounts[e.year] = (yearCounts[e.year] || 0) + 1;
    }
  }

  const bySector = DIOCESAN_SECTORS.map(s => {
    let encountersCount = 0;
    for (const e of encounters) {
      if (s.parishes.some(p => matchEncounterToParish({ parish: e.parish, city: e.city }, p))) {
        encountersCount++;
      }
    }
    return {
      id: s.id,
      roman: s.roman,
      name: s.name,
      region: s.region,
      parishCount: s.parishes.length,
      encountersCount,
    };
  });

  const byYear = Object.entries(yearCounts)
    .map(([y, c]) => ({ year: Number(y), encounters: c }))
    .sort((a, b) => a.year - b.year);

  const totalParishes = DIOCESAN_SECTORS.reduce((acc, s) => acc + s.parishes.length, 0);

  return {
    totalYouthVivenciou: youthRes.count || 0,
    totalCouples: couplesRes.count || 0,
    totalPeople: peopleRes.count || 0,
    totalParishes,
    totalSectors: DIOCESAN_SECTORS.length,
    totalEncounters: encounters.length,
    byStage: {
      firstStage,
      secondStage,
      retiroMariano,
      congressoEucaristico,
    },
    bySector,
    byYear,
  };
});

export async function getMyData(): Promise<MyHistoryData> {
  if (isDemoMode()) {
    const state = await readDemo();
    const person = state.people.find(p => p.id === demoPersonId)!;
    const participations = state.participations
      .filter(p => p.person_id === person.id)
      .map(p => hydrateParticipation(p, state));
    const requests = state.reviews.filter(r => r.person_id === person.id);
    const mandates = (state.mandates || [])
      .filter(m => m.person_id === person.id)
      .map(m => ({ ...m, encounter: state.encounters.find(e => e.id === m.encounter_id) }));
    
    const coupleEntry = (state.couples || []).find(c => c.person_1_id === person.id || c.person_2_id === person.id);
    let couple: CoupleInfo | null = null;
    if (coupleEntry) {
      const spouseId = coupleEntry.person_1_id === person.id ? coupleEntry.person_2_id : coupleEntry.person_1_id;
      const spousePerson = state.people.find(p => p.id === spouseId);
      if (spousePerson) {
        couple = {
          id: coupleEntry.id,
          legacy_id: coupleEntry.legacy_id,
          start_text: coupleEntry.start_text,
          end_text: coupleEntry.end_text,
          notes: coupleEntry.notes,
          spouse: {
            id: spousePerson.id,
            name: spousePerson.name,
            phone: spousePerson.phone,
            email: spousePerson.email,
            birth_date_text: spousePerson.birth_date_text,
            parish: spousePerson.parish,
          }
        };
      }
    }

    return {
      person: hydratePerson(person) as Person,
      participations,
      requests,
      mandates,
      couple
    };
  }

  const db = await supabaseServer();
  const viewer = await getViewer();
  const admin = supabaseAdmin();

  const requestsPromise = viewer?.id
    ? admin.from('review_items').select('id,kind,person_id,title,proposed_changes,status,resolution,created_at,version').eq('requester_id', viewer.id).order('created_at', { ascending: false }).limit(50)
    : db.from('review_items').select('id,kind,person_id,title,proposed_changes,status,resolution,created_at,version').order('created_at', { ascending: false }).limit(50);

  const [profile, history, requests, extras] = await Promise.all([
    db.rpc('get_my_profile'),
    db.rpc('get_my_history'),
    requestsPromise,
    db.rpc('get_my_extras'),
  ]);
  checkDb(profile.error);
  checkDb(history.error);
  checkDb(requests.error);
  const extrasData = extras?.data as { mandates?: Mandate[]; couple?: CoupleInfo | null } | null;

  let personData = profile.data as Person | null;
  if (personData?.id) {
    const { data: pDetails, error: pDetailsErr } = await admin
      .from('people')
      .select('*')
      .eq('id', personData.id)
      .maybeSingle();
    if (pDetails) {
      personData = hydratePerson({ ...personData, ...pDetails });
    } else {
      if (pDetailsErr) {
        console.error('[DATA] Erro ao carregar detalhes da pessoa em getMyData:', pDetailsErr);
      }
      personData = hydratePerson(personData);
    }
  }

  return {
    person: personData,
    participations: (history.data || []) as Participation[],
    requests: (requests.data || []) as ReviewItem[],
    mandates: extrasData?.mandates || [],
    couple: extrasData?.couple || null,
  };
}
export async function getFilterOptions(){
  if(isDemoMode()){const state=await readDemo();return {parishes:[...new Set(state.encounters.map(e=>e.parish))].sort(),years:[...new Set(state.encounters.map(e=>e.year!))].sort((a,b)=>b-a),teams:[...new Set(state.participations.map(p=>p.team).filter(Boolean))] as string[],encounters:state.encounters.map(e=>({id:e.id,name:`${e.name} · ${e.year}`}))};}
  const db=await supabaseServer();const {data,error}=await db.rpc('get_filter_options');checkDb(error);return data;
}
export async function getPersonExtras(id: string) {
  if (isDemoMode()) {
    const state = await readDemo();
    const mandates = (state.mandates || []).filter(m => m.person_id === id);
    const coupleEntry = (state.couples || []).find(c => c.person_1_id === id || c.person_2_id === id);
    let couples: any[] = [];
    if (coupleEntry) {
      const spouseId = coupleEntry.person_1_id === id ? coupleEntry.person_2_id : coupleEntry.person_1_id;
      const spousePerson = state.people.find(p => p.id === spouseId);
      couples = [{
        ...coupleEntry,
        spouse: spousePerson ? {
          id: spousePerson.id,
          legacy_id: spousePerson.legacy_id,
          name: spousePerson.name,
          phone: spousePerson.phone,
          email: spousePerson.email,
          birth_date_text: spousePerson.birth_date_text,
          parish: spousePerson.parish,
          sex: spousePerson.sex,
        } : null
      }];
    }
    const demoTalks = (state.participations || [])
      .filter(p => p.person_id === id && (p.kind === 'Palestrou' || (p.team || '').toLowerCase().includes('palestr') || (p.role || '').toLowerCase().includes('palestr')))
      .map(p => ({
        id: p.id,
        title: p.role || p.team || 'Palestra',
        location: state.encounters.find(e => e.id === p.encounter_id)?.parish,
        encounter: state.encounters.find(e => e.id === p.encounter_id),
        kind: p.kind,
        team: p.team,
        role: p.role,
        notes: p.notes,
      }));
    return { couples, talks: demoTalks, mandates };
  }
  const db = await supabaseServer();
  const [couplesRes, talksRes, mandatesRes, talkPartsRes] = await Promise.all([
    db.from('couples').select('*').or(`person_1_id.eq.${id},person_2_id.eq.${id}`),
    db.from('talk_speakers').select('*,talk:talks(*)').eq('person_id', id),
    db.from('mandates').select('*,encounter:encounters(*)').eq('person_id', id).order('start_year', { ascending: false }),
    db.from('participations')
      .select('*,encounter:encounters(*)')
      .eq('person_id', id)
      .or('kind.eq.Palestrou,team.ilike.%palestr%,role.ilike.%palestr%')
      .order('created_at', { ascending: false }),
  ]);
  for (const r of [couplesRes, talksRes, mandatesRes]) checkDb(r.error);

  const rawCouples = couplesRes.data || [];
  const couples = await Promise.all(rawCouples.map(async (c) => {
    const spouseId = c.person_1_id === id ? c.person_2_id : c.person_1_id;
    let spouse = null;
    if (spouseId) {
      const { data: sp } = await db.from('people')
        .select('id, legacy_id, name, phone, email, birth_date_text, parish, sex')
        .eq('id', spouseId)
        .maybeSingle();
      spouse = sp;
    }
    return { ...c, spouse };
  }));

  const unifiedTalks: any[] = (talksRes.data || []).map((t: any) => ({
    id: t.id,
    title: t.talk?.title || 'Palestra',
    location: t.talk?.location,
    notes: t.talk?.notes,
    encounter: t.talk?.encounter,
    kind: 'Palestrou',
  }));

  for (const p of (talkPartsRes.data || [])) {
    unifiedTalks.push({
      id: p.id,
      title: p.role || p.team || 'Palestra Ministrada',
      location: p.encounter?.parish,
      notes: p.notes,
      encounter: p.encounter,
      kind: p.kind,
      team: p.team,
      role: p.role,
      condition: p.condition,
    });
  }

  // Ordena sempre do mais recente para o mais antigo (2026 -> 2011)
  unifiedTalks.sort((a, b) => {
    const yA = a.encounter?.year || a.year || 0;
    const yB = b.encounter?.year || b.year || 0;
    return yB - yA;
  });

  return { couples, talks: unifiedTalks, mandates: mandatesRes.data || [] };
}

export interface ParishSummaryItem {
  parish: string;
  city?: string;
  encounter_count: number;
  people_count: number;
  youth_vivenciou_count?: number;
  people_worked_count?: number;
}

export async function getSectorsSummary(): Promise<ParishSummaryItem[]> {
  if (isDemoMode()) {
    const state = await readDemo();
    const map = new Map<string, ParishSummaryItem>();
    for (const e of state.encounters) {
      if (!e.parish) continue;
      const existing = map.get(e.parish) || {
        parish: e.parish,
        city: e.city,
        encounter_count: 0,
        people_count: 0,
        youth_vivenciou_count: 0,
        people_worked_count: 0,
      };
      existing.encounter_count += 1;
      map.set(e.parish, existing);
    }
    for (const p of state.participations) {
      const enc = state.encounters.find(e => e.id === p.encounter_id);
      if (enc && enc.parish && map.has(enc.parish)) {
        const item = map.get(enc.parish)!;
        item.people_count += 1;
        if (p.kind === 'Vivenciou' && p.condition === 'Jovem') {
          item.youth_vivenciou_count = (item.youth_vivenciou_count || 0) + 1;
        } else if (p.kind === 'Trabalhou' && !isMandateRecord(p)) {
          item.people_worked_count = (item.people_worked_count || 0) + 1;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.people_count - a.people_count);
  }

  const db = await supabaseServer();
  try {
    const { data, error } = await db.rpc('get_sectors_summary');
    if (!error && Array.isArray(data) && data.length > 0) {
      return data as ParishSummaryItem[];
    }
  } catch {
    // Fallback abaixo
  }

  const { data: encounters } = await db.from('encounters').select('id, parish, city, participations(count)');
  const list = (encounters as unknown as Array<{ id: string; parish: string; city: string; participations?: Array<{ count: number }> }>) || [];
  const map = new Map<string, ParishSummaryItem>();
  for (const e of list) {
    if (!e.parish) continue;
    const key = `${e.parish}___${e.city || ''}`;
    const pCount = (e.participations && e.participations[0]?.count) || 0;
    const existing = map.get(key) || {
      parish: e.parish,
      city: e.city || '',
      encounter_count: 0,
      people_count: 0,
    };
    existing.encounter_count += 1;
    existing.people_count += pCount;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.people_count - a.people_count);
}

export interface SpeakerTalkItem {
  id: string;
  theme: string;
  role: string;
  team: string;
  encounter_id?: string | null;
  encounter_title?: string | null;
  encounter_edition?: string | null;
  encounter_year?: number | null;
  parish?: string | null;
  date_text?: string | null;
  notes?: string | null;
  kind: string;
}

export interface SpeakerCatalogItem {
  person: {
    id: string;
    name: string;
    legacy_id?: string | null;
    phone?: string | null;
    email?: string | null;
    parish?: string | null;
    photo_url?: string | null;
    sex?: string | null;
  };
  condition: 'Jovem' | 'Casal';
  totalTalks: number;
  themes: string[];
  years: number[];
  parishes: string[];
  talks: SpeakerTalkItem[];
}

export async function getSpeakersCatalog(filters: {
  search?: string;
  theme?: string;
  parish?: string;
  condition?: string;
  year?: string;
} = {}): Promise<SpeakerCatalogItem[]> {
  if (isDemoMode()) {
    const state = await readDemo();
    const speakerMap = new Map<string, SpeakerCatalogItem>();
    const talkParts = (state.participations || []).filter(
      p => p.kind === 'Palestrou' || (p.team || '').toLowerCase().includes('palestr') || (p.role || '').toLowerCase().includes('palestr')
    );
    for (const p of talkParts) {
      const person = state.people.find(pe => pe.id === p.person_id && !pe.merged_into);
      if (!person) continue;
      const enc = state.encounters.find(e => e.id === p.encounter_id);
      let item = speakerMap.get(person.id);
      if (!item) {
        const isCasal = p.condition === 'Casal' ||
          (person.name && (person.name.includes(' & ') || person.name.includes(' e '))) ||
          ((p.role || '').toLowerCase().includes('casal'));

        item = {
          person: {
            id: person.id,
            name: person.name,
            legacy_id: person.legacy_id,
            phone: person.phone,
            email: person.email,
            parish: person.parish,
            photo_url: person.photo_url,
            sex: person.sex,
          },
          condition: isCasal ? 'Casal' : 'Jovem',
          totalTalks: 0,
          themes: [],
          years: [],
          parishes: [],
          talks: [],
        };
        speakerMap.set(person.id, item);
      }
      item.totalTalks += 1;
      let themeClean = (p.role || p.team || 'Palestra').trim();
      themeClean = themeClean.replace(/^palestrante\s*[-—–:]\s*/i, '').replace(/^palestra\s*[-—–:]\s*/i, '').trim();
      if (!themeClean) themeClean = 'Palestra Geral';

      if (!item.themes.includes(themeClean)) item.themes.push(themeClean);
      if (enc?.year && !item.years.includes(enc.year)) item.years.push(enc.year);
      const parishName = enc?.parish || person.parish;
      if (parishName && !item.parishes.includes(parishName)) item.parishes.push(parishName);

      item.talks.push({
        id: p.id,
        theme: themeClean,
        role: p.role || '',
        team: p.team || '',
        encounter_id: p.encounter_id,
        encounter_title: enc?.name,
        encounter_edition: enc?.edition,
        encounter_year: enc?.year,
        parish: enc?.parish,
        date_text: enc?.date_text,
        notes: p.notes,
        kind: p.kind,
      });
    }

    for (const item of speakerMap.values()) {
      item.years.sort((a, b) => b - a);
      item.talks.sort((a, b) => (b.encounter_year || 0) - (a.encounter_year || 0));
    }

    let list = Array.from(speakerMap.values());
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(s =>
        s.person.name.toLowerCase().includes(q) ||
        (s.person.legacy_id || '').toLowerCase().includes(q) ||
        (s.person.parish || '').toLowerCase().includes(q) ||
        s.themes.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.theme && filters.theme !== 'all') {
      const tLower = filters.theme.toLowerCase().trim();
      list = list.filter(s => s.themes.some(t => t.toLowerCase().includes(tLower)));
    }
    if (filters.parish && filters.parish !== 'all') {
      const pLower = filters.parish.toLowerCase().trim();
      list = list.filter(s =>
        (s.person.parish || '').toLowerCase().includes(pLower) ||
        s.parishes.some(p => p.toLowerCase().includes(pLower))
      );
    }
    if (filters.condition && filters.condition !== 'all') {
      list = list.filter(s => s.condition === filters.condition);
    }
    if (filters.year && filters.year !== 'all') {
      const yNum = Number(filters.year);
      list = list.filter(s => s.years.includes(yNum));
    }
    return list.sort((a, b) => b.totalTalks - a.totalTalks);
  }

  const db = await supabaseServer();
  const { data: participations, error } = await db
    .from('participations')
    .select('id, kind, role, team, condition, notes, person:people(id, name, legacy_id, phone, email, parish, sex, notes, merged_into), encounter:encounters(id, name, edition, year, parish, city, date_text)')
    .or('kind.eq.Palestrou,team.ilike.%palestr%,role.ilike.%palestr%')
    .order('created_at', { ascending: false })
    .limit(3000);

  if (error) {
    console.error('Erro ao buscar palestrantes:', error);
    return [];
  }

  const speakerMap = new Map<string, SpeakerCatalogItem>();

  for (const row of (participations || [])) {
    const person = row.person as any;
    if (!person || person.merged_into) continue;
    const enc = row.encounter as any;

    let item = speakerMap.get(person.id);
    if (!item) {
      let photoUrl: string | null = null;
      try {
        const parsedNotes = JSON.parse(person.notes || '{}');
        photoUrl = parsedNotes.photo_url || null;
      } catch {}

      const isCasal = row.condition === 'Casal' ||
        (person.name && (person.name.includes(' & ') || person.name.includes(' e '))) ||
        (row.role && row.role.toLowerCase().includes('casal'));

      item = {
        person: {
          id: person.id,
          name: person.name,
          legacy_id: person.legacy_id,
          phone: person.phone,
          email: person.email,
          parish: person.parish,
          photo_url: photoUrl,
          sex: person.sex,
        },
        condition: isCasal ? 'Casal' : 'Jovem',
        totalTalks: 0,
        themes: [],
        years: [],
        parishes: [],
        talks: [],
      };
      speakerMap.set(person.id, item);
    }

    item.totalTalks += 1;
    let themeClean = (row.role || row.team || 'Palestra').trim();
    themeClean = themeClean.replace(/^palestrante\s*[-—–:]\s*/i, '').replace(/^palestra\s*[-—–:]\s*/i, '').trim();
    if (!themeClean) themeClean = 'Palestra Geral';

    if (!item.themes.includes(themeClean)) {
      item.themes.push(themeClean);
    }
    if (enc?.year && !item.years.includes(enc.year)) {
      item.years.push(enc.year);
    }
    const encParish = enc?.parish || person.parish;
    if (encParish && !item.parishes.includes(encParish)) {
      item.parishes.push(encParish);
    }

    item.talks.push({
      id: row.id,
      theme: themeClean,
      role: row.role || '',
      team: row.team || '',
      encounter_id: enc?.id,
      encounter_title: enc?.name,
      encounter_edition: enc?.edition,
      encounter_year: enc?.year,
      parish: enc?.parish,
      date_text: enc?.date_text,
      notes: row.notes,
      kind: row.kind,
    });
  }

  for (const item of speakerMap.values()) {
    item.years.sort((a, b) => b - a);
    item.talks.sort((a, b) => (b.encounter_year || 0) - (a.encounter_year || 0));
  }

  let list = Array.from(speakerMap.values());

  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(s =>
      s.person.name.toLowerCase().includes(q) ||
      (s.person.legacy_id || '').toLowerCase().includes(q) ||
      (s.person.parish || '').toLowerCase().includes(q) ||
      s.themes.some(t => t.toLowerCase().includes(q))
    );
  }

  if (filters.theme && filters.theme !== 'all') {
    const tLower = filters.theme.toLowerCase().trim();
    list = list.filter(s => s.themes.some(t => t.toLowerCase().includes(tLower)));
  }

  if (filters.parish && filters.parish !== 'all') {
    const pLower = filters.parish.toLowerCase().trim();
    list = list.filter(s =>
      (s.person.parish || '').toLowerCase().includes(pLower) ||
      s.parishes.some(p => p.toLowerCase().includes(pLower))
    );
  }

  if (filters.condition && filters.condition !== 'all') {
    list = list.filter(s => s.condition === filters.condition);
  }

  if (filters.year && filters.year !== 'all') {
    const yNum = Number(filters.year);
    list = list.filter(s => s.years.includes(yNum));
  }

  return list.sort((a, b) => b.totalTalks - a.totalTalks);
}

