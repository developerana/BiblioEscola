import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'disponivel' | 'emprestado' | 'atrasado' | 'devolvido';
  className?: string;
}

const statusConfig = {
  disponivel: {
    label: 'Disponível',
    className: 'bg-success/10 text-success border-success/20',
  },
  emprestado: {
    label: 'Emprestado',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  atrasado: {
    label: 'Atrasado',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  devolvido: {
    label: 'Devolvido',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
