import {
  ArrowsClockwise,
  CheckCircle,
  Database,
  Table,
  WarningCircle,
  ShieldCheck,
  FileXls,
  UsersThree,
  CalendarBlank,
  Heart,
  Scroll,
  TerminalWindow,
} from '@phosphor-icons/react/dist/ssr';
import { requireViewer } from '@/lib/auth';
import { getImports, getDatabaseMetrics } from '@/lib/data';
import { Badge, PageHeading } from '@/components/ui';
import { date, number } from '@/lib/format';
import { ImportActions } from '@/components/import-actions';

export default async function ImportacoesPage() {
  await requireViewer(['reviewer', 'admin']);
  const [imports, metrics] = await Promise.all([
    getImports(),
    getDatabaseMetrics(),
  ]);

  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="TRANSIÇÃO E SINCRONIZAÇÃO"
        title="Importações da Planilha Oficial"
        description="Acompanhe o estado da base consolidada do Segue-me, valide o mapeamento dos identificadores (IDs) e sincronize os dados oficiais."
        actions={<ImportActions />}
      />

      {/* Métricas Atuais da Base no Supabase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid var(--brand-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-subtle)', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            <UsersThree size={18} color="var(--brand-primary)" />
            PESSOAS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            {number(metrics.people)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Identificadores PES-XXXXX</span>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-subtle)', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            <CalendarBlank size={18} color="#2563eb" />
            ENCONTROS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            {number(metrics.encounters)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>1ª, 2ª Etapa e Mariano</span>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #db2777' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-subtle)', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Heart size={18} color="#db2777" />
            CASAIS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            {number(metrics.couples)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Vínculos conjugais ativos</span>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-subtle)', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Database size={18} color="#059669" />
            PARTICIPAÇÕES
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            {number(metrics.participations)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Vivências e trabalhos</span>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-subtle)', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Scroll size={18} color="#d97706" />
            MANDATOS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            {number(metrics.mandates)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Coordenações e conselho</span>
        </div>
      </div>

      {/* GUIA DE ORGANIZAÇÃO DOS IDENTIFICADORES (IDs) E IMPORTAÇÃO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-base)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
            <FileXls size={22} color="var(--brand-primary)" weight="fill" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-main)' }}>
              Padrão Oficial de Identificadores (IDs) na Planilha
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
            <div style={{ padding: '10px 12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', marginBottom: '2px' }}>
                1. Aba "Pessoas" → Coluna [ID da pessoa]
              </strong>
              Formato: <code>PES-00001</code> até <code>PES-99999</code>. O ID é único de cada indivíduo. Alterações de telefone, e-mail ou nascimento preservam o mesmo ID e atualizam o cadastro.
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: '#2563eb', display: 'block', marginBottom: '2px' }}>
                2. Aba "Encontros" → Coluna [ID do encontro]
              </strong>
              Formato padrão: <code>ANO-SIGLA_PARÓQUIA-CIDADE-EDIÇÃO</code> (Ex: <code>2026-SFA-SFG-15</code>). Não deixe em branco.
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: '#db2777', display: 'block', marginBottom: '2px' }}>
                3. Aba "Casais" → [ID do casal], [ID pessoa 1], [ID pessoa 2]
              </strong>
              Formato: <code>CAS-00001</code>. Os campos de pessoas 1 e 2 devem conter os códigos <code>PES-XXXXX</code> existentes em Pessoas.
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: '#059669', display: 'block', marginBottom: '2px' }}>
                4. Abas "Participações" e "Mandatos"
              </strong>
              Cada linha vincula o <code>ID da pessoa</code> ao <code>ID do encontro</code>. O importador inteligente não duplica registros já existentes.
            </div>
          </div>
        </div>

        <div className="panel" style={{ background: '#f8fafc', border: '1px solid var(--border-base)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <TerminalWindow size={22} color="var(--brand-primary)" weight="bold" />
              <h3 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                Como Executar a Sincronização
              </h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 14px' }}>
              Após salvar sua planilha <code>.xlsx</code> na raiz do projeto, você pode validar todos os IDs e executar a atualização:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Passo 1: Simulação & Validação (Sem gravar)
                </span>
                <pre style={{ margin: 0, padding: '8px 12px', background: '#0f172a', color: '#38bdf8', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
npm run import:check
                </pre>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Passo 2: Atualização Oficial no Supabase
                </span>
                <pre style={{ margin: 0, padding: '8px 12px', background: '#0f172a', color: '#4ade80', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
npm run import:run
                </pre>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '10px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: '0.76rem', color: '#1e40af', lineHeight: '1.4', display: 'block' }}>
              💡 <strong>Idempotente e Seguro:</strong> O processo pode ser executado quantas vezes for necessário. Nenhuma participação é duplicada e correções manuais são mantidas.
            </span>
          </div>
        </div>
      </div>

      {/* Nota Informativa sobre Regras de Importação */}
      <div className="panel" style={{ background: 'linear-gradient(to right, #f8fbf9, #ffffff)', border: '1px solid var(--brand-border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <ShieldCheck size={26} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--brand-primary)', display: 'block', marginBottom: '4px' }}>
              Garantias de Proteção da Base Histórica
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
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
