import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarBlank, HandHeart, MapPin, UsersThree, User, IdentificationCard, MicrophoneStage } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getEncounter, getParticipations } from '@/lib/data';
import { Avatar, Badge, PageHeading } from '@/components/ui';
import { number } from '@/lib/format';
import { EncounterDetailView } from '@/components/encounter-detail-view';
import { isMandateRecord, normalizeMandateBody } from '@/lib/encounter-config';

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
  const palestrantes = participations.filter(
    (p) => p.kind === 'Palestrou' || (p.team || '').toLowerCase() === 'palestrantes'
  );
  // Mandatos vigentes separados em Equipe Dirigente e Conselho (Diocesano / Setorial)
  const liderancaMandato = participations.filter((p) => isMandateRecord(p));
  const equipeDirigente = liderancaMandato.filter((p) => {
    const meta = normalizeMandateBody(p.team, p.role);
    if (meta) return meta.category === 'equipe_dirigente';
    const t = (p.team || '').toLowerCase();
    const r = (p.role || '').toLowerCase();
    return !t.includes('conselho') && !r.includes('conselho') && !t.includes('setor') && !r.includes('setorial');
  });
  const conselho = liderancaMandato.filter((p) => !equipeDirigente.includes(p));

  const trabalhadores = participations.filter(
    (p) => p.kind === 'Trabalhou' && !isMandateRecord(p) && !palestrantes.includes(p)
  );

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
            <span>Vivenciou</span>
            <IdentificationCard size={20} />
          </div>
          <strong className="stat-number">{number(vivenciantes.length)}</strong>
          <div className="stat-bottom">
            <span>{circulosMap.size} círculos formados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Trabalhou</span>
            <HandHeart size={20} />
          </div>
          <strong className="stat-number">{number(trabalhadores.length)}</strong>
          <div className="stat-bottom">
            <span>{equipesMap.size} equipes voluntárias</span>
          </div>
        </div>

        {equipeDirigente.length > 0 && (
          <div className="stat-card">
            <div className="stat-top">
              <span>Equipe Dirigente</span>
              <span style={{ fontSize: '1.2rem' }}>⛪</span>
            </div>
            <strong className="stat-number" style={{ color: '#15803d' }}>
              {number(equipeDirigente.length)}
            </strong>
            <div className="stat-bottom">
              <span>Mandato Paroquial</span>
            </div>
          </div>
        )}

        {conselho.length > 0 && (
          <div className="stat-card">
            <div className="stat-top">
              <span>Conselho</span>
              <span style={{ fontSize: '1.2rem' }}>🏛️</span>
            </div>
            <strong className="stat-number" style={{ color: '#92400e' }}>
              {number(conselho.length)}
            </strong>
            <div className="stat-bottom">
              <span>Diocesano & Setorial</span>
            </div>
          </div>
        )}

        {palestrantes.length > 0 && (
          <div className="stat-card">
            <div className="stat-top">
              <span>Palestrantes</span>
              <MicrophoneStage size={20} color="#0284c7" />
            </div>
            <strong className="stat-number" style={{ color: '#0369a1' }}>
              {number(palestrantes.length)}
            </strong>
            <div className="stat-bottom">
              <span>Palestras ministradas</span>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo: Vivenciou, Trabalhou, Equipe Dirigente, Conselho e Palestrantes */}
      <EncounterDetailView
        vivenciantes={vivenciantes}
        trabalhadores={trabalhadores}
        equipeDirigente={equipeDirigente}
        conselho={conselho}
        palestrantes={palestrantes}
      />
    </div>
  );
}
