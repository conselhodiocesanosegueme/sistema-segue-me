import Link from 'next/link';
import { CalendarBlank, FileText, Heart, MapPin, ShieldCheck, UserCheck, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getMyData } from '@/lib/data';
import { Avatar, Badge, PageHeading } from '@/components/ui';
import { date } from '@/lib/format';
import { PersonActions } from '@/components/person-actions';
import { IdentityRequestForm } from '@/components/identity-request-form';
import { MyHistoryView } from '@/components/my-history-view';

export default async function MeuHistoricoPage() {
  const viewer = await requireViewer();
  const { person, participations, requests, mandates, couple } = await getMyData();

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

              <IdentityRequestForm />
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
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Coluna Esquerda: Card de Dados do Participante & Solicitações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section className="panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <Avatar name={person.name} large />
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--text-main)' }}>
                    {person.name}
                  </h2>
                  <span className="badge badge-green" style={{ marginTop: '4px' }}>
                    Vínculo ativo
                  </span>
                </div>
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

