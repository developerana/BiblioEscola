import { useState } from 'react';
import { BookOpen, BookPlus, AlertTriangle, TrendingUp, Plus, Minus, Clock, CheckCircle2, CalendarClock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isBefore } from 'date-fns';
import { toast } from 'sonner';

export default function Dashboard() {
  const { getDashboardStats, getLoanHistory, addBook, loading } = useLibrary();
  const { canManageBooks } = useAuth();
  const stats = getDashboardStats();
  const history = getLoanHistory();
  const activeLoans = history.filter(l => !l.actual_return_date).slice(0, 5);
  const recentReturns = history
    .filter(l => l.actual_return_date)
    .sort((a, b) => new Date(b.actual_return_date!).getTime() - new Date(a.actual_return_date!).getTime())
    .slice(0, 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    publisher: string;
    total_quantity: number | '';
  }>({
    title: '',
    author: '',
    publisher: '',
    total_quantity: 1,
  });

  const changeQuantity = (delta: number) => {
    setFormData(prev => {
      const current = typeof prev.total_quantity === 'number' ? prev.total_quantity : 1;
      return {
        ...prev,
        total_quantity: Math.min(9999, Math.max(1, current + delta)),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await addBook({
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim() || null,
        total_quantity: formData.total_quantity,
        available_quantity: formData.total_quantity,
      });
      if (success) {
        toast.success('Livro cadastrado com sucesso!');
        setFormData({ title: '', author: '', publisher: '', total_quantity: 1 });
      } else {
        toast.error('Erro ao cadastrar livro');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader title="Dashboard" description="Visão geral do sistema bibliotecário" />

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <StatCard title="Total de Livros" value={stats.totalLivros} icon={BookOpen} variant="primary" />
        <StatCard title="Disponíveis" value={stats.livrosDisponiveis} icon={TrendingUp} variant="success" />
        <StatCard title="Emprestados" value={stats.livrosEmprestados} icon={BookPlus} variant="default" />
        <StatCard title="Atrasados" value={stats.emprestimosAtrasados} icon={AlertTriangle} variant={stats.emprestimosAtrasados > 0 ? 'destructive' : 'default'} />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Book Registration Form */}
        {canManageBooks && (
          <Card className="shadow-card lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Cadastrar Novo Livro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Livro *</Label>
                  <Input id="title" placeholder="Digite o título do livro" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Autor *</Label>
                  <Input id="author" placeholder="Nome do autor" value={formData.author} onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Editora</Label>
                  <Input id="publisher" placeholder="Nome da editora" value={formData.publisher} onChange={e => setFormData(prev => ({ ...prev, publisher: e.target.value }))} />
                </div>

                {/* Quantidade - seletor com botões */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => changeQuantity(-1)} disabled={formData.total_quantity <= 1} aria-label="Diminuir quantidade">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="text-center font-semibold"
                      value={formData.total_quantity}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        if (raw === '') {
                          setFormData(prev => ({ ...prev, total_quantity: '' }));
                          return;
                        }
                        const val = Math.min(9999, Math.max(1, parseInt(raw, 10)));
                        setFormData(prev => ({ ...prev, total_quantity: val }));
                      }}
                      onBlur={() => {
                        if (formData.total_quantity === '') {
                          setFormData(prev => ({ ...prev, total_quantity: 1 }));
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => changeQuantity(1)} disabled={formData.total_quantity >= 9999} aria-label="Aumentar quantidade">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="bg-gradient-primary hover:opacity-90 w-full" disabled={isSubmitting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Livro'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Active Loans */}
        <Card className={`shadow-card ${canManageBooks ? 'lg:col-span-2' : 'lg:col-span-3'} h-fit`}>
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Empréstimos em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activeLoans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum empréstimo em andamento.</p>
            ) : (
              <div className="space-y-3">
                {activeLoans.map(loan => {
                  const isOverdue = isBefore(parseISO(loan.expected_return_date), new Date());
                  return (
                    <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm sm:text-base">{loan.book?.title || 'Livro não encontrado'}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{loan.student_name} - Turma: {loan.student_class}</p>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right text-xs sm:text-sm text-muted-foreground">
                          <p className="flex items-center gap-1 justify-end">
                            <CalendarClock className="h-3 w-3" />
                            Prev.: {format(parseISO(loan.expected_return_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <StatusBadge status={isOverdue ? 'atrasado' : 'emprestado'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Returns */}
        <Card className="shadow-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Devoluções Mais Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentReturns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma devolução registrada ainda.</p>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {recentReturns.map(loan => (
                  <div key={loan.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm truncate flex-1">{loan.book?.title || 'Livro não encontrado'}</h4>
                      <StatusBadge status="devolvido" />
                    </div>
                    <p className="text-xs text-muted-foreground">{loan.student_name} - Turma: {loan.student_class}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Devolvido em {format(parseISO(loan.actual_return_date!), 'dd/MM/yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
