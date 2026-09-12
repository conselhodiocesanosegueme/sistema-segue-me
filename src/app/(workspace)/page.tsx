import { requireViewer } from '@/lib/auth';
import { getOverview } from '@/lib/data';
import { OverviewView } from '@/components/overview';

interface OverviewPageProps {
  searchParams: Promise<{ parish?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const params = await searchParams;

  // Se for reviewer (Equipe Dirigente Paroquial), restringe para sua paróquia
  // Se for admin (Coordenação Diocesana), permite selecionar qualquer paróquia ou ver o geral
  const parishScope = viewer.role === 'reviewer'
    ? (viewer.parish || 'Paróquia São Francisco de Assis')
    : (params.parish || null);

  const overview = await getOverview(parishScope);
  return <OverviewView data={overview} viewer={viewer} selectedParish={parishScope} />;
}
