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
  Users
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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isAdmin, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
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
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-sidebar-primary' : ''
                )} />
                {item.label}
              </NavLink>
            );
          })}

          {/* Admin-only: Users link */}
          {isAdmin && (
            <NavLink
              to="/usuarios"
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
          )}
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
    </aside>
  );
}
