import { useState, useMemo } from 'react';
import { History as HistoryIcon, Filter, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLibrary } from '@/contexts/LibraryContext';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function History() {
  const { getLoanHistory, loading } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'emprestado' | 'devolvido' | 'atrasado'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const allLoans = getLoanHistory();
  const today = new Date();

  // Get unique users who created loans
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map<string, { id: string; name: string }>();
    allLoans.forEach(loan => {
      if (loan.created_by && loan.created_by_profile) {
        const displayName = loan.created_by_profile.name || loan.created_by_profile.email;
        usersMap.set(loan.created_by, { id: loan.created_by, name: displayName });
      }
    });
    return Array.from(usersMap.values());
  }, [allLoans]);

  const filteredLoans = allLoans.filter(loan => {
    const matchesSearch = 
      loan.book?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.student_class.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter by user
    if (userFilter !== 'all' && loan.created_by !== userFilter) return false;

    if (statusFilter === 'all') return true;

    const isOverdue = !loan.actual_return_date && isBefore(parseISO(loan.expected_return_date), today);
    
    if (statusFilter === 'atrasado') return isOverdue;
    if (statusFilter === 'devolvido') return !!loan.actual_return_date;
    if (statusFilter === 'emprestado') return !loan.actual_return_date && !isOverdue;

    return true;
  });

  const getStatus = (loan: typeof allLoans[0]) => {
    if (loan.actual_return_date) return 'devolvido';
    if (isBefore(parseISO(loan.expected_return_date), today)) return 'atrasado';
    return 'emprestado';
  };

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Histórico" description="Visualize o histórico completo de empréstimos" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="Histórico" description="Visualize o histórico completo de empréstimos" />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por título, aluno ou turma..."
          className="w-full sm:flex-1 sm:max-w-md"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="emprestado">Em dia</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="devolvido">Devolvidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            {uniqueUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* History Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <HistoryIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livro</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Empréstimo</TableHead>
                    <TableHead>Prev. Devolução</TableHead>
                    <TableHead>Devolução</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const status = getStatus(loan);
                    
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.book?.title || '-'}</p>
                            <p className="text-sm text-muted-foreground">{loan.book?.author}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{loan.student_name}</p>
                        </TableCell>
                        <TableCell>{loan.student_class}</TableCell>
                        <TableCell>
                          {format(parseISO(loan.loan_date), "dd 'de' MMM", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(loan.expected_return_date), "dd 'de' MMM", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {loan.actual_return_date 
                            ? format(parseISO(loan.actual_return_date), "dd 'de' MMM", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {loan.created_by_profile?.name || loan.created_by_profile?.email || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {allLoans.filter(l => !l.actual_return_date && !isBefore(parseISO(l.expected_return_date), today)).length}
            </p>
            <p className="text-sm text-muted-foreground">Em dia</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-destructive">
              {allLoans.filter(l => !l.actual_return_date && isBefore(parseISO(l.expected_return_date), today)).length}
            </p>
            <p className="text-sm text-muted-foreground">Atrasados</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-success">
              {allLoans.filter(l => l.actual_return_date).length}
            </p>
            <p className="text-sm text-muted-foreground">Devolvidos</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
