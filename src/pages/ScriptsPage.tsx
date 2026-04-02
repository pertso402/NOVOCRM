import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScriptsList } from '@/components/scripts/ScriptsList';

export default function ScriptsPage() {
  return (
    <DashboardLayout 
      title="Scripts"
      subtitle="Gerencie os scripts de prospecção"
    >
      <ScriptsList />
    </DashboardLayout>
  );
}
