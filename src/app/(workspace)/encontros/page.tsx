import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { getEncounters } from '@/lib/data';
import { PageHeading } from '@/components/ui';
import { EncountersHeaderActions } from '@/components/encounters-header-actions';
import { EncountersHierarchyView } from '@/components/encounters-hierarchy-view';

interface EncontrosPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EncontrosPage({ searchParams }: EncontrosPageProps) {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const rawParams = await searchParams;
  const isParochialReviewer = viewer.role === 'reviewer' && Boolean(viewer.parish);
  const parochialParish = viewer.parish || 'Paróquia São Francisco de Assis';

  // Carrega todos os encontros diocesanos
  const result = await getEncounters({ pageSize: '500' });

  return (
    <div className="page-enter">
      {isParochialReviewer ? (
        <PageHeading
          eyebrow={`ACESSO PAROQUIAL · ${parochialParish.toUpperCase()}`}
          title="Encontros da Paróquia"
          description={`Edições do Segue-me da ${parochialParish} e visão diocesana organizada por setores e paróquias.`}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link href="/" className="button button-secondary">
                Voltar ao Painel Paroquial
              </Link>
            </div>
          }
        />
      ) : (
        <PageHeading
          eyebrow="COORDENAÇÃO DIOCESANA · SETORES & PARÓQUIAS"
          title="Encontros Cadastrados"
          description="Navegação hierárquica por Setores e Paróquias da Diocese de Anápolis, com busca rápida por cidade, paróquia e edição."
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <EncountersHeaderActions />
            </div>
          }
        />
      )}

      {/* Visão Hierárquica por Setor -> Paróquias -> Encontros */}
      <EncountersHierarchyView
        encounters={result.items}
        viewer={viewer}
      />
    </div>
  );
}
