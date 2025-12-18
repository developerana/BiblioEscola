import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BookPlus, 
  Undo2, 
  History, 
  LogOut,
  Library
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/livros', icon: BookOpen, label: 'Livros' },
  { to: '/alunos', icon: Users, label: 'Alunos' },
  { to: '/emprestimos', icon: BookPlus, label: 'Empréstimos' },
  { to: '/devolucoes', icon: Undo2, label: 'Devoluções' },
  { to: '/historico', icon: History, label: 'Histórico' },
];

export function Sidebar() {
  const location = useLocation();

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
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
