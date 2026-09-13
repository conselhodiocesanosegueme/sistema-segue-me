import type { Sector } from './sectors';

export type EncounterType =
  | '1ª Etapa'
  | '2ª Etapa'
  | 'Retiro Mariano'
  | 'Congresso Eucarístico';

export type EncounterLevel = 'Paroquial' | 'Diocesano';

export interface EncounterTypeInfo {
  type: EncounterType;
  level: EncounterLevel;
  badgeColor: string;
  badgeBg: string;
  description: string;
  prerequisiteRule: string;
  prerequisiteRequiredType?: EncounterType;
  defaultTeams: string[];
}

export const STANDARD_SEGUE_ME_TEAMS = [
  'Animação',
  'Apoio',
  'Canto',
  'Círculo',
  'Cozinha',
  'Equipe Dirigente',
  'Espiritualização',
  'Faxina',
  'Gráfica',
  'Intercessão Paroquial',
  'Lanche',
  'Liturgia e Vigília',
  'Minimercado',
  'Prover',
  'Sala',
  'Secretaria',
  'Visitação',
];

export const ENCOUNTER_TYPES: Record<EncounterType, EncounterTypeInfo> = {
  '1ª Etapa': {
    type: '1ª Etapa',
    level: 'Paroquial',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    description: 'Encontro paroquial tradicional do Segue-me. Porta de entrada de jovens e casais no movimento.',
    prerequisiteRule: 'Nenhum pré-requisito (encontro inicial do movimento).',
    defaultTeams: [...STANDARD_SEGUE_ME_TEAMS],
  },
  '2ª Etapa': {
    type: '2ª Etapa',
    level: 'Diocesano',
    badgeColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    description: 'Encontro diocesano reunindo jovens encontristas e voluntários de todos os setores da Diocese de Anápolis.',
    prerequisiteRule: 'Necessário ter vivenciado a 1ª Etapa do Segue-me.',
    prerequisiteRequiredType: '1ª Etapa',
    defaultTeams: [...STANDARD_SEGUE_ME_TEAMS],
  },
  'Retiro Mariano': {
    type: 'Retiro Mariano',
    level: 'Diocesano',
    badgeColor: '#047857',
    badgeBg: '#d1fae5',
    description: 'Retiro diocesano de aprofundamento espiritual sob a proteção de Nossa Senhora, abrangendo toda a diocese.',
    prerequisiteRule: 'Necessário ter vivenciado a 2ª Etapa do Segue-me.',
    prerequisiteRequiredType: '2ª Etapa',
    defaultTeams: [
      ...STANDARD_SEGUE_ME_TEAMS,
      'Liturgia Mariana',
      'Espiritualidade e Adoração',
    ],
  },
  'Congresso Eucarístico': {
    type: 'Congresso Eucarístico',
    level: 'Diocesano',
    badgeColor: '#7c3aed',
    badgeBg: '#ede9fe',
    description: 'Grande congresso diocesano em torno da Santíssima Eucaristia. Mantém a base do Segue-me com equipes especiais adicionais.',
    prerequisiteRule: 'Necessário ter vivenciado a 1ª Etapa do Segue-me.',
    prerequisiteRequiredType: '1ª Etapa',
    defaultTeams: [
      ...STANDARD_SEGUE_ME_TEAMS,
      'Adoração e Capela Eucarística',
      'Comunicação e Mídia',
      'Estrutura, Palco e Som',
      'Lojinha e Artigos Religiosos',
      'Saúde e Primeiros Socorros',
      'Segurança e Trânsito',
    ],
  },
};

/**
 * Catálogo de Órgãos de Mandato e suas Pastas Oficiais
 */
export type MandateBody =
  | 'Conselho Diocesano'
  | 'Coordenação Setorial'
  | 'Equipe Dirigente - 1ª Etapa'
  | 'Equipe Dirigente - 2ª Etapa';

export interface MandateBodyInfo {
  body: MandateBody;
  level: 'Diocesano' | 'Setorial' | 'Paroquial';
  description: string;
  roles: {
    jovem: string[];
    casal: string[];
  };
}

