import { BookOpen, Users, BookPlus, AlertTriangle, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLibrary } from '@/contexts/LibraryContext';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { getDashboardStats, getLoanHistory, books } = useLibrary();
  const stats = getDashboardStats();
  const recentLoans = getLoanHistory().slice(0, 5);

  return (
    <MainLayout>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do sistema bibliotecário"
      />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total de Livros"
          value={stats.totalLivros}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Disponíveis"
          value={stats.livrosDisponiveis}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Emprestados"
          value={stats.livrosEmprestados}
          icon={BookPlus}
          variant="default"
        />
        <StatCard
          title="Atrasados"
          value={stats.emprestimosAtrasados}
          icon={AlertTriangle}
          variant={stats.emprestimosAtrasados > 0 ? 'destructive' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Loans */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">Empréstimos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoans.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum empréstimo registrado
                </p>
              ) : (
                recentLoans.map((loan) => {
                  const isOverdue = !loan.data_devolucao && 
                    isBefore(parseISO(loan.data_prevista_devolucao), new Date());
                  
                  return (
                    <div 
                      key={loan.id} 
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{loan.livro?.titulo || 'Livro não encontrado'}</p>
                        <p className="text-sm text-muted-foreground">
                          {loan.aluno?.nome || 'Aluno não encontrado'} • {loan.aluno?.turma}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <StatusBadge 
                          status={
                            loan.data_devolucao 
                              ? 'devolvido' 
                              : isOverdue 
                                ? 'atrasado' 
                                : 'emprestado'
                          } 
                        />
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(loan.data_emprestimo), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Books */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">Livros Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {books.slice(0, 5).map((book) => {
                const borrowedCount = book.quantidade_total - book.quantidade_disponivel;
                const percentage = (borrowedCount / book.quantidade_total) * 100;
                
                return (
                  <div key={book.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{book.titulo}</p>
                        <p className="text-sm text-muted-foreground">{book.autor}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {book.quantidade_disponivel}/{book.quantidade_total}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div 
                        className="h-2 rounded-full bg-gradient-primary transition-all duration-500"
                        style={{ width: `${100 - percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
