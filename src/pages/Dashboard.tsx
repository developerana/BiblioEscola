import { useState } from 'react';
import { BookOpen, BookPlus, AlertTriangle, TrendingUp, Plus, Clock, Users } from 'lucide-react';
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
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Dashboard() {
  const { getDashboardStats, getLoanHistory, books, addBook } = useLibrary();
  const { canManageBooks, user } = useAuth();
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
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end pt-4">
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Livro
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
            {recentLoans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum empréstimo registrado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {recentLoans.map((loan) => {
                  const isOverdue = loan.data_prevista_devolucao && !loan.data_devolucao && 
                    isBefore(parseISO(loan.data_prevista_devolucao), new Date());
                  
                  return (
                    <div 
                      key={loan.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm sm:text-base">{loan.livro?.titulo || 'Livro não encontrado'}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{loan.aluno_nome} - Turma: {loan.aluno_turma}</p>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {format(parseISO(loan.data_emprestimo), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <StatusBadge 
                          status={loan.data_devolucao ? 'devolvido' : (isOverdue ? 'atrasado' : 'emprestado')} 
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
