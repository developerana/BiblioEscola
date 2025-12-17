import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLibrary } from '@/contexts/LibraryContext';
import { useToast } from '@/hooks/use-toast';
import { Student } from '@/types/library';

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent, loans } = useLibrary();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    turma: '',
  });

  const filteredStudents = students.filter(student =>
    student.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.matricula.includes(searchQuery) ||
    student.turma.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ nome: '', matricula: '', turma: '' });
    setEditingStudent(null);
  };

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        nome: student.nome,
        matricula: student.matricula,
        turma: student.turma,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate matricula
    const existingMatricula = students.find(
      s => s.matricula === formData.matricula && s.id !== editingStudent?.id
    );
    
    if (existingMatricula) {
      toast({
        title: 'Matrícula já cadastrada',
        description: 'Esta matrícula já está em uso por outro aluno.',
        variant: 'destructive',
      });
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
      toast({
        title: 'Aluno atualizado',
        description: `"${formData.nome}" foi atualizado com sucesso.`,
      });
    } else {
      addStudent(formData);
      toast({
        title: 'Aluno cadastrado',
        description: `"${formData.nome}" foi cadastrado com sucesso.`,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (student: Student) => {
    const hasActiveLoans = loans.some(
      loan => loan.aluno_id === student.id && !loan.data_devolucao
    );

    if (hasActiveLoans) {
      toast({
        title: 'Não é possível excluir',
        description: 'Este aluno possui empréstimos ativos.',
        variant: 'destructive',
      });
      return;
    }
    
    deleteStudent(student.id);
    toast({
      title: 'Aluno excluído',
      description: `"${student.nome}" foi removido do sistema.`,
    });
  };

  const getStudentLoansCount = (studentId: string) => {
    return loans.filter(loan => loan.aluno_id === studentId && !loan.data_devolucao).length;
  };

  return (
    <MainLayout>
      <PageHeader title="Alunos" description="Gerencie os alunos cadastrados">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turma">Turma</Label>
                  <Input
                    id="turma"
                    value={formData.turma}
                    onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                    placeholder="Ex: 9º A"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                  {editingStudent ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por nome, matrícula ou turma..."
          className="max-w-md"
        />
      </div>

      {/* Students Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum aluno encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-center">Empréstimos Ativos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.nome}</TableCell>
                    <TableCell>{student.matricula}</TableCell>
                    <TableCell>{student.turma}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {getStudentLoansCount(student.id)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(student)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
