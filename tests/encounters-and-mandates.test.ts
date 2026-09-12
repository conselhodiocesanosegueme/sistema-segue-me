import { describe, it, expect } from 'vitest';
import {
  ENCOUNTER_TYPES,
  MANDATE_BODIES,
  checkPrerequisite,
  EncounterType,
} from '@/lib/encounter-config';

describe('Encounter Types and Hierarchy Rules', () => {
  it('defines all 4 official encounter types with correct levels', () => {
    const types = Object.keys(ENCOUNTER_TYPES);
    expect(types).toEqual([
      '1ª Etapa',
      '2ª Etapa',
      'Retiro Mariano',
      'Congresso Eucarístico',
    ]);

    expect(ENCOUNTER_TYPES['1ª Etapa'].level).toBe('Paroquial');
    expect(ENCOUNTER_TYPES['2ª Etapa'].level).toBe('Diocesano');
    expect(ENCOUNTER_TYPES['Retiro Mariano'].level).toBe('Diocesano');
    expect(ENCOUNTER_TYPES['Congresso Eucarístico'].level).toBe('Diocesano');
  });

  it('verifies 1ª Etapa has no prerequisite', () => {
    const result = checkPrerequisite('1ª Etapa', []);
    expect(result.eligible).toBe(true);
    expect(result.message).toContain('Apto');
  });

  it('verifies 2ª Etapa requires having vivenciado 1ª Etapa', () => {
    // Sem 1ª Etapa
    const uneligible = checkPrerequisite('2ª Etapa', []);
    expect(uneligible.eligible).toBe(false);
    expect(uneligible.message).toContain('1ª Etapa');

    // Trabalhou na 1ª Etapa mas não vivenciou
    const onlyWorked = checkPrerequisite('2ª Etapa', [
      { type: '1ª Etapa', kind: 'Trabalhou' },
    ]);
    expect(onlyWorked.eligible).toBe(false);

    // Vivenciou 1ª Etapa
    const eligible = checkPrerequisite('2ª Etapa', [
      { type: '1ª Etapa', kind: 'Vivenciou' },
    ]);
    expect(eligible.eligible).toBe(true);
    expect(eligible.message).toContain('Vivência confirmada');
  });

  it('verifies Retiro Mariano requires having vivenciado 2ª Etapa', () => {
    // Sem 2ª Etapa
    const uneligible = checkPrerequisite('Retiro Mariano', [
      { type: '1ª Etapa', kind: 'Vivenciou' },
    ]);
    expect(uneligible.eligible).toBe(false);
    expect(uneligible.message).toContain('2ª Etapa');

    // Com 2ª Etapa vivenciada
    const eligible = checkPrerequisite('Retiro Mariano', [
      { type: '1ª Etapa', kind: 'Vivenciou' },
      { type: '2ª Etapa', kind: 'Vivenciou' },
    ]);
    expect(eligible.eligible).toBe(true);
  });

  it('verifies Congresso Eucarístico requires having vivenciado 1ª Etapa', () => {
    // Sem experiência
    const uneligible = checkPrerequisite('Congresso Eucarístico', []);
    expect(uneligible.eligible).toBe(false);

    // Com 1ª Etapa vivenciada
    const eligible = checkPrerequisite('Congresso Eucarístico', [
      { type: '1ª Etapa', kind: 'Vivenciou' },
    ]);
    expect(eligible.eligible).toBe(true);
  });

  it('configures specialized teams for Congresso Eucarístico and Retiro Mariano', () => {
    const congressoTeams = ENCOUNTER_TYPES['Congresso Eucarístico'].defaultTeams;
    expect(congressoTeams).toContain('Adoração e Capela Eucarística');
    expect(congressoTeams).toContain('Estrutura, Palco e Som');
    expect(congressoTeams).toContain('Saúde e Primeiros Socorros');
    expect(congressoTeams).toContain('Cozinha');
    expect(congressoTeams.length).toBeGreaterThanOrEqual(17);

    const marianoTeams = ENCOUNTER_TYPES['Retiro Mariano'].defaultTeams;
    expect(marianoTeams).toContain('Liturgia Mariana');
    expect(marianoTeams).toContain('Espiritualidade e Adoração');
    expect(marianoTeams.length).toBeGreaterThanOrEqual(17);
  });
});

describe('Mandate Bodies and Roles Catalog', () => {
  it('defines the 4 official mandate governing bodies', () => {
    const bodies = Object.keys(MANDATE_BODIES);
    expect(bodies).toEqual([
      'Conselho Diocesano',
      'Coordenação Setorial',
      'Equipe Dirigente - 1ª Etapa',
      'Equipe Dirigente - 2ª Etapa',
    ]);
  });

  it('defines proper young and couple roles for Conselho Diocesano', () => {
    const conselho = MANDATE_BODIES['Conselho Diocesano'];
    expect(conselho.level).toBe('Diocesano');
    expect(conselho.roles.jovem).toContain('Jovem Coordenador Diocesano');
    expect(conselho.roles.casal).toContain('Casal Coordenador Diocesano');
    expect(conselho.roles.casal).toContain('Diretor Espiritual / Assessor Eclesiástico');
  });

  it('defines proper roles for Coordenação Setorial', () => {
    const setorial = MANDATE_BODIES['Coordenação Setorial'];
    expect(setorial.level).toBe('Setorial');
    expect(setorial.roles.jovem).toContain('Jovem Coordenador Setorial');
    expect(setorial.roles.casal).toContain('Casal Coordenador Setorial');
  });

  it('defines proper roles for Equipes Dirigentes (1ª e 2ª Etapa)', () => {
    const ed1 = MANDATE_BODIES['Equipe Dirigente - 1ª Etapa'];
    expect(ed1.level).toBe('Paroquial');
    expect(ed1.roles.casal).toContain('Casal Montagem (Encontro)');
    expect(ed1.roles.casal).toContain('Casal Pós-Encontro');

    const ed2 = MANDATE_BODIES['Equipe Dirigente - 2ª Etapa'];
    expect(ed2.level).toBe('Diocesano');
    expect(ed2.roles.casal).toContain('Casal Montagem da 2ª Etapa');
  });
});
