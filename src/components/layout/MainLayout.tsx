import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { PasswordChangeRedirect } from '@/components/auth/PasswordChangeRedirect';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <PasswordChangeRedirect />
      
      {/* Mobile Header */}
      <MobileHeader open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="lg:pl-64">
        <div 
          key={location.pathname}
          className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-22 lg:p-8 lg:pt-8 page-transition safe-area-bottom"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
