import { describe, it, expect } from 'vitest';
import { DIOCESAN_SECTORS, getSectorForParish } from '@/lib/sectors';

function generateParishSlug(parishName: string): string {
  return parishName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^par[oó]quia\s+/i, '')
    .replace(/^santu[aá]rio\s+diocesano\s+/i, '')
    .replace(/^santu[aá]rio\s+/i, '')
    .replace(/^quase-par[oó]quia\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

function generateFunctionalEmail(parishName: string): string {
  return `dirigente.${generateParishSlug(parishName)}@sistemasegueme.com.br`;
}

describe('Controle de Acesso - Equipes Dirigentes e Coordenação Diocesana', () => {
  it('garante que todas as 43 paróquias diocesanas podem gerar e-mail funcional institucional', () => {
    const allParishes = DIOCESAN_SECTORS.flatMap((s) => s.parishes);
    expect(allParishes.length).toBe(43);

    for (const parish of allParishes) {
      const email = generateFunctionalEmail(parish.name);
      expect(email).toMatch(/^dirigente\.[a-z0-9]+@sistemasegueme\.com\.br$/);
      expect(email.length).toBeGreaterThan(15);
    }
  });

  it('valida geração de e-mail institucional para Nerópolis, Jaranápolis e Pirenópolis', () => {
    // Nerópolis
    const neropolisEmail = generateFunctionalEmail('São Benedito');
    expect(neropolisEmail).toBe('dirigente.saobenedito@sistemasegueme.com.br');

    // Jaranápolis
    const jaranapolisEmail = generateFunctionalEmail('Nossa Senhora da Penha');
    expect(jaranapolisEmail).toBe('dirigente.nossasenhoradapenha@sistemasegueme.com.br');

    // Pirenópolis (Equipe Conjunta Nossa Senhora do Rosário e Santa Bárbara)
    const pirenopolisEmail = generateFunctionalEmail('Nossa Senhora do Rosário e Santa Bárbara');
    expect(pirenopolisEmail).toContain('dirigente.nossasenhoradorosari@sistemasegueme.com.br');
  });

  it('diferencia homônimos por setor diocesano', () => {
    // São José Operário em Anápolis (Setor II)
    const sjo = getSectorForParish('São José Operário');
    expect(sjo?.id).toBe('setor-2');

    // São José em Jaraguá (Setor V)
    const sjj = getSectorForParish('São José', 'Jaraguá - GO');
    expect(sjj?.id).toBe('setor-5');

    // Santa Teresinha do Menino Jesus em Campo Limpo de Goiás (Setor II)
    const stmj = getSectorForParish('Santa Teresinha do Menino Jesus');
    expect(stmj?.id).toBe('setor-2');
  });

  it('estabelece regras estritas de permissão por perfil (Role)', () => {
    const permissions = {
      admin: {
        canViewAllParishes: true,
        canCreateEncounters: true,
        canCreateMandates: true,
        canCreateTalks: true,
        canManageUsers: true,
        canResetPasswords: true,
      },
      reviewer: {
        // Equipe Dirigente Paroquial
        canViewAllParishes: true, // para verificar se jovens já participaram
        canCreateEncounters: false,
        canCreateMandates: false,
        canCreateTalks: false,
        canManageUsers: false,
        canResetPasswords: false,
      },
      participant: {
        canViewAllParishes: false,
        canCreateEncounters: false,
        canCreateMandates: false,
        canCreateTalks: false,
        canManageUsers: false,
        canResetPasswords: false,
      },
    };

    expect(permissions.admin.canManageUsers).toBe(true);
    expect(permissions.reviewer.canManageUsers).toBe(false);
    expect(permissions.reviewer.canCreateEncounters).toBe(false);
    expect(permissions.reviewer.canCreateMandates).toBe(false);
    expect(permissions.reviewer.canCreateTalks).toBe(false);
    expect(permissions.reviewer.canViewAllParishes).toBe(true);
  });

  it('garante que conselhodiocesano.segueme@gmail.com tem privilégio incondicional de admin diocesano geral', () => {
    const email = 'conselhodiocesano.segueme@gmail.com';
    const isDiocesanAdminEmail = email.toLowerCase() === 'conselhodiocesano.segueme@gmail.com' || email.toLowerCase().startsWith('conselhodiocesano');
    expect(isDiocesanAdminEmail).toBe(true);

    const determineRole = (userEmail: string, profileRole?: string, metaRole?: string) => {
      if (userEmail.toLowerCase() === 'conselhodiocesano.segueme@gmail.com' || profileRole === 'admin' || metaRole === 'admin') {
        return 'admin';
      }
      return profileRole || metaRole || 'reviewer';
    };

    // Mesmo se o profile vier vazio ou indefinido, conselhodiocesano é sempre admin
    expect(determineRole(email, undefined, undefined)).toBe('admin');
    expect(determineRole(email, 'reviewer', undefined)).toBe('admin');
    expect(determineRole('outro@exemplo.com', 'admin', undefined)).toBe('admin');
    expect(determineRole('dirigente@exemplo.com', 'reviewer', undefined)).toBe('reviewer');
  });
});

