import { requireViewer } from '@/lib/auth';
import { getMandates } from '@/lib/data';
import { MandatesView } from '@/components/mandates-view';

export default async function MandatosPage() {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const result = await getMandates({}, 1, 2000);

  return <MandatesView initialMandates={result.items} viewer={viewer} />;
}
