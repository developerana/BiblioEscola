import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/library';

interface DeleteBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (book: Book) => void;
}

export function DeleteBookDialog({ book, open, onOpenChange, onConfirm }: DeleteBookDialogProps) {
  const [bookNameInput, setBookNameInput] = useState('');
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  useEffect(() => {
    if (!open) {
      setBookNameInput('');
      setDeleteConfirmInput('');
    }
  }, [open]);

  const isBookNameValid = book && bookNameInput.trim().toLowerCase() === book.title.trim().toLowerCase();
  const isDeleteConfirmValid = deleteConfirmInput.trim().toLowerCase() === 'deletar';
  const canDelete = isBookNameValid && isDeleteConfirmValid;

  const handleConfirm = () => {
    if (canDelete && book) {
      onConfirm(book);
      onOpenChange(false);
    }
  };

  if (!book) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="font-display">Excluir Livro</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              Você está prestes a excluir o livro:
            </p>
            <p className="text-sm font-semibold mt-1">"{book.title}"</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-name">
              Digite o nome do livro para confirmar:
            </Label>
            <Input
              id="book-name"
              value={bookNameInput}
              onChange={(e) => setBookNameInput(e.target.value)}
              placeholder={book.title}
              className={bookNameInput && !isBookNameValid ? 'border-destructive' : ''}
            />
            {bookNameInput && !isBookNameValid && (
              <p className="text-xs text-destructive">O nome do livro não corresponde</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Digite <span className="font-semibold text-destructive">"Deletar"</span> para confirmar:
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder="Deletar"
              className={deleteConfirmInput && !isDeleteConfirmValid ? 'border-destructive' : ''}
            />
            {deleteConfirmInput && !isDeleteConfirmValid && (
              <p className="text-xs text-destructive">Digite "Deletar" exatamente</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete}
          >
            Excluir Livro
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
