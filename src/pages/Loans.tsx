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
  const { books, students, createLoan } = useLibrary();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loanDays, setLoanDays] = useState(14);

  const availableBooks = books.filter(book => book.quantidade_disponivel > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBook || !selectedStudent) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um livro e um aluno.',
        variant: 'destructive',
      });
      return;
    }

    const success = createLoan(selectedBook, selectedStudent, loanDays);
    
    if (success) {
      const book = books.find(b => b.id === selectedBook);
      const student = students.find(s => s.id === selectedStudent);
      
      toast({
        title: 'Empréstimo registrado',
        description: `"${book?.titulo}" emprestado para ${student?.nome}.`,
      });
      
      setSelectedBook('');
      setSelectedStudent('');
      setLoanDays(14);
    } else {
      toast({
        title: 'Erro ao registrar empréstimo',
        description: 'Livro não disponível ou dados inválidos.',
        variant: 'destructive',
      });
    }
  };

  const selectedBookData = books.find(b => b.id === selectedBook);
  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const expectedReturnDate = addDays(new Date(), loanDays);

  return (
    <MainLayout>
      <PageHeader title="Empréstimos" description="Registre novos empréstimos de livros" />

      <div className="grid gap-6 lg:grid-cols-2">
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
                          {book.titulo} ({book.quantidade_disponivel} disp.)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.nome} - {student.turma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={availableBooks.length === 0}
              >
                Registrar Empréstimo
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
            {selectedBookData || selectedStudentData ? (
              <div className="space-y-6">
                {selectedBookData && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Livro Selecionado</h4>
                    <p className="font-display text-lg font-semibold">{selectedBookData.titulo}</p>
                    <p className="text-muted-foreground">{selectedBookData.autor}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Disponíveis:</span>
                      <span className="font-medium text-success">{selectedBookData.quantidade_disponivel}</span>
                    </div>
                  </div>
                )}

                {selectedStudentData && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Aluno Selecionado</h4>
                    <p className="font-display text-lg font-semibold">{selectedStudentData.nome}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Matrícula: {selectedStudentData.matricula}</span>
                      <span>Turma: {selectedStudentData.turma}</span>
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
