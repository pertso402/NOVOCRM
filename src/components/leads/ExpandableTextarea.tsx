import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ExpandableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  minHeight?: string;
}

export function ExpandableTextarea({
  value,
  onChange,
  placeholder,
  label = 'Observação',
  className,
  minHeight = 'min-h-[80px]',
}: ExpandableTextareaProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(minHeight, 'pr-10', className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1.5 right-1.5 h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
          title="Expandir"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {label}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-h-[400px] text-base leading-relaxed resize-none"
            autoFocus
          />
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              {value.length} caracteres
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setExpanded(false)}
              className="gap-2"
            >
              <Minimize2 className="w-4 h-4" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
