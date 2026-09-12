import { requireViewer } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireViewer();
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
