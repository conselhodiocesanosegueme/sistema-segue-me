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
      { name: 'São Sebastião', city: 'Interlândia - GO', dbNames: ['Paróquia São Sebastião', 'São Sebastião'] },
      { name: "Nossa Senhora D'Abadia", city: 'Souzânia - GO', dbNames: ["Paróquia Nossa Senhora D'Abadia (Souzânia)"] },
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
      { name: 'São Pedro e São Paulo', city: 'Anápolis - GO', dbNames: ['Paróquia São Pedro e São Paulo', 'São Pedro e São Paulo'] },
      { name: 'Santuário Santo Antônio', city: 'Anápolis - GO', dbNames: ['Santuário Diocesano Santo Antônio', 'Santuário Santo Antônio'] },
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
      { name: 'Nossa Senhora do Carmo', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora do Carmo', 'Nossa Senhora do Carmo'] },
      { name: 'São Francisco de Assis', city: 'Anápolis - GO', dbNames: ['Paróquia São Francisco de Assis', 'São Francisco de Assis'] },
      { name: 'Nossa Senhora das Graças', city: 'Anápolis - GO', dbNames: ['Paróquia Nossa Senhora das Graças', 'Nossa Senhora das Graças'] },
      { name: 'Catedral Bom Jesus', city: 'Anápolis - GO', dbNames: ['Catedral do Bom Jesus', 'Catedral Bom Jesus'] },
      { name: "Nossa Senhora D'Abadia", city: 'Anápolis - GO', dbNames: ["Paróquia Nossa Senhora D'Abadia", "Nossa Senhora D'Abadia"] },
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
      { name: 'São Sebastião', city: 'Ouro Verde - GO', dbNames: ['Paróquia São Sebastião (Ouro Verde)'] },
      { name: 'Santa Maria Eterna', city: 'Petrolina - GO', dbNames: ['Paróquia Santa Maria Eterna', 'Santa Maria Eterna'] },
      { name: 'Santo Antônio', city: 'Damolândia - GO', dbNames: ['Paróquia Santo Antônio (Damolândia)'] },
      { name: "Nossa Senhora D'Abadia", city: 'Santa Rosa - GO', dbNames: ["Paróquia Nossa Senhora D'Abadia (Santa Rosa)"] },
      { name: 'Nossa Senhora do Carmo', city: 'Nova Veneza - GO', dbNames: ['Paróquia Nossa Senhora do Carmo (Nova Veneza)'] },
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
      { name: 'São Francisco de Assis', city: 'São Francisco de Goiás - GO', dbNames: ['Paróquia São Francisco de Assis (São Francisco de Goiás)'] },
      { name: 'Imaculado Coração de Maria e São Judas Tadeu', city: 'Jaranápolis - GO', dbNames: ['Paróquia Imaculado Coração de Maria e São Judas Tadeu', 'Imaculado Coração de Maria e São Judas Tadeu'] },
      { name: 'Senhor Bom Jesus', city: 'Jesúpolis - GO', status: 'SEM EQUIPE DIRIGENTE', dbNames: ['Paróquia Senhor Bom Jesus', 'Senhor Bom Jesus'] },
      { name: 'Santo Antônio', city: 'Vila Propício - GO', dbNames: ['Paróquia Santo Antônio de Pádua', 'Santo Antônio de Pádua'] },
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
      { name: 'Nossa Senhora do Rosário', city: 'Pirenópolis - GO', dbNames: ['Paróquia Nossa Senhora do Rosário e Paróquia Santa Bárbara', 'Nossa Senhora do Rosário'] },
      { name: 'Santa Bárbara', city: 'Pirenópolis - GO', dbNames: ['Paróquia Santa Bárbara', 'Santa Bárbara'] },
      { name: 'São Pedro e São Paulo', city: 'Abadiânia - GO', dbNames: ['Paróquia São Pedro e São Paulo (Abadiânia)'] },
      { name: 'Santo Antônio', city: 'Cocalzinho - GO', dbNames: ['Paróquia Santo Antônio (Cocalzinho)'] },
      { name: 'Imaculado Coração de Maria', city: 'Alexânia - GO', dbNames: ['Paróquia Imaculado Coração de Maria', 'Imaculado Coração de Maria'] },
      { name: 'Nossa Senhora do Livramento', city: 'Girassol - GO', dbNames: ['Paróquia Nossa Senhora do Livramento', 'Nossa Senhora do Livramento'] },
    ],
  },
];

/**
 * Identifica o setor de uma paróquia a partir do nome ou cidade
 */
export function getSectorForParish(parishName: string, city?: string): Sector | undefined {
  if (!parishName) return undefined;
  const p = parishName.toLowerCase().trim();
  const c = (city || '').toLowerCase().trim();

  // 1. Desempate prioritário por município/cidade quando informada
  if (c.includes('ouro verde') || c.includes('petrolina') || c.includes('damolândia') || c.includes('nerópolis') || c.includes('nova veneza') || c.includes('santa rosa')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-4');
  }
  if (c.includes('jaraguá') || c.includes('são francisco de goiás') || c.includes('jesúpolis') || c.includes('propício') || c.includes('jaranápolis')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-5');
  }
  if (c.includes('corumbá') || c.includes('pirenópolis') || c.includes('abadiânia') || c.includes('cocalzinho') || c.includes('alexânia') || c.includes('girassol')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-6');
  }
  if (c.includes('interlândia') || c.includes('souzânia')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-1');
  }
  if (c.includes('campo limpo')) {
    return DIOCESAN_SECTORS.find(s => s.id === 'setor-2');
  }

  // 2. Busca por nomes cadastrados no banco
  for (const sector of DIOCESAN_SECTORS) {
    for (const item of sector.parishes) {
      if (item.dbNames.some(db => p === db.toLowerCase() || p.includes(db.toLowerCase()))) {
        return sector;
      }
    }
  }

  // 3. Busca heurística por palavras-chave do orago
  if (p.includes('penha de frança') || p.includes('rosário') || p.includes('livramento')) return DIOCESAN_SECTORS[5];
  if (p.includes('penha') || p.includes('edwiges') || (p.includes('são josé') && !p.includes('operário'))) return DIOCESAN_SECTORS[4];
  if (p.includes('benedito') || p.includes('maria eterna')) return DIOCESAN_SECTORS[3];
  if (p.includes('operário') || p.includes('aparecida') || p.includes('joaquim') || p.includes('sagrado coração') || p.includes('santuário') || p.includes('teresinha') || p.includes('terezinha')) return DIOCESAN_SECTORS[1];
  if (p.includes('lourdes') || p.includes('mateus') || p.includes('catedral') || p.includes('francisco de assis') || p.includes('graças') || p.includes('carmo')) return DIOCESAN_SECTORS[2];
  if (p.includes('trindade') || p.includes('fátima') || p.includes('divino') || p.includes('cristóvão') || p.includes('clara')) return DIOCESAN_SECTORS[0];

  return undefined;
}
