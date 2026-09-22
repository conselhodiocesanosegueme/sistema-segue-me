import Link from 'next/link';
import { CalendarBlank, FileText, Heart, MapPin, ShieldCheck, UserCheck, UsersThree, MicrophoneStage, Buildings } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getMyData } from '@/lib/data';
import { Avatar, Badge, PageHeading } from '@/components/ui';
import { date } from '@/lib/format';
import { PersonActions } from '@/components/person-actions';
import { IdentityRequestForm } from '@/components/identity-request-form';
import { MyHistoryView } from '@/components/my-history-view';
import { ManagePhotoModal } from '@/components/manage-photo-modal';
import { PersonSkillsCard } from '@/components/person-skills-card';
import { PersonTalksCard } from '@/components/person-talks-card';
import { PersonAvailabilityCard } from '@/components/person-availability-card';

export default async function MeuHistoricoPage() {
  const viewer = await requireViewer();
  const { person, participations, requests, mandates, couple } = await getMyData();

  const talks = participations?.filter(
    (p) => p.kind === 'Palestrou' || (p.team || '').toLowerCase() === 'palestrantes'
  ) || [];

  const parsedNotes = person ? (typeof person.notes === 'string' ? (() => { try { return JSON.parse(person.notes); } catch { return {}; } })() : (person.notes || {})) : {};
  const hasPalestraSkill = (person?.skills?.other_skills || []).some(s => s.toLowerCase().includes('palestr') || s.toLowerCase().includes('prega'));
  const isSpeakerPerson = Boolean(talks.length > 0 || parsedNotes.is_speaker || hasPalestraSkill);

  // Mandato Ativo Vigente (Ex: Casal Tesoureiro no Conselho Diocesano)
  // Regra de transição contínua:
  // Um mandato é considerado ativo/vigente se o ano de término (ou início) for >= ano atual de referência.
  // Quando um novo mandato for inserido para o próximo ano (ex: 2027 Casal Coordenador),
  // o mandato anterior (2026) automaticamente encerra seu ciclo no histórico como "Concluído"
  // e o novo mandato mais recente assume como o mandato ativo do participante!
  const currentYear = new Date().getFullYear();
  const sortedMandates = mandates && mandates.length > 0
    ? [...mandates].sort((a, b) => (b.start_year || b.end_year || 0) - (a.start_year || a.end_year || 0))
    : [];

  const activeMandate = sortedMandates.find((m) => {
    const end = m.end_year || m.start_year || 0;
    return end >= currentYear;
  }) || (sortedMandates.length > 0 && (sortedMandates[0].start_year || 0) >= currentYear ? sortedMandates[0] : null);

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="PORTAL DO PARTICIPANTE"
        title="Meu Histórico no Segue-me"
        description="Consulta de participações documentadas e validação cadastral da Diocese de Anápolis."
      />

      {!person ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Coluna da Esquerda: Formulário ou Status de Análise */}
          {requests && requests.some((r) => r.status === 'pending') ? (
            <div className="panel" style={{ border: '2px solid #fde68a', background: '#fffbeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                  <ShieldCheck size={28} weight="fill" />
                </div>
                <div>
                  <span className="section-kicker" style={{ color: '#b45309' }}>SOLICITAÇÃO EM ANDAMENTO</span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#78350f' }}>Aguardando Validação do Conselho</h2>
                </div>
              </div>

              <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.55', marginBottom: '16px' }}>
                Sua solicitação de histórico já foi recebida e está na fila de análise da Coordenação Diocesana do Segue-me.
              </p>

              <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '0.84rem', color: '#78350f', marginBottom: '8px' }}>
                  📋 O que está acontecendo agora?
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#78716c', lineHeight: '1.5', margin: '0 0 10px' }}>
                  1. O Conselho está conferindo os dados que você informou com os quadrantes originais arquivados.<br />
                  2. Assim que a conferência for concluída, <strong>você receberá uma notificação no seu e-mail ({viewer.email})</strong> avisando que o acesso ao seu histórico completo foi liberado.
                </p>
                <span className="badge badge-amber" style={{ fontWeight: 600 }}>
                  Status: Em análise nos quadrantes diocesanos
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#a16207', margin: 0 }}>
                Dúvidas? Entre em contato com o Conselho Diocesano pelo e-mail <strong>conselhodiocesano.segueme@gmail.com</strong>.
              </p>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">CADASTRO DE HISTÓRICO</span>
                  <h2>Vincular meu histórico no Segue-me</h2>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
                Para liberar a consulta ao seu histórico de encontros e equipes, informe com carinho os dados de quando você vivenciou ou trabalhou no Segue-me.
              </p>

              <IdentityRequestForm defaultName={viewer.name || ''} />
            </div>
          )}

          {/* Card Informativo sobre Privacidade e Histórico de Solicitações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="panel" style={{ background: 'var(--bg-canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldCheck size={24} color="var(--brand-primary)" />
                <strong style={{ fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
                  Segurança & Fidelidade Histórica
                </strong>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                O Sistema Segue-me da Diocese de Anápolis foi construído para preservar a história do movimento e honrar a dedicação de todos os jovens e casais.
                A validação garante que apenas pessoas que realmente vivenciaram o encontro tenham acesso às informações e históricos documentados.
              </p>
            </div>

            {requests && requests.length > 0 && (
              <div className="panel">
                <strong style={{ display: 'block', fontSize: '0.86rem', marginBottom: '12px' }}>
                  Suas Solicitações Anteriores
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {requests.map((r) => (
                    <div key={r.id} style={{ padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{r.title}</span>
                        <Badge status={r.status} />
                      </div>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                        Enviada em {date(r.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Coluna Esquerda: Card de Dados do Participante & Solicitações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section className="panel" style={{ padding: '22px 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ flexShrink: 0, width: '74px', height: '74px', borderRadius: '50%', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '3px solid #ffffff', outline: '2px solid var(--border-base)' }}>
                  <Avatar name={person.name} src={person.photo_url} large />
                </div>
                
                {/* Nome Completo do Participante */}
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    margin: '0 0 10px 0',
                    lineHeight: 1.3,
                    textAlign: 'center',
                    textWrap: 'balance',
                    width: '100%',
                    wordBreak: 'normal',
                  }}
                >
                  {person.name}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-green">
                    Vínculo ativo
                  </span>

                  {/* Mandato Ativo Vigente tem prioridade e substitui o badge genérico de Palestrante */}
                  {activeMandate ? (
                    <span
                      className="badge"
                      style={{
                        background: '#fdf4ff',
                        color: '#86198f',
                        border: '1px solid #f0abfc',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        fontSize: '0.74rem',
                      }}
                      title={`${activeMandate.body} · Mandato Vigente (${activeMandate.start_year || ''})`}
                    >
                      <Buildings size={13} weight="bold" /> {activeMandate.role}
                    </span>
                  ) : isSpeakerPerson ? (
                    <span
                      className="badge"
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        fontSize: '0.74rem',
                      }}
                    >
                      <MicrophoneStage size={13} weight="bold" /> Palestrante
                    </span>
                  ) : null}

                  {person.availability?.status === 'disponivel' && (
                    <span
                      className="badge badge-green"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Disponível para servir nos próximos encontros"
                    >
                      🟢 Disponível p/ Servir
                    </span>
                  )}
                  {person.availability?.second_stage_status === 'desejo_vivenciar' && (
                    <span
                      className="badge"
                      style={{
                        background: '#fef9c3',
                        color: '#854d0e',
                        border: '1px solid #fde047',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                      title="Interesse declarado em vivenciar a 2ª Etapa"
                    >
                      🌟 Deseja 2ª Etapa
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
                <ManagePhotoModal
                  personId={person.id}
                  personName={person.name}
                  currentPhotoUrl={person.photo_url}
                  buttonLabel={person.photo_url ? 'Alterar Minha Foto' : 'Adicionar Minha Foto'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    E-mail de Contato
                  </span>
                  <strong>{person.email || 'Não informado'}</strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Telefone
                  </span>
                  <strong>{person.phone || 'Não informado'}</strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Data de Nascimento
                  </span>
                  <strong>{person.birth_date_text || 'Não informada'}</strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Paróquia
                  </span>
                  <strong>{person.parish || 'Paróquia não informada'}</strong>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <PersonActions person={person} viewer={viewer} />
              </div>
            </section>

            {/* Prontidão Pastoral, Jornada da 2ª Etapa e Último Serviço */}
            <PersonAvailabilityCard
              personId={person.id}
              personName={person.name}
              initialAvailability={person.availability}
              canEdit={true}
            />

            {/* Talentos & Habilidades Musicais (Auto-declaração pelo participante) */}
            <PersonSkillsCard
              personId={person.id}
              personName={person.name}
              initialSkills={person.skills}
              canEdit={true}
            />

            {/* Palestras & Pregações Ministradas */}
            <PersonTalksCard
              person={person}
              talks={talks}
              canEdit={true}
            />

            {/* Minhas Solicitações de Correção */}
            {requests && requests.length > 0 && (
              <section className="panel">
                <span className="section-kicker">SOLICITAÇÕES</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '12px' }}>
                  Acompanhar Pedidos de Correção
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {requests.map((req) => (
                    <div key={req.id} style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.85rem' }}>{req.title}</strong>
                        <Badge status={req.status} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {date(req.created_at)}
                      </span>
                      {req.resolution && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          Retorno da equipe: "{req.resolution}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Coluna Direita: Trajetória Completa (Vivências, Trabalhou/Equipes, Mandatos, Casal) */}
          <MyHistoryView
            person={person}
            participations={participations}
            mandates={mandates}
            couple={couple}
          />
        </div>
      )}
    </div>
  );
}

