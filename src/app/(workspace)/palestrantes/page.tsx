import { requireViewer } from '@/lib/auth';
import { getSpeakersCatalog } from '@/lib/data';
import { SpeakersView } from '@/components/speakers-view';

export default async function PalestrantesPage() {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const speakers = await getSpeakersCatalog();

  return <SpeakersView initialSpeakers={speakers} viewer={viewer} />;
}