export const MANDATE_BODIES: Record<MandateBody, MandateBodyInfo> = {
  'Conselho Diocesano': {
    body: 'Conselho Diocesano',
    level: 'Diocesano',
    description: 'Coordenação Diocesana do Movimento Segue-me na Diocese de Anápolis (1 Casal Coordenador, 2 Jovens Coordenadores, 2 Casais Tesoureiros/Auxiliares e 2 Jovens Secretários/Auxiliares).',
    roles: {
      jovem: [
        'Jovem Coordenador Diocesano',
        'Jovem Secretário (Auxiliar Diocesano)',
        'Jovem Comunicação Diocesana',
        'Jovem Formação Diocesana',
      ],
      casal: [
        'Casal Coordenador Diocesano',
        'Casal Tesoureiro (Auxiliar Diocesano)',
        'Diretor Espiritual / Assessor Eclesiástico',
        'Diretor Espiritual / Assessor Eclesiástico Diocesano',
        'Casal Formação e Espiritualidade',
      ],
    },
  },
  'Coordenação Setorial': {
    body: 'Coordenação Setorial',
    level: 'Setorial',
    description: 'Coordenação dos 6 Setores da Diocese. Cada setor é composto por 1 Casal Setorial e 2 Jovens Setoriais que tomam conta do setor e mantêm contato direto com as Equipes Dirigentes.',
    roles: {
      jovem: [
        'Jovem Setorial',
        'Jovem Coordenador Setorial',
        'Jovem Articulador Setorial',
      ],
      casal: [
        'Casal Setorial',
        'Casal Coordenador Setorial',
        'Assessor Eclesiástico Setorial',
      ],
    },
  },
  'Equipe Dirigente - 1ª Etapa': {
    body: 'Equipe Dirigente - 1ª Etapa',
    level: 'Paroquial',
    description: 'Liderança paroquial responsável pelo Segue-me de 1ª Etapa na paróquia, articulada com a Coordenação do seu respectivo Setor.',
    roles: {
      jovem: [
        'Jovem Coordenador',
        'Jovem Vice-Coordenador',
        'Jovem Secretário',
      ],
      casal: [
        'Casal Fichas',
        'Casal Finanças',
        'Casal Montagem',
        'Casal Montagem (Encontro)',
        'Casal Palestra',
        'Casal Pós-Encontro',
        'Diretor Espiritual Paroquial',
      ],
    },
  },
  'Equipe Dirigente - 2ª Etapa': {
    body: 'Equipe Dirigente - 2ª Etapa',
    level: 'Diocesano',
    description: 'Liderança responsável pela organização e realização da 2ª Etapa Diocesana do Segue-me.',
    roles: {
      jovem: [
        'Jovem Coordenador da 2ª Etapa',
        'Jovem Vice-Coordenador da 2ª Etapa',
        'Jovem Secretário da 2ª Etapa',
      ],
      casal: [
        'Casal Coordenador da 2ª Etapa',
        'Casal Fichas da 2ª Etapa',
        'Casal Finanças da 2ª Etapa',
        'Casal Montagem da 2ª Etapa',
        'Casal Palestra da 2ª Etapa',
        'Casal Pós-Encontro da 2ª Etapa',
        'Diretor Espiritual da 2ª Etapa',
      ],
    },
  },
};

/**
 * Verifica se uma pessoa cumpre o pré-requisito para determinado tipo de encontro
 */
export function checkPrerequisite(
  targetType: EncounterType,
  userExperiences: { type: EncounterType; kind: string }[]
): { eligible: boolean; message: string } {
  const info = ENCOUNTER_TYPES[targetType];
  if (!info.prerequisiteRequiredType) {
    return { eligible: true, message: 'Apto a vivenciar e trabalhar.' };
  }

  const required = info.prerequisiteRequiredType;
  const hasVivenciouRequired = userExperiences.some(
    (exp) => exp.type === required && exp.kind === 'Vivenciou'
  );

  if (hasVivenciouRequired) {
    return {
      eligible: true,
      message: `Apto! Vivência confirmada em ${required}.`,
    };
  }

  return {
    eligible: false,
    message: `Pré-requisito pendente: É necessário ter vivenciado a ${required} do Segue-me para participar de ${targetType}.`,
  };
}

/**
 * Verifica se um registro de participação representa um Mandato Institucional
 * (Equipe Dirigente ou Conselho Diocesano) em vez de trabalho operacional no encontro.
 */
export function isMandateRecord(p: { team?: string | null; role?: string | null }): boolean {
  const team = (p.team || '').toLowerCase();
  const role = (p.role || '').toLowerCase();
  return (
    team.includes('dirigente') ||
    team.includes('conselho') ||
    role.includes('conselho') ||
    role.includes('dirigente') ||
    role.includes('pasta montagem') ||
    role.includes('pasta ficha') ||
    role.includes('pasta finança') ||
    role.includes('pasta palestra') ||
    role.includes('pasta pós-encontro') ||
    role.includes('diretor espiritual') ||
    role.includes('setorial') ||
    team.includes('setorial')
  );
}

