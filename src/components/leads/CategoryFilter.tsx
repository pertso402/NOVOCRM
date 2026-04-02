import { Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIA_LEAD_CONFIG, CategoriaLead } from '@/types/pipeline';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const CATEGORY_COLORS: Record<CategoriaLead, string> = {
  lead_a: 'text-green-500',
  lead_b: 'text-red-500',
  lead_c: 'text-yellow-500',
};

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-secondary/50">
        <Star className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas categorias</SelectItem>
        {(Object.keys(CATEGORIA_LEAD_CONFIG) as CategoriaLead[]).map((key) => (
          <SelectItem key={key} value={key}>
            <span className={CATEGORY_COLORS[key]}>
              {CATEGORIA_LEAD_CONFIG[key].label}
            </span>
          </SelectItem>
        ))}
        <SelectItem value="none">Sem categoria</SelectItem>
      </SelectContent>
    </Select>
  );
}
