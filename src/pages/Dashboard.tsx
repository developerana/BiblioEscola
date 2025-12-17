import { useState } from 'react';
import { BookOpen, BookPlus, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLibrary } from '@/contexts/LibraryContext';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Dashboard() {
  const { getDashboardStats, getLoanHistory, books, addBook } = useLibrary();
  const stats = getDashboardStats();
  const recentLoans = getLoanHistory().slice(0, 5);

  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    editora: '',
    data_cadastro: format(new Date(), 'yyyy-MM-dd'),
    quantidade_total: 1,
    status: 'disponivel' as 'disponivel' | 'emprestado',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.autor.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    addBook({
      titulo: formData.titulo.trim(),
      autor: formData.autor.trim(),
      editora: formData.editora.trim(),
      categoria: '',
      quantidade_total: formData.quantidade_total,
      quantidade_disponivel: formData.status === 'disponivel' ? formData.quantidade_total : 0,
      data_cadastro: formData.data_cadastro,
    });

    toast.success('Livro cadastrado com sucesso!');
    setFormData({
      titulo: '',
      autor: '',
      editora: '',
      data_cadastro: format(new Date(), 'yyyy-MM-dd'),
      quantidade_total: 1,
      status: 'disponivel',
    });
  };

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

      {/* Book Registration Form */}
      <Card className="shadow-card mb-8">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Cadastrar Novo Livro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Livro *</Label>
              <Input
                id="titulo"
                placeholder="Digite o título"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                placeholder="Nome do autor"
                value={formData.autor}
                onChange={(e) => setFormData(prev => ({ ...prev, autor: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editora">Editora</Label>
              <Input
                id="editora"
                placeholder="Nome da editora"
                value={formData.editora}
                onChange={(e) => setFormData(prev => ({ ...prev, editora: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_cadastro">Data de Cadastro</Label>
              <Input
                id="data_cadastro"
                type="date"
                value={formData.data_cadastro}
                onChange={(e) => setFormData(prev => ({ ...prev, data_cadastro: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade Total</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={formData.quantidade_total}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade_total: parseInt(e.target.value) || 1 }))}
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
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-4">
              <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Livro
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
