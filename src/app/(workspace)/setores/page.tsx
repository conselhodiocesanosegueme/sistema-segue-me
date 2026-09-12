import { requireViewer } from '@/lib/auth';
import { getSectorsSummary } from '@/lib/data';
import { SectorsView } from '@/components/sectors-view';

export default async function SetoresPage() {
  await requireViewer(['reviewer', 'admin']);
  const parishSummaries = await getSectorsSummary();
  return <SectorsView parishSummaries={parishSummaries} />;
}
