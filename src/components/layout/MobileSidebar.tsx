import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  BookOpen, 
  BookPlus, 
  Undo2, 
  History, 
  LogOut,
  Library,
  Sun,
  Moon,
  Users,
  Settings,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/livros', icon: BookOpen, label: 'Livros' },
  { to: '/emprestimos', icon: BookPlus, label: 'Empréstimos' },
  { to: '/devolucoes', icon: Undo2, label: 'Devoluções' },
  { to: '/historico', icon: History, label: 'Histórico' },
];

interface MobileSidebarProps {
  onNavigate?: () => void;
}

export function MobileSidebar({ onNavigate }: MobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isAdmin, mustChangePassword, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Library className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold">BiblioEscola</h1>
          <p className="text-xs text-sidebar-foreground/70">Profª Laís Peralta Carneiro</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const isBlocked = mustChangePassword;
          
          if (isBlocked) {
            return (
              <div
                key={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 cursor-not-allowed opacity-50',
                  'text-sidebar-foreground/50'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                <Lock className="h-3 w-3 ml-auto" />
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if ('vibrate' in navigator) navigator.vibrate(5);
                handleNavClick();
              }}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] touch-manipulation',
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground active:bg-sidebar-accent/70'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-colors duration-200',
                isActive ? 'text-sidebar-primary' : ''
              )} />
              {item.label}
            </NavLink>
          );
        })}

        {/* Admin-only: Users link */}
        {isAdmin && (
          mustChangePassword ? (
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 cursor-not-allowed opacity-50',
                'text-sidebar-foreground/50'
              )}
            >
              <Users className="h-5 w-5" />
              Usuários
              <Lock className="h-3 w-3 ml-auto" />
            </div>
          ) : (
            <NavLink
              to="/usuarios"
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                location.pathname === '/usuarios'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Users className={cn(
                'h-5 w-5 transition-colors',
                location.pathname === '/usuarios' ? 'text-sidebar-primary' : ''
              )} />
              Usuários
            </NavLink>
          )
        )}

        {/* Settings link - always accessible */}
        <NavLink
          to="/configuracoes"
          onClick={handleNavClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
            location.pathname === '/configuracoes'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            mustChangePassword && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-sidebar'
          )}
        >
          <Settings className={cn(
            'h-5 w-5 transition-colors',
            location.pathname === '/configuracoes' ? 'text-sidebar-primary' : '',
            mustChangePassword && 'text-amber-500'
          )} />
          Configurações
          {mustChangePassword && (
            <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
}
