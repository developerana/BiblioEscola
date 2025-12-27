import { Menu, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileSidebar } from './MobileSidebar';

interface MobileHeaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileHeader({ open, onOpenChange }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4 lg:hidden">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
          <MobileSidebar onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
      
      <div className="flex items-center gap-3 ml-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Library className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-base font-semibold text-sidebar-foreground">BiblioEscola</h1>
        </div>
      </div>
    </header>
  );
}
