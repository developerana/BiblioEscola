import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 sm:gap-4">{children}</div>}
    </div>
  );
}
