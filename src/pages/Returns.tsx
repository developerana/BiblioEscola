import { useState } from 'react';
import { Undo2, AlertTriangle, CheckCircle2, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLibrary } from '@/contexts/LibraryContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';

export default function Returns() {
  const { getLoanHistory, returnBook, getActiveLoan, loading } = useLibrary();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLoans = getLoanHistory().filter(loan => !loan.actual_return_date);
  const today = new Date();

  const filteredLoans = activeLoans
    .filter(loan =>
      loan.book?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.student_class.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = parseISO(a.loan_date).getTime();
      const dateB = parseISO(b.loan_date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleReturn = async (loanId: string) => {
    setIsSubmitting(true);
    try {
      const success = await returnBook(loanId);
      
      if (success) {
        const loan = getActiveLoan(loanId);
        toast({
          title: 'Devolução registrada',
          description: `"${loan?.book?.title}" devolvido com sucesso.`,
        });
      } else {
        toast({
          title: 'Erro ao registrar devolução',
          description: 'Este livro já foi devolvido ou dados inválidos.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
      setConfirmDialog(null);
    }
  };

  const selectedLoan = confirmDialog ? getActiveLoan(confirmDialog) : null;

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Devoluções" description="Registre a devolução de livros emprestados" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="Devoluções" description="Registre a devolução de livros emprestados" />

      {/* Search, Sort and View Toggle */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por título, aluno ou turma..."
            className="w-full sm:max-w-lg"
          />
          <div className="flex items-center gap-3">
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recente primeiro</SelectItem>
                <SelectItem value="oldest">Mais antigo primeiro</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
              className="justify-start"
            >
              <ToggleGroupItem value="grid" aria-label="Visualização em grade">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Visualização em lista">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Active Loans */}
      {filteredLoans.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-success mb-4" />
            <p className="text-lg font-medium">Nenhum empréstimo pendente</p>
            <p className="text-muted-foreground">Todos os livros foram devolvidos</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
          : "flex flex-col gap-3"
        }>
          {filteredLoans.map((loan, index) => {
            const isOverdue = isBefore(parseISO(loan.expected_return_date), today);
            const daysOverdue = isOverdue 
              ? differenceInDays(today, parseISO(loan.expected_return_date))
              : 0;
            const daysRemaining = !isOverdue 
              ? differenceInDays(parseISO(loan.expected_return_date), today)
              : 0;

            if (viewMode === 'list') {
              return (
                <Card 
                  key={loan.id} 
                  className={`shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in ${
                    isOverdue ? 'border-destructive/50' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-display font-semibold truncate">
                          {loan.book?.title || 'Livro não encontrado'}
                        </h3>
                        <StatusBadge status={isOverdue ? 'atrasado' : 'emprestado'} />
                      </div>
                      <p className="text-sm text-muted-foreground">{loan.book?.author}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="font-medium">{loan.student_name}</p>
                        <p className="text-xs text-muted-foreground">Turma: {loan.student_class}</p>
                      </div>

                      <div className="hidden md:block text-right">
                        <p className="text-muted-foreground text-xs">Devolução prevista</p>
                        <p className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {format(parseISO(loan.expected_return_date), 'dd/MM/yyyy')}
                        </p>
                      </div>

                      {isOverdue ? (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">
                            {daysOverdue}d atraso
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-success">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">
                            {daysRemaining}d restantes
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => setConfirmDialog(loan.id)}
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Devolver
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card 
                key={loan.id} 
                className={`shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in ${
                  isOverdue ? 'border-destructive/50' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg truncate">
                        {loan.book?.title || 'Livro não encontrado'}
                      </h3>
                      <p className="text-muted-foreground text-sm">{loan.book?.author}</p>
                    </div>
                    <StatusBadge status={isOverdue ? 'atrasado' : 'emprestado'} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm font-medium">{loan.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Turma: {loan.student_class}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Emprestado em</span>
                        <span>{format(parseISO(loan.loan_date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Devolução prevista</span>
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {format(parseISO(loan.expected_return_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>

                    {isOverdue ? (
                      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} de atraso
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-primary hover:opacity-90"
                    onClick={() => setConfirmDialog(loan.id)}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Registrar Devolução
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Confirmar Devolução</DialogTitle>
            <DialogDescription>
              Confirme os dados abaixo para registrar a devolução do livro.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-2">{selectedLoan.book?.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedLoan.book?.author}</p>
              </div>
              
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-2">{selectedLoan.student_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Turma: {selectedLoan.student_class}
                </p>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de hoje</span>
                  <span className="font-medium">{format(today, 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => confirmDialog && handleReturn(confirmDialog)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Devolução'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
