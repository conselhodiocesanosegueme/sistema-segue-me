import Link from 'next/link';
import { ArrowsClockwise, CheckCircle, FileText, ShieldCheck, UsersThree, WarningCircle, Funnel } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getReviews } from '@/lib/data';
import { Badge, PageHeading } from '@/components/ui';
import { date, readable, fieldName } from '@/lib/format';
import { ReviewActions } from '@/components/review-actions';

interface PendenciasPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const kindLabels: Record<string, string> = {
  correction: 'Correção de cadastro',
  duplicate: 'Possível duplicidade',
  identity: 'Validação de cadastro',
  import_conflict: 'Divergência na importação',
};

export default async function PendenciasPage({ searchParams }: PendenciasPageProps) {
  await requireViewer(['reviewer', 'admin']);
  const params = await searchParams;
  const statusFilter = params.status || 'pending';

  const reviews = await getReviews(statusFilter);

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="ANÁLISE E CONFIRMAÇÃO"
        title="Fila de Validação e Análise Cadastral"
        description="Analise as solicitações de cadastro para confirmar que a pessoa já vivenciou o Segue-me, aprove correções e resolva duplicidades com justificativa registrada."
      />

      {/* Abas de Status */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-base)', paddingBottom: '12px' }}>
        <Link
          href="/pendencias?status=pending"
          className={`button ${statusFilter === 'pending' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.84rem' }}
        >
          Aguardando análise ({reviews.filter(r => r.status === 'pending').length})
        </Link>
        <Link
          href="/pendencias?status=approved"
          className={`button ${statusFilter === 'approved' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.84rem' }}
        >
          Aprovadas
        </Link>
        <Link
          href="/pendencias?status=rejected"
          className={`button ${statusFilter === 'rejected' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.84rem' }}
        >
          Não aprovadas
        </Link>
        <Link
          href="/pendencias?status=all"
          className={`button ${statusFilter === 'all' ? 'button-primary' : 'button-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.84rem' }}
        >
          Todas
        </Link>
      </div>

      {/* Lista de Itens */}
      {reviews.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle size={44} weight="duotone" color="var(--tone-green)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '6px' }}>
            Nenhuma pendência neste status
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Tudo em dia. Quando novos participantes solicitarem correções ou o importador detectar duplicidades, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map((item) => (
            <div key={item.id} className="panel" style={{ borderLeft: `4px solid ${item.kind === 'duplicate' ? '#f59e0b' : item.kind === 'correction' ? '#2563eb' : '#0f4c3a'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="row-overline" style={{ color: 'var(--brand-primary)' }}>
                      {kindLabels[item.kind] || item.kind}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>·</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                      Criada em {date(item.created_at)}
                    </span>
                    <Badge status={item.status} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>
                </div>

                <ReviewActions item={item} />
              </div>

              {/* Informações da Pessoa envolvida */}
              {item.person && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <UsersThree size={18} color="var(--brand-primary)" />
                  <span style={{ fontSize: '0.84rem' }}>
                    Pessoa cadastrada:{' '}
                    <Link href={`/pessoas/${item.person.id}`} className="text-link" style={{ fontWeight: 600 }}>
                      {item.person.name} ({item.person.legacy_id || 'sem código'})
                    </Link>
                  </span>
                  {item.related_person && (
                    <span style={{ fontSize: '0.84rem', marginLeft: '12px' }}>
                      Pessoa duplicada apontada:{' '}
                      <Link href={`/pessoas/${item.related_person.id}`} className="text-link" style={{ fontWeight: 600 }}>
                        {item.related_person.name} ({item.related_person.legacy_id || 'sem código'})
                      </Link>
                    </span>
                  )}
                </div>
              )}

              {/* Comparação Lado a Lado ou Alterações Propostas */}
              {Object.keys(item.proposed_changes || {}).length > 0 && (
                <div style={{ marginBottom: '16px', background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <strong style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Alterações Propostas
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {Object.entries(item.proposed_changes).map(([campo, valor]) => (
                      <div key={campo} style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          {fieldName[campo] || campo}
                        </span>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--brand-primary)' }}>
                          {readable(valor)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidências e Justificativas anexas */}
              {Object.keys(item.evidence || {}).length > 0 && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  {item.evidence?.context ? (
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '4px' }}>
                        Histórico e dados informados pelo participante:
                      </strong>
                      <div style={{ whiteSpace: 'pre-line', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        {String(item.evidence.context)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong>Evidência informada: </strong>
                      {Object.entries(item.evidence).map(([k, v]) => `${fieldName[k] || k}: ${readable(v)}`).join(' · ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
