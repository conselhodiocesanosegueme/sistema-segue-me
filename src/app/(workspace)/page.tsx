import { requireViewer } from '@/lib/auth';
import { getOverview, getPublicDiocesanStats } from '@/lib/data';
import { OverviewView } from '@/components/overview';
import { DiocesanPublicDashboard } from '@/components/diocesan-public-dashboard';

interface OverviewPageProps {
  searchParams: Promise<{ parish?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const viewer = await requireViewer();
  const params = await searchParams;

  // Se for usuário comum (participant), renderiza o Painel Geral Diocesano com dados agregados seguros
  if (viewer.role === 'participant') {
    const stats = await getPublicDiocesanStats();
    return <DiocesanPublicDashboard stats={stats} viewer={viewer} />;
  }

  // Se for reviewer (Equipe Dirigente Paroquial), restringe para sua paróquia
  // Se for admin (Coordenação Diocesana), permite selecionar qualquer paróquia ou ver o geral
  const parishScope = (viewer.role === 'reviewer' && viewer.parish)
    ? viewer.parish
    : (params.parish || null);

  const overview = await getOverview(parishScope);
  return <OverviewView data={overview} viewer={viewer} selectedParish={parishScope} />;
}
