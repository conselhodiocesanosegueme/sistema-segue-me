import { describe, it, expect } from 'vitest';
import { DIOCESAN_SECTORS, getSectorForParish } from '@/lib/sectors';

describe('Diocesan Sectors Structure (Edital 2026)', () => {
  it('defines exactly the 6 official sectors of Diocese de Anápolis', () => {
    expect(DIOCESAN_SECTORS).toHaveLength(6);
    const names = DIOCESAN_SECTORS.map((s) => s.name);
    expect(names).toEqual(['Setor I', 'Setor II', 'Setor III', 'Setor IV', 'Setor V', 'Setor VI']);
  });

  it('contains all 44 parishes mapped across the 6 sectors', () => {
    const totalParishes = DIOCESAN_SECTORS.reduce((acc, s) => acc + s.parishes.length, 0);
    expect(totalParishes).toBe(44);

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
    // Setor VI: 7 paróquias
    expect(DIOCESAN_SECTORS[5].parishes).toHaveLength(7);
  });

  it('correctly identifies sectors for parishes', () => {
    // Setor I
    const s1 = getSectorForParish('Paróquia Santa Clara');
    expect(s1?.name).toBe('Setor I');

    // Setor II
    const s2 = getSectorForParish('Paróquia São José Operário');
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
});
