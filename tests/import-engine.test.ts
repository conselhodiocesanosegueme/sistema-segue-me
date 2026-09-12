import { describe, it, expect } from 'vitest';
import {
  canonicalKind,
  canonicalTeam,
  nameKey,
  planImport,
  type Snapshot,
  type ExistingState,
} from '@/lib/import/engine';
import { initialDemo } from '@/lib/demo';

describe('Import Engine - Canonical transformations', () => {
  it('converts team synonyms into canonical names according to movement rules', () => {
    expect(canonicalTeam('compras')).toBe('Prover');
    expect(canonicalTeam('equipe de compras')).toBe('Prover');
    expect(canonicalTeam('mini mercado')).toBe('Minimercado');
    expect(canonicalTeam('minimercado')).toBe('Minimercado');
    expect(canonicalTeam('Cozinha')).toBe('Cozinha');
  });

  it('normalizes participation kind to canonical Vivenciou', () => {
    expect(canonicalKind('vivenciou')).toBe('Vivenciou');
    expect(canonicalKind('vivenciante')).toBe('Vivenciou');
    expect(canonicalKind('jovem vivenciante')).toBe('Vivenciou');
    expect(canonicalKind('Trabalhou')).toBe('Trabalhou');
  });

  it('normalizes person name search keys with diacritics removal', () => {
    expect(nameKey('João da Silva')).toBe('joao da silva');
    expect(nameKey('Érika Gonçalves')).toBe('erika goncalves');
  });
});

describe('Import Engine - Reconciliation and Planning', () => {
  it('identifies unchanged, new and review items correctly', () => {
    const snapshot: Snapshot = {
      hash: 'snap-test-hash',
      sourceRevision: 'rev-1',
      capturedAt: new Date().toISOString(),
      counts: { Pessoas: 1, Encontros: 1 },
      rows: [
        {
          sheet_name: 'Pessoas',
          row_number: 4,
          fingerprint: 'fp-person-1',
          occurrence: 1,
          entity_type: 'person',
          payload: {
            raw: { headers: ['ID da pessoa', 'Nome completo'], values: ['PES-00001', 'Ana Clara de Almeida'] },
            canonical: { legacy_id: 'PES-00001', name: 'Ana Clara de Almeida' },
            references: {},
            issues: [],
          },
        },
      ],
    };

    const state: ExistingState = {
      people: [
        {
          id: '00000000-0000-4000-8000-000000000100',
          legacy_id: 'PES-00001',
          name: 'Ana Clara de Almeida',
          version: 1,
        },
      ],
      encounters: [],
      evidence: [
        {
          sheet_name: 'Pessoas',
          fingerprint: 'fp-person-1',
          occurrence: 1,
          payload: snapshot.rows[0].payload,
          entity_type: 'person',
        },
      ],
    };

    const plan = planImport(snapshot, state);
    expect(plan.summary.rows).toBe(1);
    expect(plan.summary.unchanged).toBe(1);
    expect(plan.summary.insert).toBe(0);
    expect(plan.summary.review).toBe(0);
  });
});

describe('Demo State Foundation', () => {
  it('initializes demo state with valid people, encounters and reviews', () => {
    const state = initialDemo();
    expect(state.people.length).toBeGreaterThan(10);
    expect(state.encounters.length).toBe(6);
    expect(state.participations.length).toBeGreaterThan(20);
    expect(state.reviews.length).toBe(3);

    // Confirma que nenhuma pessoa inicial está mesclada
    expect(state.people.every((p) => !p.merged_into)).toBe(true);

    // Confirma presença de situações variadas
    expect(state.people.some((p) => p.identification_status === 'Possível duplicidade')).toBe(true);
  });
});
