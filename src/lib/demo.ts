import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isDemoMode } from './config';
import type { Encounter, ImportJob, Mandate, Participation, Person, ReviewItem } from './types';
export type DemoCouple = { id: string; legacy_id?: string | null; person_1_id: string; person_2_id: string; start_text?: string | null; end_text?: string | null; notes?: string | null };
export type DemoState = { people: Person[]; encounters: Encounter[]; participations: Participation[]; reviews: ReviewItem[]; imports: ImportJob[]; audit: {id:string;action:string;reason:string;created_at:string;before:unknown;after:unknown}[]; mandates: Mandate[]; couples: DemoCouple[] };
const uid = (n:number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const demoPersonId=uid(100);
export function initialDemo(): DemoState {
  const names = [
    'Ana Clara de Almeida', 'Miguel de Oliveira', 'Beatriz Campos', 'Gabriel Ferreira',
    'Maria Eduarda Santos', 'Lucas Ribeiro', 'Helena Costa', 'Pedro Henrique Lima',
    'Isabela Martins', 'Rafael Cardoso', 'Luiza Mendes', 'João Vitor Rocha',
    'Camila Duarte', 'Thiago Barbosa', 'Mariana Freitas', 'Daniel Nascimento',
    'Ana C. de Almeida', 'Sofia Azevedo', 'Carlos Eduardo Silva', 'Patrícia Gomes'
  ];
  const parishes = [
    'Paróquia São Francisco de Assis',
    'Paróquia Santa Clara',
    'Paróquia Nossa Senhora da Esperança'
  ];
  const encounters: Encounter[] = [
    { id: uid(501), legacy_id: 'SFA-2021-01', edition: '1ª', year: 2021, parish: parishes[0], city: 'Anápolis/GO', name: '1º Encontro Segue-me · São Francisco', date_text: '16 a 18/07/2021', extraction_status: 'Consolidado', source_name: 'Ata Paroquial', notes: 'Primeira edição histórica na paróquia.' },
    { id: uid(502), legacy_id: 'SCL-2022-01', edition: '1ª', year: 2022, parish: parishes[1], city: 'Anápolis/GO', name: '1º Encontro Segue-me · Santa Clara', date_text: '22 a 24/07/2022', extraction_status: 'Consolidado', source_name: 'Quadrante Oficial', notes: 'Encontro paroquial.' },
    { id: uid(503), legacy_id: 'NSE-2022-01', edition: '1ª', year: 2022, parish: parishes[2], city: 'Anápolis/GO', name: '1º Encontro Segue-me · Esperança', date_text: '19 a 21/08/2022', extraction_status: 'Consolidado', source_name: 'Ata Paroquial', notes: 'Edição paroquial.' },
    { id: uid(504), legacy_id: 'SFA-2023-02', edition: '2ª', year: 2023, parish: parishes[0], city: 'Anápolis/GO', name: '2º Encontro Segue-me · São Francisco', date_text: '14 a 16/07/2023', extraction_status: 'Consolidado', source_name: 'Ata Paroquial', notes: 'Segunda edição paroquial.' },
    { id: uid(505), legacy_id: 'SCL-2024-02', edition: '2ª', year: 2024, parish: parishes[1], city: 'Anápolis/GO', name: '2º Encontro Segue-me · Santa Clara', date_text: '12 a 14/07/2024', extraction_status: 'Consolidado', source_name: 'Quadrante Oficial', notes: 'Edição consolidada.' },
    { id: uid(506), legacy_id: 'SFA-2025-03', edition: '3ª', year: 2025, parish: parishes[0], city: 'Anápolis/GO', name: '3º Encontro Segue-me · São Francisco', date_text: '18 a 20/07/2025', extraction_status: 'Consolidado', source_name: 'Ata Paroquial', notes: 'Terceira edição paroquial.' },
  ];
  const people: Person[] = names.map((name, i) => ({
    id: uid(100 + i),
    legacy_id: `DEMO-${String(i + 1).padStart(5, '0')}`,
    name,
    phone: i === 0 ? '(62) 98123-4567' : i === 1 ? '(62) 99876-5432' : i % 3 ? `pessoa${i + 1}@example.invalid` : null,
    email: i === 0 ? 'anaclara.almeida@example.invalid' : i === 1 ? 'miguel.oliveira@example.invalid' : i % 3 ? `pessoa${i + 1}@example.invalid` : null,
    birth_date_text: i % 4 === 0 ? null : `${String(10 + i % 18).padStart(2, '0')}/03/${1990 + i}`,
    sex: i % 2 === 0 ? 'F' : 'M',
    identification_status: i === 16 ? 'Possível duplicidade' : i % 4 === 0 ? 'Dados incompletos' : 'Identificado',
    notes: 'Cadastro fictício para validação de escopos.',
    version: 1,
    parish: parishes[i % 3],
  }));

  const participations: Participation[] = [
    // São Francisco 2021 (encounters[0])
    { id: uid(1000), person_id: people[0].id, encounter_id: encounters[0].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Azul', role: 'Encontrista', patron: 'Nossa Senhora de Fátima' },
    { id: uid(1001), person_id: people[1].id, encounter_id: encounters[0].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Vermelho', role: 'Encontrista', patron: 'São Bento' },
    { id: uid(1002), person_id: people[2].id, encounter_id: encounters[0].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Amarelo', role: 'Encontrista', patron: 'São Francisco' },
    { id: uid(1003), person_id: people[3].id, encounter_id: encounters[0].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Verde', role: 'Encontrista', patron: 'Santa Clara' },
    { id: uid(1004), person_id: people[4].id, encounter_id: encounters[0].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Cozinha', circle: null, role: 'Membro', patron: null },
    { id: uid(1005), person_id: people[5].id, encounter_id: encounters[0].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Acolhida', circle: null, role: 'Coordenação', patron: null },
    { id: uid(1006), person_id: people[6].id, encounter_id: encounters[0].id, kind: 'Trabalhou', condition: 'Casal', team: 'Círculo', circle: 'Azul', role: 'Tia de Círculo', patron: 'Nossa Senhora' },
    { id: uid(1007), person_id: people[7].id, encounter_id: encounters[0].id, kind: 'Trabalhou', condition: 'Casal', team: 'Círculo', circle: 'Azul', role: 'Tio de Círculo', patron: 'Nossa Senhora' },

    // Santa Clara 2022 (encounters[1])
    { id: uid(1010), person_id: people[0].id, encounter_id: encounters[1].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Cozinha', circle: null, role: 'Membro de Equipe', patron: null },
    { id: uid(1011), person_id: people[8].id, encounter_id: encounters[1].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Branco', role: 'Encontrista', patron: 'São Pedro' },
    { id: uid(1012), person_id: people[9].id, encounter_id: encounters[1].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Lilás', role: 'Encontrista', patron: 'Santa Rita' },

    // Esperança 2022 (encounters[2])
    { id: uid(1020), person_id: people[10].id, encounter_id: encounters[2].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Laranja', role: 'Encontrista', patron: 'São José' },
    { id: uid(1021), person_id: people[11].id, encounter_id: encounters[2].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Canto', circle: null, role: 'Membro', patron: null },

    // São Francisco 2023 (encounters[3])
    { id: uid(1030), person_id: people[12].id, encounter_id: encounters[3].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Azul', role: 'Encontrista', patron: 'São Francisco' },
    { id: uid(1031), person_id: people[13].id, encounter_id: encounters[3].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Verde', role: 'Encontrista', patron: 'São Bento' },
    { id: uid(1032), person_id: people[14].id, encounter_id: encounters[3].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Vermelho', role: 'Encontrista', patron: 'Nossa Senhora' },
    { id: uid(1033), person_id: people[0].id, encounter_id: encounters[3].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Acolhida', circle: null, role: 'Coordenação de Equipe', patron: null },
    { id: uid(1034), person_id: people[1].id, encounter_id: encounters[3].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Secretaria', circle: null, role: 'Membro', patron: null },
    { id: uid(1035), person_id: people[18].id, encounter_id: encounters[3].id, kind: 'Trabalhou', condition: 'Casal', team: 'Círculo', circle: 'Verde', role: 'Tio de Círculo', patron: 'São Francisco' },
    { id: uid(1036), person_id: people[19].id, encounter_id: encounters[3].id, kind: 'Trabalhou', condition: 'Casal', team: 'Círculo', circle: 'Verde', role: 'Tia de Círculo', patron: 'São Francisco' },

    // Santa Clara 2024 (encounters[4])
    { id: uid(1040), person_id: people[0].id, encounter_id: encounters[4].id, kind: 'Trabalhou', condition: 'Casal', team: 'Círculo', circle: 'Verde', role: 'Tia de Círculo', patron: 'São Francisco de Assis', notes: 'Atuou junto com o esposo Miguel de Oliveira' },
    { id: uid(1041), person_id: people[1].id, encounter_id: encounters[4].id, kind: 'Trabalhou', condition: 'Casal', team: 'Círculo', circle: 'Verde', role: 'Tio de Círculo', patron: 'São Francisco de Assis', notes: 'Atuou junto com a esposa Ana Clara de Almeida' },
    { id: uid(1042), person_id: people[15].id, encounter_id: encounters[4].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Amarelo', role: 'Encontrista', patron: 'Santa Clara' },

    // São Francisco 2025 (encounters[5])
    { id: uid(1050), person_id: people[17].id, encounter_id: encounters[5].id, kind: 'Vivenciou', condition: 'Jovem', team: 'Círculo', circle: 'Branco', role: 'Encontrista', patron: 'São Francisco' },
    { id: uid(1051), person_id: people[2].id, encounter_id: encounters[5].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Sala', circle: null, role: 'Coordenação', patron: null },
    { id: uid(1052), person_id: people[3].id, encounter_id: encounters[5].id, kind: 'Trabalhou', condition: 'Jovem', team: 'Canto', circle: null, role: 'Membro', patron: null },
    { id: uid(1053), person_id: people[0].id, encounter_id: encounters[5].id, kind: 'Trabalhou', condition: 'Casal', team: 'Palestra', circle: null, role: 'Palestrante Casal', patron: null },
    { id: uid(1054), person_id: people[1].id, encounter_id: encounters[5].id, kind: 'Trabalhou', condition: 'Casal', team: 'Palestra', circle: null, role: 'Palestrante Casal', patron: null },
  ];

  const mandates: Mandate[] = [
    {
      id: uid(3001),
      person_id: people[0].id,
      encounter_id: encounters[0].id,
      body: 'Equipe Dirigente Paroquial',
      role: 'Coordenadora Geral Jovem',
      condition: 'Jovem',
      start_year: 2022,
      end_year: 2023,
      record_type: 'Coordenação Paroquial',
      notes: 'Coordenação paroquial do movimento jovem'
    },
    {
      id: uid(3002),
      person_id: people[0].id,
      encounter_id: encounters[3].id,
      body: 'Conselho Paroquial do Segue-me',
      role: 'Casal Apoio e Formação',
      condition: 'Casal',
      start_year: 2024,
      end_year: 2026,
      record_type: 'Conselho de Casais',
      notes: 'Atuação pastoral em casal com Miguel de Oliveira'
    },
    {
      id: uid(3003),
      person_id: people[1].id,
      encounter_id: encounters[3].id,
      body: 'Conselho Paroquial do Segue-me',
      role: 'Casal Apoio e Formação',
      condition: 'Casal',
      start_year: 2024,
      end_year: 2026,
      record_type: 'Conselho de Casais',
      notes: 'Atuação pastoral em casal com Ana Clara de Almeida'
    }
  ];

  const couples: DemoCouple[] = [
    {
      id: uid(4001),
      legacy_id: 'CASAL-DEMO-001',
      person_1_id: people[0].id,
      person_2_id: people[1].id,
      start_text: 'Matrimônio em 2024',
      notes: 'Casal atuante na Paróquia São Francisco de Assis'
    },
    {
      id: uid(4002),
      legacy_id: 'CASAL-DEMO-002',
      person_1_id: people[6].id,
      person_2_id: people[7].id,
      start_text: 'Casados há 15 anos',
      notes: 'Tios de círculo da Paróquia São Francisco de Assis'
    },
    {
      id: uid(4003),
      legacy_id: 'CASAL-DEMO-003',
      person_1_id: people[18].id,
      person_2_id: people[19].id,
      start_text: 'Casados há 8 anos',
      notes: 'Casal acolhida na Paróquia São Francisco de Assis'
    }
  ];

  const now=new Date().toISOString();
  const reviews:ReviewItem[]=[{id:uid(2000),kind:'duplicate',person_id:people[0].id,related_person_id:people[16].id,title:'Dois cadastros podem ser da mesma pessoa',proposed_changes:{},evidence:{motivo:'Nome abreviado semelhante. É necessária confirmação humana.',origem:'Exemplo fictício de revisão'},status:'pending',created_at:now,version:1},{id:uid(2001),kind:'correction',person_id:people[2].id,title:'Atualização de contato',proposed_changes:{email:'beatriz.atualizada@example.invalid'},evidence:{reason:'Novo contato informado pela participante fictícia.'},status:'pending',created_at:now,version:1},{id:uid(2002),kind:'identity',person_id:null,title:'Solicitação de acesso ao histórico',proposed_changes:{name:'Helena Costa',context:'Vivenciou no encontro de demonstração de 2023.'},evidence:{},status:'pending',created_at:now,version:1}];
  return {people,encounters,participations,reviews,imports:[],audit:[],mandates,couples};
}
const demoPath=path.join(process.cwd(),'.local','demo-state.json');
let queue:Promise<unknown>=Promise.resolve();
export async function readDemo():Promise<DemoState>{
  if(!isDemoMode())throw new Error('DEMO_DISABLED');
  try{return JSON.parse(await readFile(demoPath,'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error; return initialDemo();}
}
export async function mutateDemo<T>(fn:(state:DemoState)=>T):Promise<T>{
  if(!isDemoMode())throw new Error('DEMO_DISABLED');
  const run=queue.then(async()=>{const state=await readDemo();const result=fn(state);await mkdir(path.dirname(demoPath),{recursive:true});const tmp=`${demoPath}.${randomUUID()}.tmp`;await writeFile(tmp,JSON.stringify(state),{mode:0o600});await rename(tmp,demoPath);return result;});
  queue=run.catch(()=>{});return run;
}
export function hydrateParticipation(p:Participation,state:DemoState){return {...p,encounter:state.encounters.find(e=>e.id===p.encounter_id),person:state.people.find(pe=>pe.id===p.person_id)};}
export function hydrateReview(r:ReviewItem,state:DemoState){return {...r,person:state.people.find(p=>p.id===r.person_id),related_person:state.people.find(p=>p.id===r.related_person_id)};}
