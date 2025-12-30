import { useState } from 'react';
import { BookPlus, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLibrary } from '@/contexts/LibraryContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Loans() {
  const { books, createLoan, loading } = useLibrary();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBooks = books.filter(book => book.available_quantity > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBook || !studentName.trim() || !studentClass.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o livro, nome do aluno e turma.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createLoan(selectedBook, studentName.trim(), studentClass.trim(), loanDays);
      
      if (success) {
        const book = books.find(b => b.id === selectedBook);
        
        toast({
          title: 'Empréstimo registrado',
          description: `"${book?.title}" emprestado para ${studentName.trim()}.`,
        });
        
        setSelectedBook('');
        setStudentName('');
        setStudentClass('');
        setLoanDays(14);
      } else {
        toast({
          title: 'Erro ao registrar empréstimo',
          description: 'Livro não disponível ou dados inválidos.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBookData = books.find(b => b.id === selectedBook);
  const expectedReturnDate = addDays(new Date(), loanDays);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Empréstimos" description="Registre novos empréstimos de livros" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="Empréstimos" description="Registre novos empréstimos de livros" />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Loan Form */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BookPlus className="h-5 w-5 text-primary" />
              Novo Empréstimo
            </CardTitle>
            <CardDescription>
              Selecione o livro e o aluno para registrar o empréstimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="book">Livro</Label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um livro" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum livro disponível
                      </SelectItem>
                    ) : (
                      availableBooks.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} ({book.available_quantity} disp.)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentName">Nome do Aluno</Label>
                <Input
                  id="studentName"
                  type="text"
                  placeholder="Digite o nome do aluno"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentClass">Turma</Label>
                <Input
                  id="studentClass"
                  type="text"
                  placeholder="Digite a turma (ex: 9º A)"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Prazo para Devolução (dias)</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={30}
                  value={loanDays}
                  onChange={(e) => setLoanDays(parseInt(e.target.value) || 14)}
                />
                <p className="text-sm text-muted-foreground">
                  Data prevista: {format(expectedReturnDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {availableBooks.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não há livros disponíveis para empréstimo no momento.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={availableBooks.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Empréstimo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Resumo do Empréstimo</CardTitle>
            <CardDescription>
              Visualize os detalhes antes de confirmar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBookData || studentName.trim() || studentClass.trim() ? (
              <div className="space-y-6">
                {selectedBookData && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Livro Selecionado</h4>
                    <p className="font-display text-lg font-semibold">{selectedBookData.title}</p>
                    <p className="text-muted-foreground">{selectedBookData.author}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Disponíveis:</span>
                      <span className="font-medium text-success">{selectedBookData.available_quantity}</span>
                    </div>
                  </div>
                )}

                {(studentName.trim() || studentClass.trim()) && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Aluno</h4>
                    <p className="font-display text-lg font-semibold">{studentName.trim() || '—'}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Turma: {studentClass.trim() || '—'}</span>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Informações do Empréstimo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data do Empréstimo</span>
                      <span className="font-medium">{format(new Date(), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prazo</span>
                      <span className="font-medium">{loanDays} dias</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Devolução Prevista</span>
                      <span className="font-medium text-primary">
                        {format(expectedReturnDate, "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookPlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Selecione um livro e um aluno para ver o resumo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
