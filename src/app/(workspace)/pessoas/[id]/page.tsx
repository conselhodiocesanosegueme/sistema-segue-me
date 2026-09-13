import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarBlank,
  Heart,
  MapPin,
  MicrophoneStage,
  ShieldCheck,
  UsersThree,
  FileText,
  CheckCircle,
  HandHeart,
  SuitcaseSimple,
  Phone,
  WhatsappLogo,
  EnvelopeSimple,
  Church,
  Info
} from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getPerson, getParticipations, getPersonExtras } from '@/lib/data';
import { Avatar, Badge } from '@/components/ui';
import { PersonActions } from '@/components/person-actions';
import { SpouseCard } from '@/components/spouse-card';
import { PersonTimeline } from '@/components/person-timeline';
import { ManagePhotoModal } from '@/components/manage-photo-modal';
import { PersonTalksCard } from '@/components/person-talks-card';
import { isMandateRecord, getMandateStatus, getConditionMeta, normalizeMandateBody } from '@/lib/encounter-config';

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonPageProps) {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const { id } = await params;

  const [person, participations, extras] = await Promise.all([
    getPerson(id),
    getParticipations(id),
    getPersonExtras(id),
  ]);

  if (!person) {
    notFound();
  }

  const isStaff = viewer.role === 'admin' || viewer.role === 'reviewer';
  const primaryCouple = extras.couples && extras.couples.length > 0 ? extras.couples[0] : null;

  // 1. Vivência
  const vivenciouPart = participations.find(p => p.kind === 'Vivenciou');

  // 2. Trabalho Operacional em Equipes de Serviço (exclui mandatos de Equipe Dirigente e Conselho)
  const workedParticipations = participations.filter(p => p.kind === 'Trabalhou' && !isMandateRecord(p));
  const workedCount = workedParticipations.length;

  // 3. Mandatos Institucionais - Consolidação e Deduplicação Inteligente
  const combinedMandatesMap = new Map<string, any>();
  const isMarried = Boolean(primaryCouple);

  // Função para padronizar chave única de mandato e evitar duplicidades
  function getMandateDeduplicationKey(bodyNorm: string, roleRaw: string, startYear: number, parish?: string | null) {
    const roleLower = (roleRaw || '').toLowerCase().trim();
    let roleGroup = roleLower;

    if (roleLower.includes('setor')) {
      roleGroup = 'setorial';
    } else if (roleLower.includes('tesour') || roleLower.includes('auxiliar')) {
      roleGroup = 'tesoureiro_auxiliar';
    } else if (roleLower.includes('secretár') || roleLower.includes('secretar')) {
      roleGroup = 'secretario_auxiliar';
    } else if (roleLower.includes('coordenad')) {
      roleGroup = 'coordenador';
    } else if (roleLower.includes('fichas')) {
      roleGroup = 'fichas';
    } else if (roleLower.includes('finan')) {
      roleGroup = 'financas';
    } else if (roleLower.includes('montagem')) {
      roleGroup = 'montagem';
    } else if (roleLower.includes('palestra')) {
      roleGroup = 'palestra';
    } else if (roleLower.includes('pós-encontro') || roleLower.includes('pos-encontro')) {
      roleGroup = 'pos_encontro';
    }

    // Usa o ano real de início do mandato
    const yearKey = startYear;

    // Para Conselho Diocesano: é diocesano (não varia por paróquia)
    if (bodyNorm === 'Conselho Diocesano') {
      return `conselho-${roleGroup}-${yearKey}`;
    }

    // Para Coordenação Setorial: único por setor e ano
    if (bodyNorm.includes('Setorial')) {
      return `setorial-${roleGroup}-${yearKey}`;
    }

    // Para Equipe Dirigente: vinculado à paróquia onde serviu e ao ano
    const pClean = (parish || '').toLowerCase().replace(/par[oó]quia/g, '').trim().slice(0, 15);
    return `dirigente-${roleGroup}-${pClean}-${yearKey}`;
  }

  function addCandidate(
    rawBody?: string | null,
    rawRole?: string | null,
    rawCondition?: string | null,
    startYearRaw?: number | null,
    endYearRaw?: number | null,
    rawParish?: string | null,
    notes?: string | null
  ) {
    const roleLower = (rawRole || '').toLowerCase().trim();
    const bodyLower = (rawBody || '').toLowerCase().trim();

    // Descarta equipes operacionais de serviço (como faxina, gráfica, cozinha, etc.)
    const meta = normalizeMandateBody(rawBody, rawRole);
    if (!meta) return;

    // Se o papel ou órgão contém 'setor' ou 'setorial', é SEMPRE Coordenação Setorial
    const isSetorial = roleLower.includes('setor') || bodyLower.includes('setor');
    const isConselho = !isSetorial && (bodyLower.includes('conselho') || roleLower.includes('conselho') || roleLower.includes('tesour') || roleLower.includes('auxiliar'));
    const body = isSetorial ? 'Coordenação Setorial' : (isConselho ? 'Conselho Diocesano' : meta.normalizedBody);

    const startYear = startYearRaw || new Date().getFullYear();
    const endYear = endYearRaw || startYear + 1;

    let role = rawRole || 'Membro';
    let condition = rawCondition || 'Jovem';

    // Normalizações a partir de 2026 para Conselho Diocesano
    if (body === 'Conselho Diocesano' && startYear >= 2026) {
      if (roleLower.includes('tesour') || roleLower.includes('auxiliar')) {
        if (isMarried || condition === 'Casal' || roleLower.includes('casal')) {
          role = 'Casal Tesoureiro';
          condition = 'Casal';
        } else {
          role = 'Secretário';
          condition = 'Jovem';
        }
      }
    }

    // Regras de Condição: Casal vs Jovem
    if (role.toLowerCase().includes('casal')) {
      condition = 'Casal';
    } else if (role.toLowerCase().includes('jovem')) {
      condition = 'Jovem';
    } else if (isMarried && startYear >= 2024) {
      condition = 'Casal';
    }

    // Para Conselho Diocesano: âmbito é diocesano (não vincula a uma paróquia individual de encontro)
    const parish = body === 'Conselho Diocesano' ? null : (rawParish || (body.includes('Setorial') ? null : person?.parish));

    // Identifica setor para setoriais
    let sectorId: string | null = null;
    if (isSetorial) {
      const match = (bodyLower + ' ' + roleLower).match(/setor\s*([1-6])/i);
      if (match) sectorId = `Setor ${match[1]}`;
      else sectorId = 'Setor 3'; // Fallback setor canônico histórico se identificado
    }

    const key = getMandateDeduplicationKey(body, role, startYear, parish);

    if (combinedMandatesMap.has(key)) {
      const existing = combinedMandatesMap.get(key);
      if (!existing.parish && parish) existing.parish = parish;
      if (!existing.sectorId && sectorId) existing.sectorId = sectorId;
      if (condition === 'Casal') existing.condition = 'Casal';
      if (role === 'Casal Tesoureiro') existing.role = role;
      existing.end_year = Math.max(existing.end_year || 0, endYear);
      existing.status = getMandateStatus(existing.start_year, existing.end_year);
    } else {
      combinedMandatesMap.set(key, {
        id: `mandate-cons-${key}`,
        body,
        role,
        condition,
        start_year: startYear,
        end_year: endYear,
        parish,
        sectorId,
        notes: notes || null,
        status: getMandateStatus(startYear, endYear),
      });
    }
  }

  // 1. Processa registros de mandatos da tabela mandates
  (extras.mandates || []).forEach((m: any) => {
    addCandidate(m.body, m.role, m.condition, m.start_year, m.end_year, m.parish || m.encounter?.parish, m.notes);
  });

  // 2. Processa lideranças institucionais registradas nos quadrantes de encontros
  participations.filter(p => isMandateRecord(p)).forEach((p: any) => {
    addCandidate(p.team, p.role, p.condition, p.encounter?.year, (p.encounter?.year || 2026) + 1, p.encounter?.parish);
  });

  const allPersonMandates = Array.from(combinedMandatesMap.values()).sort((a, b) => (b.start_year || 0) - (a.start_year || 0));
  const mandatesCount = allPersonMandates.length;

  // Link do WhatsApp do titular
  const personWhatsapp = person.phone ? `https://wa.me/55${person.phone.replace(/\D/g, '')}` : null;

  return (
    <div className="page-enter">
      {/* Link de Retorno */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/pessoas" className="text-link" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Voltar para lista de pessoas
        </Link>
      </div>

      {/* Cabeçalho do Perfil */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Avatar name={person.name} src={person.photo_url} large />
            <ManagePhotoModal
              personId={person.id}
              personName={person.name}
              currentPhotoUrl={person.photo_url}
              compact
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="eyebrow" style={{ margin: 0, color: 'var(--brand-primary)' }}>
                CADASTRO NA BASE
              </span>
              {person.legacy_id && (
                <code
                  style={{
                    fontSize: '0.82rem',
                    background: 'var(--brand-light)',
                    color: 'var(--brand-primary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  {person.legacy_id}
                </code>
              )}
              <Badge status={person.identification_status} />
              {person.parish && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-canvas)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <Church size={13} /> {person.parish}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', margin: '0 0 4px 0', lineHeight: 1.15 }}>
              {person.name}
            </h1>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
              {participations.length} {participations.length === 1 ? 'participação registrada' : 'participações registradas no movimento'}
              {primaryCouple?.spouse ? ` · Casal com ${primaryCouple.spouse.name}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PersonActions
            person={person}
            viewer={viewer}
            currentCouple={primaryCouple}
          />
        </div>
      </div>

      {/* Strip de Indicadores Rápidos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* 1. Vivência */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: vivenciouPart ? '#dcfce7' : 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: vivenciouPart ? '#15803d' : 'var(--text-subtle)',
            }}
          >
            <HandHeart size={22} weight="fill" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Vivenciou o Segue-me
            </span>
            <strong style={{ fontSize: '0.92rem', color: vivenciouPart ? '#15803d' : 'var(--text-main)' }}>
              {vivenciouPart ? `Sim · ${vivenciouPart.encounter?.year || 'Histórico'}` : 'Não localizado'}
            </strong>
          </div>
        </div>

        {/* 2. Trabalhou */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: workedCount > 0 ? 'var(--brand-light)' : 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: workedCount > 0 ? 'var(--brand-primary)' : 'var(--text-subtle)',
            }}
          >
            <SuitcaseSimple size={22} weight="fill" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Encontros Trabalhados
            </span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {workedCount} {workedCount === 1 ? 'encontro' : 'encontros'}
            </strong>
          </div>
        </div>

        {/* 3. Mandatos / Equipe Dirigente */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: mandatesCount > 0 ? '#fef9c3' : 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mandatesCount > 0 ? '#854d0e' : 'var(--text-subtle)',
            }}
          >
            <ShieldCheck size={22} weight="fill" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Mandatos & Coordenação
            </span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {mandatesCount > 0 ? `${mandatesCount} registros` : 'Nenhum mandato'}
            </strong>
          </div>
        </div>

        {/* 4. Situação Matrimonial */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: primaryCouple?.spouse ? '#fef2f2' : 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: primaryCouple?.spouse ? '#dc2626' : 'var(--text-subtle)',
            }}
          >
            <Heart size={22} weight="fill" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Vínculo Matrimonial
            </span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {primaryCouple?.spouse ? 'Casal Seguimista' : 'Sem vínculo registrado'}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid Principal Harmônico (1 Coluna Lateral + 1 Coluna Linha do Tempo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Coluna Esquerda: Dados Pessoais, Família, Mandatos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Card de Dados Cadastrais e Contatos */}
          <section className="panel" style={{ padding: '20px' }}>
            <div className="panel-heading" style={{ marginBottom: '16px' }}>
              <div>
                <span className="section-kicker">CADASTRO</span>
                <h2 style={{ fontSize: '1.15rem', margin: '2px 0 0 0' }}>Informações Pessoais</h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              {/* Telefone */}
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Telefone / Contato
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{person.phone || 'Não informado'}</strong>
                  {personWhatsapp && (
                    <a
                      href={personWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.74rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#15803d',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <WhatsappLogo size={14} weight="fill" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* E-mail */}
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                  E-mail
                </span>
                <strong style={{ color: 'var(--text-main)', wordBreak: 'break-all' }}>
                  {person.email || 'Não informado'}
                </strong>
              </div>

              {/* Data de Nascimento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Nascimento
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{person.birth_date_text || 'Não informada'}</strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Sexo
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{person.sex || 'Não informado'}</strong>
                </div>
              </div>

              {/* Paróquia Atual / Referência */}
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Paróquia Atual / Referência
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                  <strong style={{ color: person.parish ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.92rem' }}>
                    {person.parish ? `⛪ ${person.parish}` : 'Nenhuma paróquia vinculada'}
                  </strong>
                </div>
              </div>

              {/* Observações Internas */}
              {isStaff && person.notes && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '10px 12px',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Observações Internas (Equipe)
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontStyle: 'italic', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                    {person.notes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Card de Família & Vínculo Matrimonial */}
          <SpouseCard
            person={person}
            couple={primaryCouple}
            isStaff={isStaff}
          />

          {/* 3. Mandatos e Coordenações (Conselho Diocesano, Setoriais e Equipes Dirigentes) */}
          <section className="panel" style={{ padding: '20px' }}>
            <div className="panel-heading" style={{ marginBottom: '14px' }}>
              <div>
                <span className="section-kicker">LIDERANÇA & GOVERNANÇA</span>
                <h2 style={{ fontSize: '1.15rem', margin: '2px 0 0 0' }}>
                  Mandatos no Movimento ({allPersonMandates.length})
                </h2>
              </div>
            </div>

            {allPersonMandates.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Nenhum mandato de Conselho Diocesano ou Equipe Dirigente registrado para esta pessoa.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allPersonMandates.map((m: any) => {
                  const condMeta = getConditionMeta(m.condition, m.role);
                  const st = m.status;

                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px 14px',
                        background: st.isActive ? '#fff' : 'var(--bg-canvas)',
                        border: '1px solid var(--border-base)',
                        borderLeft: st.isActive ? '3.5px solid #16a34a' : '3.5px solid #94a3b8',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      {/* Topo do Mandato com Órgão e Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {m.body}
                        </strong>

                        {/* Badge de Status Ativo vs Encerrado */}
                        <span
                          style={{
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: st.badgeBg,
                            color: st.badgeColor,
                            border: `1px solid ${st.badgeBorder}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {st.label}
                        </span>
                      </div>

                      {/* Cargo / Função e Condição */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                          {m.role}
                        </span>

                        {/* Badge de Condição Casal vs Jovem */}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '999px',
                            background: condMeta.badgeBg,
                            color: condMeta.badgeColor,
                            border: `1px solid ${condMeta.badgeBorder}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {condMeta.iconEmoji} {condMeta.conditionLabel}
                        </span>
                      </div>

                      {/* Período do Mandato e Âmbito / Paróquia do Mandato */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                        <span>
                          Período: <strong>{st.displayPeriod}</strong>
                        </span>

                        {m.body === 'Conselho Diocesano' ? (
                          <span
                            style={{
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              color: '#92400e',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Coordenação Executiva Diocesana"
                          >
                            🏛️ Âmbito Diocesano
                          </span>
                        ) : m.body.includes('Setorial') ? (
                          <span
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              color: '#1d4ed8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Coordenação Setorial"
                          >
                            🌐 {m.sectorId || 'Coordenação Setorial'}
                          </span>
                        ) : m.parish ? (
                          <span
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              color: '#1e293b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Paróquia onde este mandato foi exercido"
                          >
                            ⛪ {m.parish}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                            Paróquia não especificada
                          </span>
                        )}
                      </div>

                      {m.notes && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontStyle: 'italic', marginTop: '2px', borderTop: '1px solid var(--border-light)', paddingTop: '4px' }}>
                          {m.notes}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4. Palestras Ministradas */}
          <PersonTalksCard
            person={{
              id: person.id,
              name: person.name,
              legacy_id: person.legacy_id,
              parish: person.parish,
            }}
            talks={extras.talks || []}
            isStaff={isStaff}
          />
        </div>

        {/* Coluna Direita: Linha do Tempo e Trajetória Completa */}
        <PersonTimeline
          participations={participations}
          isStaff={isStaff}
        />
      </div>
    </div>
  );
}
