export interface SectorParish {
  name: string;
  city: string;
  status?: string; // 'SEM EQUIPE DIRIGENTE' | 'IMPLANTAÇÃO' | undefined
  dbNames: string[]; // nomes ou variações encontrados no banco de dados
}

export interface Sector {
  id: string;
  name: string;
  roman: string;
  region: string;
  description: string;
  parishes: SectorParish[];
}

export const DIOCESAN_SECTORS: Sector[] = [
  {
    id: 'setor-1',
    roman: 'I',
    name: 'Setor I',
    region: 'Anápolis Norte / Souzânia / Interlândia',
    description: 'Região norte de Anápolis e distritos de Souzânia e Interlândia',
    parishes: [
      { name: 'São Sebastião', city: 'Interlândia - GO', dbNames: ['Paróquia São Sebastião (Interlândia)', 'Paróquia São Sebastião', 'São Sebastião', 'São Sebastião (Interlândia)'] },
      { name: "Nossa Senhora D'Abadia", city: 'Souzânia - GO', dbNames: ["Paróquia Nossa Senhora D'Abadia (Souzânia)", "Paróquia Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia (Souzânia)"] },
      { name: 'Santíssima Trindade', city: 'Anápolis - GO', dbNames: ['Paróquia Santíssima Trindade', 'Santíssima Trindade'] },
      { name: 'Nossa Senhora de Fátima', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora de Fátima', 'Nossa Senhora de Fátima'] },
      { name: 'Divino Pai Eterno', city: 'Anápolis - GO', dbNames: ['Paróquia Divino Pai Eterno', 'Divino Pai Eterno'] },
      { name: 'São Cristóvão', city: 'Anápolis - GO', dbNames: ['Paróquia São Cristóvão', 'São Cristóvão'] },
      { name: 'Santa Clara', city: 'Anápolis - GO', dbNames: ['Paróquia Santa Clara', 'Santa Clara'] },
      { name: 'Jesus Bom Pastor', city: 'Anápolis - GO', status: 'SEM EQUIPE DIRIGENTE', dbNames: ['Paróquia Jesus Bom Pastor'] },
    ],
  },
  {
    id: 'setor-2',
    roman: 'II',
    name: 'Setor II',
    region: 'Anápolis Leste / Recanto do Sol / Jaiara / Campo Limpo',
    description: 'Região leste, Jaiara, bairros operários da Diocese e Campo Limpo de Goiás',
    parishes: [
      { name: 'São José Operário', city: 'Anápolis - GO', dbNames: ['Paróquia São José Operário', 'São José Operário'] },
      { name: 'Nossa Senhora Aparecida', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora Aparecida', 'Nossa Senhora Aparecida', 'Paróquia Nossa Senhora Aparecida e São Pedro e São Paulo'] },
      { name: 'São Pedro e São Paulo', city: 'Anápolis - GO', dbNames: ['Paróquia São Pedro e São Paulo (Anápolis)', 'Paróquia São Pedro e São Paulo', 'São Pedro e São Paulo', 'São Pedro e São Paulo (Anápolis)'] },
      { name: 'Santuário Santo Antônio', city: 'Anápolis - GO', dbNames: ['Santuário Diocesano Santo Antônio', 'Santuário Santo Antônio', 'Paróquia Santo Antônio (Anápolis)', 'Santo Antônio (Anápolis)'] },
      { name: 'São Joaquim', city: 'Anápolis - GO', dbNames: ['Paróquia São Joaquim', 'São Joaquim'] },
      { name: 'Sagrado Coração de Jesus', city: 'Anápolis - GO', dbNames: ['Paróquia Sagrado Coração de Jesus', 'Sagrado Coração de Jesus'] },
      {
        name: 'Santa Teresinha do Menino Jesus',
        city: 'Campo Limpo de Goiás - GO',
        status: 'IMPLANTAÇÃO',
        dbNames: [
          'Paróquia Santa Teresinha do Menino Jesus',
          'Santa Teresinha do Menino Jesus',
          'Paróquia Santa Terezinha do Menino Jesus',
          'Santa Terezinha do Menino Jesus',
          'Santa Teresinha',
          'Santa Terezinha',
        ],
      },
    ],
  },
  {
    id: 'setor-3',
    roman: 'III',
    name: 'Setor III',
    region: 'Anápolis Centro / Sul / Jundiaí',
    description: 'Centro histórico, Jundiaí e região sul da cidade de Anápolis',
    parishes: [
      { name: 'Nossa Senhora de Lourdes', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora de Lourdes', 'Nossa Senhora de Lourdes'] },
      { name: 'São Mateus', city: 'Anápolis - GO', dbNames: ['Paróquia São Mateus', 'São Mateus'] },
      { name: 'Nossa Senhora do Carmo', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora do Carmo (Anápolis)', 'Paróquia Nossa Senhora do Carmo', 'Nossa Senhora do Carmo', 'Nossa Senhora do Carmo (Anápolis)'] },
      { name: 'São Francisco de Assis', city: 'Anápolis - GO', dbNames: ['Paróquia São Francisco de Assis (Anápolis)', 'Paróquia São Francisco de Assis', 'São Francisco de Assis', 'São Francisco de Assis (Anápolis)'] },
      { name: 'Nossa Senhora das Graças', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora das Graças', 'Nossa Senhora das Graças'] },
      { name: 'Catedral Bom Jesus', city: 'Anápolis - GO', dbNames: ['Catedral do Bom Jesus', 'Catedral Bom Jesus'] },
      { name: "Nossa Senhora D'Abadia", city: 'Anápolis - GO', dbNames: ["Paróquia Nossa Senhora D'Abadia (Anápolis)", "Paróquia Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia (Anápolis)"] },
      { name: 'Nossa Senhora Rosa Mística', city: 'Anápolis - GO', status: 'SEM EQUIPE DIRIGENTE', dbNames: ['Paróquia Nossa Senhora Rosa Mística', 'Nossa Senhora Rosa Mística'] },
      { name: 'Santo Expedito', city: 'Anápolis - GO', status: 'SEM EQUIPE DIRIGENTE', dbNames: ['Paróquia Santo Expedito'] },
    ],
  },
  {
    id: 'setor-4',
    roman: 'IV',
    name: 'Setor IV',
    region: 'Ouro Verde / Petrolina / Nerópolis / Nova Veneza',
    description: 'Municípios do eixo noroeste e norte da diocese',
    parishes: [
      { name: 'São Sebastião', city: 'Ouro Verde - GO', dbNames: ['Paróquia São Sebastião (Ouro Verde)', 'Paróquia São Sebastião', 'São Sebastião', 'São Sebastião (Ouro Verde)'] },
      { name: 'Santa Maria Eterna', city: 'Petrolina - GO', dbNames: ['Paróquia Santa Maria Eterna', 'Santa Maria Eterna'] },
      { name: 'Santo Antônio', city: 'Damolândia - GO', dbNames: ['Paróquia Santo Antônio (Damolândia)', 'Paróquia Santo Antônio', 'Santo Antônio', 'Santo Antônio (Damolândia)'] },
      { name: "Nossa Senhora D'Abadia", city: 'Santa Rosa - GO', dbNames: ["Paróquia Nossa Senhora D'Abadia (Santa Rosa)", "Paróquia Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia (Santa Rosa)"] },
      { name: 'Nossa Senhora do Carmo', city: 'Nova Veneza - GO', dbNames: ['Paróquia Nossa Senhora do Carmo (Nova Veneza)', 'Paróquia Nossa Senhora do Carmo', 'Nossa Senhora do Carmo', 'Nossa Senhora do Carmo (Nova Veneza)'] },
      { name: 'São Benedito e Imaculado Coração de Maria', city: 'Nerópolis - GO', dbNames: ['Paróquia São Benedito e Imaculado Coração de Maria', 'Paróquia São Benedito', 'São Benedito'] },
    ],
  },
  {
    id: 'setor-5',
    roman: 'V',
    name: 'Setor V',
    region: 'Jaraguá / São Francisco de Goiás / Jaranápolis / Vila Propício',
    description: 'Região do Vale do São Patrício e municípios vizinhos',
    parishes: [
      { name: 'Nossa Senhora da Penha', city: 'Jaraguá - GO', dbNames: ['Paróquia Nossa Senhora da Penha', 'Nossa Senhora da Penha', 'Paróquias Nossa Senhora da Penha e São José', 'Paróquias Nossa Senhora da Penha, Santa Edwiges e São José'] },
      { name: 'Santa Edwiges', city: 'Jaraguá - GO', dbNames: ['Paróquia Santa Edwiges', 'Santa Edwiges'] },
      { name: 'São José', city: 'Jaraguá - GO', dbNames: ['Paróquia São José', 'São José'] },
      { name: 'São Francisco de Assis', city: 'São Francisco de Goiás - GO', dbNames: ['Paróquia São Francisco de Assis (São Francisco de Goiás)', 'Paróquia São Francisco de Assis', 'São Francisco de Assis', 'São Francisco de Assis (São Francisco de Goiás)'] },
      { name: 'Imaculado Coração de Maria e São Judas Tadeu', city: 'Jaranápolis - GO', dbNames: ['Paróquia Imaculado Coração de Maria e São Judas Tadeu', 'Imaculado Coração de Maria e São Judas Tadeu'] },
      { name: 'Senhor Bom Jesus', city: 'Jesúpolis - GO', status: 'SEM EQUIPE DIRIGENTE', dbNames: ['Paróquia Senhor Bom Jesus', 'Senhor Bom Jesus'] },
      { name: 'Santo Antônio', city: 'Vila Propício - GO', dbNames: ['Paróquia Santo Antônio de Pádua', 'Santo Antônio de Pádua', 'Paróquia Santo Antônio (Vila Propício)', 'Santo Antônio (Vila Propício)'] },
    ],
  },
  {
    id: 'setor-6',
    roman: 'VI',
    name: 'Setor VI',
    region: 'Pirenópolis / Corumbá / Abadiânia / Alexânia / Cocalzinho / Girassol',
    description: 'Região leste e nordeste da diocese (rota do Entorno e Pireneus)',
    parishes: [
      { name: 'Nossa Senhora da Penha de França', city: 'Corumbá de Goiás - GO', dbNames: ['Paróquia Nossa Senhora da Penha de França', 'Nossa Senhora da Penha de França'] },
      {
        name: 'Nossa Senhora do Rosário e Santa Bárbara',
        city: 'Pirenópolis - GO',
        dbNames: [
          'Paróquia Nossa Senhora do Rosário e Paróquia Santa Bárbara',
          'Nossa Senhora do Rosário e Santa Bárbara',
          'Paróquia Nossa Senhora do Rosário',
          'Nossa Senhora do Rosário',
          'Paróquia Santa Bárbara',
          'Santa Bárbara',
        ],
      },
      { name: 'São Pedro e São Paulo', city: 'Abadiânia - GO', dbNames: ['Paróquia São Pedro e São Paulo (Abadiânia)', 'Paróquia São Pedro e São Paulo', 'São Pedro e São Paulo', 'São Pedro e São Paulo (Abadiânia)'] },
      { name: 'Santo Antônio', city: 'Cocalzinho - GO', dbNames: ['Paróquia Santo Antônio (Cocalzinho)', 'Paróquia Santo Antônio', 'Santo Antônio', 'Santo Antônio (Cocalzinho)'] },
      { name: 'Imaculado Coração de Maria', city: 'Alexânia - GO', dbNames: ['Paróquia Imaculado Coração de Maria', 'Imaculado Coração de Maria'] },
      { name: 'Nossa Senhora do Livramento', city: 'Girassol - GO', dbNames: ['Paróquia Nossa Senhora do Livramento', 'Nossa Senhora do Livramento'] },
    ],
  },
];

export const EXTERNAL_SECTOR: Sector = {
  id: 'setor-externo',
  roman: 'EXT',
  name: 'Missões & Implantações Externas',
  region: 'Outras Dioceses (Apadrinhadas por Anápolis)',
  description: 'Encontros de implantação do Segue-me realizados em outras dioceses com apoio missionário de jovens e casais da Diocese de Anápolis.',
  parishes: [],
};

export const ALL_SECTORS_WITH_EXTERNAL: Sector[] = [...DIOCESAN_SECTORS, EXTERNAL_SECTOR];

/**
 * Normaliza nome de cidade para comparações seguras sem acentos e sufixos
 */
export function normalizeCity(c: string = ''): string {
  return c
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\/go/g, '')
    .replace(/- go/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza nome de paróquia/orago para comparações seguras
 */
export function normalizeParishName(n: string = ''): string {
  return n
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^paróquias?\s+/i, '')
    .replace(/^santuario\s+(diocesano\s+)?/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se a cidade do encontro e da paróquia são compatíveis
 */
export function areCitiesCompatible(encCity?: string, parishCity?: string): boolean {
  if (!encCity || !parishCity) return true;
  const e = normalizeCity(encCity);
  const p = normalizeCity(parishCity);
  if (!e || !p) return true;
  if (e === p) return true;
  if (e.includes(p) || p.includes(e)) return true;
  if (e.includes('petrolina') && p.includes('petrolina')) return true;
  if (e.includes('corumba') && p.includes('corumba')) return true;
  if (e.includes('sao francisco') && p.includes('sao francisco')) return true;
  if (e.includes('campo limpo') && p.includes('campo limpo')) return true;
  return false;
}

/**
 * Faz a verificação estrita se um encontro pertence a uma paróquia diocesana,
 * prevenindo categoricamente colisões entre paróquias homônimas ou sobrepostas de cidades distintas
 * (ex: São José de Jaraguá vs São José Operário de Anápolis, São Francisco de Assis Anápolis vs São Francisco de Goiás).
 */
export function matchEncounterToParish(
  encounter: { parish?: string; city?: string; type?: string; is_external_implantation?: boolean; target_diocese?: string | null },
  parish: SectorParish
): boolean {
  // Encontros de implantação em outras dioceses nunca colidem com paróquias locais de Anápolis
  if (encounter.is_external_implantation || encounter.type === 'Implantação Externa' || encounter.target_diocese) {
    return false;
  }

  const eParishRaw = (encounter.parish || '').trim();
  const eCityRaw = (encounter.city || '').trim();
  if (!eParishRaw) return false;

  // 1. Barreira estrita de cidade: Se informada no encontro e for incompatível com a paróquia, REJEITA IMEDIATAMENTE
  if (eCityRaw && parish.city && !areCitiesCompatible(eCityRaw, parish.city)) {
    return false;
  }

  const eParishLower = eParishRaw.toLowerCase();
  const eParishNorm = normalizeParishName(eParishRaw);
  const pNameNorm = normalizeParishName(parish.name);

  // 2. Regras anti-colisão expressas para oragos homônimos ou sobrepostos
  // São José Operário (Anápolis) vs São José (Jaraguá)
  if (pNameNorm === 'sao jose operario' && !eParishNorm.includes('operario')) {
    return false;
  }
  if (pNameNorm === 'sao jose' && eParishNorm.includes('operario')) {
    return false;
  }

  // Santa Edwiges vs Santa Clara
  if (pNameNorm === 'santa edwiges' && !eParishNorm.includes('edwiges')) {
    return false;
  }
  if (pNameNorm === 'santa clara' && !eParishNorm.includes('clara')) {
    return false;
  }

  // Penha de França (Corumbá) vs Penha (Jaraguá)
  if (pNameNorm === 'nossa senhora da penha' && eParishNorm.includes('franca')) {
    return false;
  }
  if (pNameNorm === 'nossa senhora da penha de franca' && !eParishNorm.includes('franca')) {
    return false;
  }

  // 3. Correspondência exata na lista de nomes do banco de dados (dbNames)
  const dbMatch = parish.dbNames.some((db) => {
    return eParishLower === db.toLowerCase() || eParishNorm === normalizeParishName(db);
  });
  if (dbMatch) return true;

  // 4. Correspondência exata no nome normalizado
  if (eParishNorm === pNameNorm) return true;

  // 5. Edições conjuntas de Jaraguá (Penha com São José e/ou Santa Edwiges)
  if (parish.city.toLowerCase().includes('jaraguá') && eCityRaw.toLowerCase().includes('jaraguá')) {
    if (
      pNameNorm === 'nossa senhora da penha' &&
      (eParishNorm.includes('penha e sao jose') || eParishNorm.includes('penha, santa edwiges e sao jose'))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Identifica o setor de uma paróquia a partir do nome ou cidade
 */
export function getSectorForParish(parishName: string, city?: string): Sector | undefined {
  if (!parishName) return undefined;

  // 1. Busca estrita usando matchEncounterToParish
  for (const sector of DIOCESAN_SECTORS) {
    for (const parish of sector.parishes) {
      if (matchEncounterToParish({ parish: parishName, city }, parish)) {
        return sector;
      }
    }
  }

  // 2. Desempate prioritário por município/cidade quando informada
  const c = normalizeCity(city || '');
  if (c.includes('ouro verde') || c.includes('petrolina') || c.includes('damolandia') || c.includes('neropolis') || c.includes('nova veneza') || c.includes('santa rosa')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-4');
  }
  if (c.includes('jaragua') || c.includes('sao francisco de goias') || c.includes('jesupolis') || c.includes('propicio') || c.includes('jaranapolis')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-5');
  }
  if (c.includes('corumba') || c.includes('pirenopolis') || c.includes('abadiania') || c.includes('cocalzinho') || c.includes('alexania') || c.includes('girassol')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-6');
  }
  if (c.includes('interlandia') || c.includes('souzania')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-1');
  }
  if (c.includes('campo limpo')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-2');
  }

  // 3. Busca heurística por palavras-chave do orago
  const p = normalizeParishName(parishName);
  if (p.includes('penha de franca') || p.includes('rosario') || p.includes('barbara') || p.includes('livramento')) return DIOCESAN_SECTORS[5];
  if (p.includes('penha') || p.includes('edwiges') || (p.includes('sao jose') && !p.includes('operario'))) return DIOCESAN_SECTORS[4];
  if (p.includes('benedito') || p.includes('maria eterna')) return DIOCESAN_SECTORS[3];
  if (p.includes('operario') || p.includes('aparecida') || p.includes('joaquim') || p.includes('sagrado coracao') || p.includes('santuario') || p.includes('teresinha') || p.includes('terezinha')) return DIOCESAN_SECTORS[1];
  if (p.includes('lourdes') || p.includes('mateus') || p.includes('catedral') || p.includes('francisco de assis') || p.includes('gracas') || p.includes('carmo')) return DIOCESAN_SECTORS[2];
  if (p.includes('trindade') || p.includes('fatima') || p.includes('divino') || p.includes('cristovao') || p.includes('clara')) return DIOCESAN_SECTORS[0];

  return undefined;
}
