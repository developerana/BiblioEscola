import { useState } from 'react';
import { Undo2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
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
  const { getLoanHistory, returnBook, getActiveLoan } = useLibrary();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);

  const activeLoans = getLoanHistory().filter(loan => !loan.data_devolucao);
  const today = new Date();

  const filteredLoans = activeLoans
    .filter(loan =>
      loan.livro?.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.aluno_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.aluno_turma.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => parseISO(a.data_emprestimo).getTime() - parseISO(b.data_emprestimo).getTime());

  const handleReturn = (loanId: string) => {
    const success = returnBook(loanId);
    
    if (success) {
      const loan = getActiveLoan(loanId);
      toast({
        title: 'Devolução registrada',
        description: `"${loan?.livro?.titulo}" devolvido com sucesso.`,
      });
    } else {
      toast({
        title: 'Erro ao registrar devolução',
        description: 'Este livro já foi devolvido ou dados inválidos.',
        variant: 'destructive',
      });
    }
    
    setConfirmDialog(null);
  };

  const selectedLoan = confirmDialog ? getActiveLoan(confirmDialog) : null;

  return (
    <MainLayout>
      <PageHeader title="Devoluções" description="Registre a devolução de livros emprestados" />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por título, aluno ou turma..."
          className="max-w-md"
        />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.map((loan, index) => {
            const isOverdue = isBefore(parseISO(loan.data_prevista_devolucao), today);
            const daysOverdue = isOverdue 
              ? differenceInDays(today, parseISO(loan.data_prevista_devolucao))
              : 0;
            const daysRemaining = !isOverdue 
              ? differenceInDays(parseISO(loan.data_prevista_devolucao), today)
              : 0;

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
                        {loan.livro?.titulo || 'Livro não encontrado'}
                      </h3>
                      <p className="text-muted-foreground text-sm">{loan.livro?.autor}</p>
                    </div>
                    <StatusBadge status={isOverdue ? 'atrasado' : 'emprestado'} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm font-medium">{loan.aluno_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Turma: {loan.aluno_turma}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Emprestado em</span>
                        <span>{format(parseISO(loan.data_emprestimo), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Devolução prevista</span>
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {format(parseISO(loan.data_prevista_devolucao), 'dd/MM/yyyy')}
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
                <h4 className="font-medium mb-2">{selectedLoan.livro?.titulo}</h4>
                <p className="text-sm text-muted-foreground">{selectedLoan.livro?.autor}</p>
              </div>
              
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-2">{selectedLoan.aluno_nome}</h4>
                <p className="text-sm text-muted-foreground">
                  Turma: {selectedLoan.aluno_turma}
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
            >
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}