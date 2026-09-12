import { ArrowsClockwise, CheckCircle, Database, Table, WarningCircle, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getImports } from '@/lib/data';
import { Badge, PageHeading } from '@/components/ui';
import { date, number } from '@/lib/format';
import { ImportActions } from '@/components/import-actions';

export default async function ImportacoesPage() {
  await requireViewer(['reviewer', 'admin']);
  const imports = await getImports();

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="TRANSIÇÃO E SINCRONIZAÇÃO"
        title="Importações da Planilha Oficial"
        description="Acompanhe os lotes capturados do Google Sheets (14 abas oficiais), confira as divergências detectadas e valide os dados antes de gravar na base."
        actions={<ImportActions />}
      />

      {/* Nota Informativa sobre Regras de Importação */}
      <div className="panel" style={{ background: 'linear-gradient(to right, #f8fbf9, #ffffff)', border: '1px solid var(--brand-border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <ShieldCheck size={26} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--brand-primary)', display: 'block', marginBottom: '4px' }}>
              Garantias de Proteção da Base Histórica
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              • Reimportar a planilha nunca duplica fatos históricos já existentes.<br />
              • Correções aprovadas no app <strong>prevalecem</strong> sobre divergências da planilha.<br />
              • Nenhuma linha apagada na planilha excluirá automaticamente o histórico no banco de dados.<br />
              • Identificadores de pessoas e encontros aposentados por mesclagem continuam protegidos.
            </p>
          </div>
        </div>
      </div>

      {/* Histórico de Lotes */}
      <div className="table-card">
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
            Lotes de Importação Registrados
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
            Planilha: 1-Re_rW5KaumlGlDhp2CT_N6aaweTOZtBYk2a2NTujSo
          </span>
        </div>

        {imports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <Table size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '6px' }}>
              Nenhuma importação registrada no histórico local
            </h3>
            <p style={{ fontSize: '0.86rem' }}>
              Clique em "Buscar atualizações na planilha" para verificar novos dados.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lote / Data</th>
                  <th>Situação</th>
                  <th>Registros Processados</th>
                  <th>Inserções</th>
                  <th>Inalterados</th>
                  <th>Revisões Necessárias</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem' }}>
                          Lote {job.id.slice(0, 8)}…
                        </strong>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {date(job.created_at)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge status={job.status} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {job.summary?.rows ? number(Number(job.summary.rows)) : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--tone-green)', fontWeight: 600 }}>
                        {job.summary?.insert ? `+${number(Number(job.summary.insert))}` : '0'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {job.summary?.unchanged ? number(Number(job.summary.unchanged)) : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: job.summary?.review ? 'var(--tone-amber)' : 'var(--text-muted)', fontWeight: job.summary?.review ? 700 : 400 }}>
                        {job.summary?.review ? `${number(Number(job.summary.review))} pendências` : '0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
