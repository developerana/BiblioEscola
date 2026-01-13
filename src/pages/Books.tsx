import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, BookOpen, LayoutGrid, List, ChevronLeft, ChevronRight, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Book } from '@/types/library';
import { DeleteBookDialog } from '@/components/books/DeleteBookDialog';

const ITEMS_PER_PAGE = 30;

export default function Books() {
  const { books, searchBooks, addBook, updateBook, deleteBook, loading } = useLibrary();
  const { canManageBooks, isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'borrowed'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'az' | 'za'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredBooks = searchBooks(searchQuery, filter);
  
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortOrder === 'az') return a.title.localeCompare(b.title, 'pt-BR');
    if (sortOrder === 'za') return b.title.localeCompare(a.title, 'pt-BR');
    return 0;
  });
  
  const totalPages = Math.ceil(sortedBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = sortedBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter, sortOrder]);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    total_quantity: 1,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      publisher: '',
      total_quantity: 1,
    });
    setEditingBook(null);
  };

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        publisher: book.publisher || '',
        total_quantity: book.total_quantity,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingBook) {
        const diff = formData.total_quantity - editingBook.total_quantity;
        const success = await updateBook(editingBook.id, {
          ...formData,
          available_quantity: Math.max(0, editingBook.available_quantity + diff),
        });
        if (success) {
          toast({
            title: 'Livro atualizado',
            description: `"${formData.title}" foi atualizado com sucesso.`,
          });
        } else {
          toast({
            title: 'Erro ao atualizar',
            description: 'Não foi possível atualizar o livro.',
            variant: 'destructive',
          });
        }
      } else {
        const success = await addBook({
          ...formData,
          available_quantity: formData.total_quantity,
        });
        if (success) {
          toast({
            title: 'Livro cadastrado',
            description: `"${formData.title}" foi adicionado ao acervo.`,
          });
        } else {
          toast({
            title: 'Erro ao cadastrar',
            description: 'Não foi possível cadastrar o livro.',
            variant: 'destructive',
          });
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (book: Book) => {
    if (book.total_quantity !== book.available_quantity) {
      toast({
        title: 'Não é possível excluir',
        description: 'Este livro possui exemplares emprestados.',
        variant: 'destructive',
      });
      return;
    }
    
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (book: Book) => {
    const success = await deleteBook(book.id);
    if (success) {
      toast({
        title: 'Livro excluído',
        description: `"${book.title}" foi removido do acervo.`,
      });
    } else {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o livro.',
        variant: 'destructive',
      });
    }
    setBookToDelete(null);
  };

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Livros" description="Gerencie o acervo da biblioteca" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="Livros" description="Gerencie o acervo da biblioteca">
        {canManageBooks && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Livro
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingBook ? 'Editar Livro' : 'Cadastrar Novo Livro'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Editora</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade Total</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={editingBook ? editingBook.total_quantity - editingBook.available_quantity : 1}
                  value={formData.total_quantity}
                  onChange={(e) => setFormData({ ...formData, total_quantity: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingBook ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </PageHeader>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por título ou autor..."
            className="w-full sm:flex-1 sm:max-w-md"
          />
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="borrowed">Emprestados</SelectItem>
              </SelectContent>
            </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Ordem padrão</SelectItem>
              <SelectItem value="az">
                <span className="flex items-center gap-2">
                  <ArrowDownAZ className="h-4 w-4" />
                  A-Z
                </span>
              </SelectItem>
              <SelectItem value="za">
                <span className="flex items-center gap-2">
                  <ArrowUpZA className="h-4 w-4" />
                  Z-A
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 self-start">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Books Display */}
      {sortedBooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum livro encontrado</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedBooks.map((book, index) => (
            <Card
              key={book.id} 
              className="shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-lg truncate">{book.title}</h3>
                    <p className="text-muted-foreground text-sm">{book.author}</p>
                  </div>
                  <StatusBadge 
                    status={book.available_quantity > 0 ? 'disponivel' : 'emprestado'} 
                  />
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Editora</span>
                    <span className="font-medium">{book.publisher || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponíveis</span>
                    <span className="font-medium">{book.available_quantity} / {book.total_quantity}</span>
                  </div>
                </div>

                {canManageBooks && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(book)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(book)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {paginatedBooks.map((book, index) => (
                <div 
                  key={book.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate text-sm sm:text-base">{book.title}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm truncate">{book.author} • {book.publisher || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium">{book.available_quantity} / {book.total_quantity}</p>
                      <p className="text-xs text-muted-foreground">disponíveis</p>
                    </div>
                    <StatusBadge 
                      status={book.available_quantity > 0 ? 'disponivel' : 'emprestado'} 
                    />
                    {canManageBooks && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(book)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(book)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className={currentPage === page ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <DeleteBookDialog
        book={bookToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isAdmin={isAdmin}
      />
    </MainLayout>
  );
}
