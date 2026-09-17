import { describe, it, expect } from 'vitest';
import { DIOCESAN_SECTORS, getSectorForParish, matchEncounterToParish } from '@/lib/sectors';

describe('Diocesan Sectors Structure (Edital 2026)', () => {
  it('defines exactly the 6 official sectors of Diocese de Anápolis', () => {
    expect(DIOCESAN_SECTORS).toHaveLength(6);
    const names = DIOCESAN_SECTORS.map((s) => s.name);
    expect(names).toEqual(['Setor I', 'Setor II', 'Setor III', 'Setor IV', 'Setor V', 'Setor VI']);
  });

  it('contains all official parishes mapped across the 6 sectors', () => {
    const totalParishes = DIOCESAN_SECTORS.reduce((acc, s) => acc + s.parishes.length, 0);
    // 43 entidades paroquiais (Pirenópolis unifica Rosário e Santa Bárbara em equipe conjunta, assim como Nerópolis e Jaranápolis)
    expect(totalParishes).toBe(43);

    // Setor I: 8 paróquias
    expect(DIOCESAN_SECTORS[0].parishes).toHaveLength(8);
    // Setor II: 7 paróquias
    expect(DIOCESAN_SECTORS[1].parishes).toHaveLength(7);
    // Setor III: 9 paróquias
    expect(DIOCESAN_SECTORS[2].parishes).toHaveLength(9);
    // Setor IV: 6 paróquias
    expect(DIOCESAN_SECTORS[3].parishes).toHaveLength(6);
    // Setor V: 7 paróquias
    expect(DIOCESAN_SECTORS[4].parishes).toHaveLength(7);
    // Setor VI: 6 paróquias (Pirenópolis unificada: Nossa Senhora do Rosário e Santa Bárbara)
    expect(DIOCESAN_SECTORS[5].parishes).toHaveLength(6);
  });

  it('correctly identifies sectors for parishes', () => {
    // Setor I
    const s1 = getSectorForParish('Paróquia Santa Clara');
    expect(s1?.name).toBe('Setor I');

    // Setor II
    const s2 = getSectorForParish('Paróquia São José Operário', 'Anápolis - GO');
    expect(s2?.name).toBe('Setor II');

    // Setor III
    const s3 = getSectorForParish('Catedral do Bom Jesus');
    expect(s3?.name).toBe('Setor III');

    // Setor IV
    const s4 = getSectorForParish('Paróquia Nossa Senhora do Carmo', 'Nova Veneza - GO');
    expect(s4?.name).toBe('Setor IV');

    // Setor V
    const s5 = getSectorForParish('Paróquia São Francisco de Assis', 'São Francisco de Goiás - GO');
    expect(s5?.name).toBe('Setor V');

    // Setor VI
    const s6 = getSectorForParish('Paróquia Imaculado Coração de Maria', 'Alexânia - GO');
    expect(s6?.name).toBe('Setor VI');
  });

  it('strictly distinguishes homonymous and overlapping parish names across different cities', () => {
    const setor2 = DIOCESAN_SECTORS[1];
    const setor3 = DIOCESAN_SECTORS[2];
    const setor4 = DIOCESAN_SECTORS[3];
    const setor5 = DIOCESAN_SECTORS[4];
    const setor6 = DIOCESAN_SECTORS[5];

    const saoJoseOperario = setor2.parishes.find((p) => p.name === 'São José Operário')!;
    const saoJoseJaragua = setor5.parishes.find((p) => p.name === 'São José')!;

    // 1. Encontros de Jaraguá da Paróquia São José NUNCA podem ser vinculados a São José Operário de Anápolis
    const encJaraguaJose1 = { parish: 'Paróquia São José', city: 'Jaraguá/GO' };
    const encJaraguaJose2 = { parish: 'São José', city: 'Jaraguá/GO' };
    expect(matchEncounterToParish(encJaraguaJose1, saoJoseOperario)).toBe(false);
    expect(matchEncounterToParish(encJaraguaJose2, saoJoseOperario)).toBe(false);
    expect(matchEncounterToParish(encJaraguaJose1, saoJoseJaragua)).toBe(true);
    expect(matchEncounterToParish(encJaraguaJose2, saoJoseJaragua)).toBe(true);

    // 2. Encontros de Anápolis da Paróquia São José Operário NUNCA podem ir para São José de Jaraguá
    const encAnapolisOperario = { parish: 'Paróquia São José Operário', city: 'Anápolis/GO' };
    expect(matchEncounterToParish(encAnapolisOperario, saoJoseOperario)).toBe(true);
    expect(matchEncounterToParish(encAnapolisOperario, saoJoseJaragua)).toBe(false);

    // 3. São Francisco de Assis (Anápolis) vs São Francisco de Assis (São Francisco de Goiás)
    const chicoAnapolis = setor3.parishes.find((p) => p.name === 'São Francisco de Assis')!;
    const chicoGoias = setor5.parishes.find((p) => p.name === 'São Francisco de Assis')!;

    const encChicoAnapolis = { parish: 'Paróquia São Francisco de Assis', city: 'Anápolis/GO' };
    const encChicoGoias = { parish: 'Paróquia São Francisco de Assis', city: 'São Francisco de Goiás/GO' };

    expect(matchEncounterToParish(encChicoAnapolis, chicoAnapolis)).toBe(true);
    expect(matchEncounterToParish(encChicoAnapolis, chicoGoias)).toBe(false);
    expect(matchEncounterToParish(encChicoGoias, chicoGoias)).toBe(true);
    expect(matchEncounterToParish(encChicoGoias, chicoAnapolis)).toBe(false);

    // 4. Nossa Senhora do Carmo (Anápolis) vs Nossa Senhora do Carmo (Nova Veneza)
    const carmoAnapolis = setor3.parishes.find((p) => p.name === 'Nossa Senhora do Carmo')!;
    const carmoVeneza = setor4.parishes.find((p) => p.name === 'Nossa Senhora do Carmo')!;

    const encCarmoVeneza = { parish: 'Paróquia Nossa Senhora do Carmo', city: 'Nova Veneza/GO' };
    expect(matchEncounterToParish(encCarmoVeneza, carmoVeneza)).toBe(true);
    expect(matchEncounterToParish(encCarmoVeneza, carmoAnapolis)).toBe(false);

    // 5. São Pedro e São Paulo (Anápolis) vs São Pedro e São Paulo (Abadiânia)
    const pedroAnapolis = setor2.parishes.find((p) => p.name === 'São Pedro e São Paulo')!;
    const pedroAbadiania = setor6.parishes.find((p) => p.name === 'São Pedro e São Paulo')!;

    const encPedroAbadiania = { parish: 'Paróquia São Pedro e São Paulo', city: 'Abadiânia/GO' };
    expect(matchEncounterToParish(encPedroAbadiania, pedroAbadiania)).toBe(true);
    expect(matchEncounterToParish(encPedroAbadiania, pedroAnapolis)).toBe(false);

    // 6. Resolução direta por string com cidade (nomes institucionais de dirigentes)
    expect(getSectorForParish('Paróquia Nossa Senhora do Carmo (Nova Veneza)')?.name).toBe('Setor IV');
    expect(getSectorForParish('Paróquia Nossa Senhora do Carmo (Anápolis)')?.name).toBe('Setor III');
    expect(getSectorForParish('Paróquia São Sebastião (Interlândia)')?.name).toBe('Setor I');
    expect(getSectorForParish('Paróquia São Sebastião (Ouro Verde)')?.name).toBe('Setor IV');
    expect(getSectorForParish("Paróquia Nossa Senhora D'Abadia (Souzânia)")?.name).toBe('Setor I');
    expect(getSectorForParish("Paróquia Nossa Senhora D'Abadia (Santa Rosa)")?.name).toBe('Setor IV');
    expect(getSectorForParish("Paróquia Nossa Senhora D'Abadia (Anápolis)")?.name).toBe('Setor III');
    expect(getSectorForParish('Paróquia São Francisco de Assis (São Francisco de Goiás)')?.name).toBe('Setor V');
    expect(getSectorForParish('Paróquia São Francisco de Assis (Anápolis)')?.name).toBe('Setor III');
    expect(getSectorForParish('Paróquia São Pedro e São Paulo (Abadiânia)')?.name).toBe('Setor VI');
    expect(getSectorForParish('Paróquia São Pedro e São Paulo (Anápolis)')?.name).toBe('Setor II');
    expect(getSectorForParish('Paróquia Santo Antônio (Damolândia)')?.name).toBe('Setor IV');
    expect(getSectorForParish('Paróquia Santo Antônio (Cocalzinho)')?.name).toBe('Setor VI');
    expect(getSectorForParish('Paróquia Santo Antônio (Vila Propício)')?.name).toBe('Setor V');
  });

  it('correctly maps cities to parishes across sectors', () => {
    // Busca por cidade Jaraguá
    const jaraguaParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes).filter((p) =>
      p.city.toLowerCase().includes('jaraguá')
    );
    expect(jaraguaParishes.length).toBeGreaterThan(0);
    expect(jaraguaParishes.some((p) => p.name.includes('Nossa Senhora da Penha'))).toBe(true);

    // Busca por cidade Pirenópolis
    const pirenopolisParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes).filter((p) =>
      p.city.toLowerCase().includes('pirenópolis')
    );
    expect(pirenopolisParishes.length).toBe(1);
    expect(pirenopolisParishes[0].name).toBe('Nossa Senhora do Rosário e Santa Bárbara');

    // Validação de encontro conjunto de Pirenópolis
    const encPirenopolis = {
      parish: 'Paróquia Nossa Senhora do Rosário e Paróquia Santa Bárbara',
      city: 'Pirenópolis/GO',
    };
    expect(matchEncounterToParish(encPirenopolis, pirenopolisParishes[0])).toBe(true);

    const sPirenopolis = getSectorForParish('Nossa Senhora do Rosário e Santa Bárbara', 'Pirenópolis - GO');
    expect(sPirenopolis?.name).toBe('Setor VI');

    // Busca por cidade Nerópolis
    const neropolisParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes).filter((p) =>
      p.city.toLowerCase().includes('nerópolis')
    );
    expect(neropolisParishes.length).toBeGreaterThan(0);

    // Busca por cidade Campo Limpo de Goiás
    const campoLimpoParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes).filter((p) =>
      p.city.toLowerCase().includes('campo limpo')
    );
    expect(campoLimpoParishes.length).toBe(1);
    expect(campoLimpoParishes[0].name).toBe('Santa Teresinha do Menino Jesus');
    expect(campoLimpoParishes[0].city).toBe('Campo Limpo de Goiás - GO');

    // Validação de setor para Santa Teresinha / Campo Limpo
    const sSantaTeresinha = getSectorForParish('Paróquia Santa Teresinha do Menino Jesus', 'Campo Limpo de Goiás - GO');
    expect(sSantaTeresinha?.name).toBe('Setor II');
  });
});
