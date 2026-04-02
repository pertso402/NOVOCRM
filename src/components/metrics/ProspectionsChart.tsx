import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProspectionsChartProps {
  dailyData: { date: string; count: number }[];
  weeklyData: { week: string; count: number }[];
  monthlyData: { month: string; count: number }[];
}

const chartConfig = {
  grid: { stroke: 'hsl(var(--border))' },
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      color: 'hsl(var(--foreground))',
    },
  },
  axis: {
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
  },
};

export function ProspectionsChart({ dailyData, weeklyData, monthlyData }: ProspectionsChartProps) {
  return (
    <div className="glass-card p-6">
      <Tabs defaultValue="daily">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Prospecções por Período</h3>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid {...chartConfig.grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" {...chartConfig.axis} />
              <YAxis {...chartConfig.axis} />
              <Tooltip {...chartConfig.tooltip} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="weekly" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid {...chartConfig.grid} strokeDasharray="3 3" />
              <XAxis dataKey="week" {...chartConfig.axis} />
              <YAxis {...chartConfig.axis} />
              <Tooltip {...chartConfig.tooltip} />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="monthly" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid {...chartConfig.grid} strokeDasharray="3 3" />
              <XAxis dataKey="month" {...chartConfig.axis} />
              <YAxis {...chartConfig.axis} />
              <Tooltip {...chartConfig.tooltip} />
              <Bar
                dataKey="count"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
