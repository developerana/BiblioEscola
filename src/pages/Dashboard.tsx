import { useState } from 'react';
import { BookOpen, BookPlus, AlertTriangle, TrendingUp, Plus, Clock } from 'lucide-react';
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
  const recentLoans = getLoanHistory().slice(0, 5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    total_quantity: 1,
    status: 'disponivel' as 'disponivel' | 'emprestado',
  });

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
        available_quantity: formData.status === 'disponivel' ? formData.total_quantity : 0,
      });

      if (success) {
        toast.success('Livro cadastrado com sucesso!');
        setFormData({
          title: '',
          author: '',
          publisher: '',
          total_quantity: 1,
          status: 'disponivel',
        });
      } else {
        toast.error('Erro ao cadastrar livro');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do sistema bibliotecário"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
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

      {/* Book Registration Form - Only for admins and librarians */}
      {canManageBooks ? (
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Cadastrar Novo Livro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Livro *</Label>
                <Input
                  id="title"
                  placeholder="Digite o título"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor *</Label>
                <Input
                  id="author"
                  placeholder="Nome do autor"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Editora</Label>
                <Input
                  id="publisher"
                  placeholder="Nome da editora"
                  value={formData.publisher}
                  onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade Total</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.total_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.status === 'disponivel' ? 'default' : 'outline'}
                    className={formData.status === 'disponivel' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, status: 'disponivel' }))}
                  >
                    Disponível
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === 'emprestado' ? 'default' : 'outline'}
                    className={formData.status === 'emprestado' ? 'bg-warning hover:bg-warning/90 text-warning-foreground' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, status: 'emprestado' }))}
                  >
                    Emprestado
                  </Button>
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end pt-4">
                <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={isSubmitting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Livro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Empréstimos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentLoans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum empréstimo registrado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {recentLoans.map((loan) => {
                  const isOverdue = loan.expected_return_date && !loan.actual_return_date && 
                    isBefore(parseISO(loan.expected_return_date), new Date());
                  
                  return (
                    <div 
                      key={loan.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm sm:text-base">{loan.book?.title || 'Livro não encontrado'}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{loan.student_name} - Turma: {loan.student_class}</p>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {format(parseISO(loan.loan_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <StatusBadge 
                          status={loan.actual_return_date ? 'devolvido' : (isOverdue ? 'atrasado' : 'emprestado')} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
