import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip } from 'recharts';

interface FunnelDataItem {
  name: string;
  value: number;
  fill: string;
}

interface ConversionFunnelProps {
  data: FunnelDataItem[];
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Funnel
              dataKey="value"
              data={data}
              isAnimationActive
            >
              <LabelList
                position="right"
                fill="hsl(var(--foreground))"
                stroke="none"
                dataKey="name"
                fontSize={12}
              />
              <LabelList
                position="center"
                fill="hsl(var(--foreground))"
                stroke="none"
                dataKey="value"
                fontSize={14}
                fontWeight={600}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
