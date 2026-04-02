import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PipelineManager } from '@/components/pipelines/PipelineManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout 
      title="Configurações" 
      subtitle="Gerencie pipelines e preferências"
    >
      <Tabs defaultValue="pipelines" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipelines" className="gap-2">
            <Layers className="w-4 h-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-6">
          <div className="glass-card p-6">
            <PipelineManager />
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
            <p className="text-muted-foreground">
              Mais configurações serão adicionadas em breve.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}