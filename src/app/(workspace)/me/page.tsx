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
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Card de Solicitação de Vínculo */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">ANÁLISE DE CADASTRO</span>
                <h2>Autorização e confirmação de participação</h2>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Ao criar seu cadastro, a solicitação passa por uma análise pela nossa equipe para autorizar e confirmar que de fato você já vivenciou o Segue-me. 
              Informe seu nome, paróquia e detalhes do encontro para que possamos validar seus registros na base.
            </p>

            <IdentityRequestForm />
          </div>

          {/* Card Informativo sobre Privacidade */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="panel" style={{ background: 'var(--bg-canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldCheck size={24} color="var(--brand-primary)" />
                <strong style={{ fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
                  Análise Cadastral pela Equipe
                </strong>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                O sistema tem o objetivo de documentar e mapear com precisão a base de todos que já fizeram o encontro nas paróquias da diocese.
                A validação humana da equipe confirma que você de fato vivenciou o Segue-me antes de autorizar o acesso à sua conta.
              </p>
            </div>

            {requests && requests.length > 0 && (
              <div className="panel">
                <strong style={{ display: 'block', fontSize: '0.86rem', marginBottom: '12px' }}>
                  Suas Solicitações Anteriores
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {requests.map((r) => (
                    <div key={r.id} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.title}</span>
                        <Badge status={r.status} />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
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

