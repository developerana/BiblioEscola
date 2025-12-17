import { useState } from 'react';
import { History as HistoryIcon, Filter } from 'lucide-react';
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
  const { getLoanHistory } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'emprestado' | 'devolvido' | 'atrasado'>('all');

  const allLoans = getLoanHistory();
  const today = new Date();

  const filteredLoans = allLoans.filter(loan => {
    const matchesSearch = 
      loan.livro?.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.aluno?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.aluno?.matricula.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;

    const isOverdue = !loan.data_devolucao && isBefore(parseISO(loan.data_prevista_devolucao), today);
    
    if (statusFilter === 'atrasado') return isOverdue;
    if (statusFilter === 'devolvido') return !!loan.data_devolucao;
    if (statusFilter === 'emprestado') return !loan.data_devolucao && !isOverdue;

    return true;
  });

  const getStatus = (loan: typeof allLoans[0]) => {
    if (loan.data_devolucao) return 'devolvido';
    if (isBefore(parseISO(loan.data_prevista_devolucao), today)) return 'atrasado';
    return 'emprestado';
  };

  return (
    <MainLayout>
      <PageHeader title="Histórico" description="Visualize o histórico completo de empréstimos" />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por título, aluno ou matrícula..."
          className="flex-1 max-w-md"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="emprestado">Em dia</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="devolvido">Devolvidos</SelectItem>
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
                            <p className="font-medium">{loan.livro?.titulo || '-'}</p>
                            <p className="text-sm text-muted-foreground">{loan.livro?.autor}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.aluno?.nome || '-'}</p>
                            <p className="text-sm text-muted-foreground">{loan.aluno?.matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell>{loan.aluno?.turma || '-'}</TableCell>
                        <TableCell>
                          {format(parseISO(loan.data_emprestimo), "dd 'de' MMM", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(loan.data_prevista_devolucao), "dd 'de' MMM", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {loan.data_devolucao 
                            ? format(parseISO(loan.data_devolucao), "dd 'de' MMM", { locale: ptBR })
                            : '-'
                          }
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
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {allLoans.filter(l => !l.data_devolucao && !isBefore(parseISO(l.data_prevista_devolucao), today)).length}
            </p>
            <p className="text-sm text-muted-foreground">Em dia</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-destructive">
              {allLoans.filter(l => !l.data_devolucao && isBefore(parseISO(l.data_prevista_devolucao), today)).length}
            </p>
            <p className="text-sm text-muted-foreground">Atrasados</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-success">
              {allLoans.filter(l => l.data_devolucao).length}
            </p>
            <p className="text-sm text-muted-foreground">Devolvidos</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
