import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { PasswordChangeRedirect } from '@/components/auth/PasswordChangeRedirect';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PasswordChangeRedirect />
      <Sidebar />
      <main className="pl-64">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