export interface NormalizedMandateMeta {
  normalizedBody: MandateBody;
  category: 'diocesano' | 'setorial' | 'equipe_dirigente';
  sectorId?: string;
  sectorName?: string;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

/**
 * Normaliza e classifica um mandato legítimo em seus três ramos oficiais:
 * 1. Coordenação Diocesana (Conselho Diocesano)
 * 2. Coordenações Setoriais (Setores 1 a 6)
 * 3. Equipes Dirigentes (1ª Etapa e 2ª Etapa)
 * Retorna null se for equipe de serviço operacional de encontro (Faxina, Gráfica, etc.)
 */
export function normalizeMandateBody(bodyRaw?: string | null, roleRaw?: string | null): NormalizedMandateMeta | null {
  const b = (bodyRaw || '').toLowerCase().trim();
  const r = (roleRaw || '').toLowerCase().trim();

  // Se for equipe de serviço operacional de encontro, não é mandato
  const invalidTeamTokens = [
    'faxina', 'gráfica', 'grafica', 'cozinha', 'círculo', 'circulo',
    'sala', 'lanche', 'minimercado', 'mini-mercado', 'prover',
    'intercessão', 'intercessao', 'visitação', 'visitacao', 'animação',
    'animacao', 'espiritualização', 'espiritualizacao', 'canto',
    'estacionamento', 'vigília', 'vigilia', 'comandantes', 'apoio', 'palestra'
  ];
  if (invalidTeamTokens.some(token => b === token || b.startsWith(token + ' '))) {
    return null;
  }

  // 1. Coordenação Setorial (Setores 1 a 6)
  if (b.includes('setor') || r.includes('setorial')) {
    let sectorNum = '';
    for (let i = 1; i <= 6; i++) {
      if (b.includes(String(i)) || r.includes(String(i))) {
        sectorNum = String(i);
        break;
      }
    }
    return {
      normalizedBody: 'Coordenação Setorial',
      category: 'setorial',
      sectorId: sectorNum || undefined,
      sectorName: sectorNum ? `Setor ${sectorNum}` : 'Setorial',
      badgeLabel: sectorNum ? `🌐 Setorial · Setor ${sectorNum}` : '🌐 Coordenação Setorial',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      badgeBorder: '#bfdbfe',
    };
  }

  // 2. Equipe Dirigente (1ª ou 2ª Etapa)
  if (
    b.includes('dirigente') ||
    r.includes('dirigente') ||
    r.includes('pasta montagem') ||
    r.includes('pasta ficha') ||
    r.includes('pasta finança') ||
    r.includes('pasta palestra') ||
    r.includes('pasta pós-encontro') ||
    r.includes('diretor espiritual')
  ) {
    const is2aEtapa = b.includes('2ª') || b.includes('2a') || r.includes('2ª') || r.includes('2a');
    return {
      normalizedBody: is2aEtapa ? 'Equipe Dirigente - 2ª Etapa' : 'Equipe Dirigente - 1ª Etapa',
      category: 'equipe_dirigente',
      badgeLabel: is2aEtapa ? '⛪ Equipe Dirigente · 2ª Etapa' : '⛪ Equipe Dirigente',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      badgeBorder: '#bbf7d0',
    };
  }

  // 3. Conselho Diocesano / Coordenação Diocesana
  if (
    b.includes('conselho') ||
    b.includes('diocesano') ||
    b.includes('executivo') ||
    r.includes('diocesano') ||
    r.includes('conselho')
  ) {
    return {
      normalizedBody: 'Conselho Diocesano',
      category: 'diocesano',
      badgeLabel: '🏛️ Coordenação Diocesana',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      badgeBorder: '#fde68a',
    };
  }

  // Se não bater com nenhuma regra de mandato, descartar
  return null;
}

/**
 * Determina o status de um mandato (Ativo ou Encerrado) com base nos anos de vigência
 */
export function getMandateStatus(
  startYear?: number | null,
  endYear?: number | null,
  referenceYear = new Date().getFullYear()
): {
  isActive: boolean;
  label: 'Ativo (Vigente)' | 'Encerrado (Concluído)';
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  displayPeriod: string;
} {
  const start = startYear || referenceYear;
  // Se o ano final não foi informado, considera mandato anual (mesmo ano)
  const end = endYear || start;
  const isActive = end >= referenceYear && start <= referenceYear;
  const displayPeriod = start === end ? `${start}` : `${start} - ${end}`;

  if (isActive) {
    return {
      isActive: true,
      label: 'Ativo (Vigente)',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      badgeBorder: '#bbf7d0',
      displayPeriod,
    };
  }

  return {
    isActive: false,
    label: 'Encerrado (Concluído)',
    badgeBg: '#f4f4f5',
    badgeColor: '#52525b',
    badgeBorder: '#e4e4e7',
    displayPeriod,
  };
}

/**
 * Retorna as cores, ícones e estilos visuais diferenciados para Casal e Jovem
 */
export function getConditionMeta(condition?: string | null, role?: string | null) {
  const condText = (condition || '').toLowerCase();
  const roleText = (role || '').toLowerCase();
  const isCasal =
    condText.includes('casal') ||
    roleText.includes('casal') ||
    roleText.includes('tio') ||
    roleText.includes('tia');

  if (isCasal) {
    return {
      isCasal: true,
      conditionLabel: 'Casal',
      iconEmoji: '💍',
      cardBorderLeft: '3.5px solid #d97706',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      badgeBorder: '#fde68a',
      roleBadgeBg: '#fef3c7',
      roleBadgeColor: '#92400e',
      roleBadgeBorder: '#fcd34d',
    };
  }

  return {
    isCasal: false,
    conditionLabel: 'Jovem',
    iconEmoji: '⚡',
    cardBorderLeft: '3.5px solid #2563eb',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    badgeBorder: '#bfdbfe',
    roleBadgeBg: '#eff6ff',
    roleBadgeColor: '#1e40af',
    roleBadgeBorder: '#93c5fd',
  };
}



