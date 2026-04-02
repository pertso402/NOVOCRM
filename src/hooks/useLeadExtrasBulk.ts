import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoriaLead } from '@/types/pipeline';

export type LeadCategoryMap = Record<string, CategoriaLead | null>;

export function useLeadExtrasBulk(leadIds: string[]) {
  return useQuery({
    queryKey: ['lead-extras-bulk', leadIds.sort().join(',')],
    queryFn: async () => {
      if (leadIds.length === 0) return {} as LeadCategoryMap;

      const { data, error } = await supabase
        .from('lead_extras')
        .select('lead_id, categoria_lead')
        .in('lead_id', leadIds);

      if (error) throw error;

      const map: LeadCategoryMap = {};
      (data || []).forEach((row) => {
        map[row.lead_id] = row.categoria_lead as CategoriaLead | null;
      });
      return map;
    },
    enabled: leadIds.length > 0,
  });
}
