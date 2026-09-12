import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarBlank, HandHeart, MapPin, UsersThree, User, IdentificationCard } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getEncounter, getParticipations } from '@/lib/data';
import { Avatar, Badge, PageHeading } from '@/components/ui';
import { number } from '@/lib/format';
import { EncounterDetailView } from '@/components/encounter-detail-view';
import { isMandateRecord } from '@/lib/encounter-config';

interface EncounterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EncounterDetailPage({ params }: EncounterDetailPageProps) {
  await requireViewer(['reviewer', 'admin']);
  const { id } = await params;

  const [encounter, participations] = await Promise.all([
    getEncounter(id),
    getParticipations(undefined, id),
  ]);

  if (!encounter) {
    notFound();
  }

  const vivenciantes = participations.filter((p) => p.kind === 'Vivenciou');
  // Mandatos vigentes (Conselho Diocesano e Equipe Dirigente) separados de trabalho em equipe
  const liderancaMandato = participations.filter((p) => isMandateRecord(p));
  const trabalhadores = participations.filter((p) => p.kind === 'Trabalhou' && !isMandateRecord(p));

  // Agrupamento de voluntários operacionais por equipe
  const equipesMap = new Map<string, typeof participations>();
  for (const part of trabalhadores) {
    const equipe = part.team || 'Geral';
    if (!equipesMap.has(equipe)) equipesMap.set(equipe, []);
    equipesMap.get(equipe)!.push(part);
  }

  // Agrupamento de vivenciantes por círculo
  const circulosMap = new Map<string, typeof participations>();
  for (const part of vivenciantes) {
    const circulo = part.circle || 'Sem círculo especificado';
    if (!circulosMap.has(circulo)) circulosMap.set(circulo, []);
    circulosMap.get(circulo)!.push(part);
  }

  return (
    <div className="page-enter">
      {/* Retorno */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/encontros" className="text-link" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Voltar para lista de encontros
        </Link>
      </div>

      {/* Cabeçalho */}
      <PageHeading
        eyebrow={`DOCUMENTAÇÃO HISTÓRICA · ${encounter.year ?? 'ANO NÃO INFORMADO'}`}
        title={encounter.name || `${encounter.edition} Encontro Segue-me`}
        description={`${encounter.parish || 'Paróquia'} ${encounter.city ? `· ${encounter.city}` : ''} ${encounter.date_text ? `· Realizado em ${encounter.date_text}` : ''}`}
        actions={
          <span className="badge badge-green" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
            {encounter.extraction_status || 'Documentado'}
          </span>
        }
      />

      {/* Métricas do Encontro */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card stat-primary">
          <div className="stat-top">
            <span>Total de Participantes</span>
            <UsersThree size={20} />
          </div>
          <strong className="stat-number">{number(participations.length)}</strong>
          <div className="stat-bottom">
            <span>Cadastros documentados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Vivenciaram</span>
            <IdentificationCard size={20} />
          </div>
          <strong className="stat-number">{number(vivenciantes.length)}</strong>
          <div className="stat-bottom">
            <span>{circulosMap.size} círculos formados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Equipes de Serviço</span>
            <HandHeart size={20} />
          </div>
          <strong className="stat-number">{number(trabalhadores.length)}</strong>
          <div className="stat-bottom">
            <span>{equipesMap.size} equipes voluntárias</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Mandatos Vigentes</span>
            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
          </div>
          <strong className="stat-number" style={{ color: '#92400e' }}>
            {number(liderancaMandato.length)}
          </strong>
          <div className="stat-bottom">
            <span>Conselho & Equipe Dirigente</span>
          </div>
        </div>
      </div>

      {/* Conteúdo: Vivenciantes, Equipes e Mandatos em Menus Suspensos / Acordeom */}
      <EncounterDetailView
        vivenciantes={vivenciantes}
        trabalhadores={trabalhadores}
        liderancaMandato={liderancaMandato}
      />
    </div>
  );
}
