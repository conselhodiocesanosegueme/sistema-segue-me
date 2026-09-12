import type { EncounterType, EncounterLevel, MandateBody } from './encounter-config';
export type { EncounterType, EncounterLevel, MandateBody };

export type Role = 'participant' | 'reviewer' | 'admin';
export type Person = { id: string; legacy_id: string | null; name: string; phone: string | null; email: string | null; birth_date_text: string | null; sex: string | null; identification_status: string; notes?: string | null; version: number; merged_into?: string | null; participation_count?: number; parish?: string | null };
export type Encounter = {
  id: string;
  legacy_id: string;
  edition: string;
  year: number | null;
  parish: string;
  city: string;
  name: string;
  date_text: string;
  source_name?: string;
  extraction_status: string;
  notes?: string | null;
  theme?: string | null;
  participation_count?: number;
  type?: EncounterType;
  level?: EncounterLevel;
  teams?: string[];
};
export type Participation = { id: string; person_id: string; encounter_id: string; kind: string; condition: string; team: string | null; circle: string | null; role: string | null; patron: string | null; source_page?: string | null; notes?: string | null; encounter?: Encounter; person?: Person };
export type ReviewItem = { id: string; kind: 'correction' | 'duplicate' | 'identity' | 'import_conflict'; person_id: string | null; related_person_id?: string | null; title: string; proposed_changes: Record<string, unknown>; evidence: Record<string, unknown>; status: 'pending' | 'approved' | 'rejected'; resolution?: string; created_at: string; version: number; person?: Person; related_person?: Person };
export type ImportJob = { id: string; status: string; source_id: string; source_revision?: string; created_at: string; completed_at?: string; summary: Record<string, number | string>; progress: Record<string, number | string>; error?: string | null };
export type Overview = {
  people: number;
  encounters: number;
  participations: number;
  pending: number;
  parishes: number;
  linkedAccounts: number;
  byYear: { year: number; total: number }[];
  latestEncounters: Encounter[];
  recentReviews: ReviewItem[];
  lastImport: ImportJob | null;
  isParochial?: boolean;
  parishName?: string | null;
  youthVivenciouCount?: number;
  peopleMadeCount?: number;
  peopleWorkedCount?: number;
  couplesCount?: number;
  allParishes?: string[];
};
export type Viewer = { id: string; name: string; email: string; role: Role; demo: boolean; parish?: string | null };
export type PageResult<T> = { items: T[]; total: number; page: number; pageSize: number };

export type Mandate = {
  id: string;
  person_id: string;
  encounter_id?: string | null;
  body: string;
  role: string;
  condition: string; // 'Jovem' | 'Casal'
  start_year: number | null;
  end_year: number | null;
  record_type?: string | null;
  notes?: string | null;
  encounter?: Encounter;
  person?: Person;
  parish?: string | null;
  sector_id?: string | null;
  spouse?: SpouseInfo | null;
  status?: 'Ativo' | 'Concluído';
};

export type SpouseInfo = {
  id: string;
  name: string;
  legacy_id?: string | null;
  phone?: string | null;
  email?: string | null;
  birth_date_text?: string | null;
  parish?: string | null;
  sex?: string | null;
};

export type CoupleInfo = {
  id: string;
  legacy_id?: string | null;
  spouse: SpouseInfo;
  start_text?: string | null;
  end_text?: string | null;
  notes?: string | null;
};

export type MyHistoryData = {
  person: Person | null;
  participations: Participation[];
  requests: ReviewItem[];
  mandates: Mandate[];
  couple: CoupleInfo | null;
};
