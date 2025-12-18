import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Book, Loan, DashboardStats } from '@/types/library';
import { format, addDays, isBefore, parseISO } from 'date-fns';

interface LibraryContextType {
  books: Book[];
  loans: Loan[];
  addBook: (book: Omit<Book, 'id' | 'created_at'>) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  createLoan: (livroId: string, alunoNome: string, alunoTurma: string, diasEmprestimo: number) => boolean;
  returnBook: (loanId: string) => boolean;
  getDashboardStats: () => DashboardStats;
  searchBooks: (query: string, filter?: 'all' | 'available' | 'borrowed') => Book[];
  getLoanHistory: () => Loan[];
  getActiveLoan: (loanId: string) => Loan | undefined;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Initial mock data
const initialBooks: Book[] = [
  {
    id: '1',
    titulo: 'Dom Casmurro',
    autor: 'Machado de Assis',
    editora: 'Companhia das Letras',
    categoria: 'Literatura Brasileira',
    quantidade_total: 5,
    quantidade_disponivel: 3,
    data_cadastro: '2024-01-15',
  },
  {
    id: '2',
    titulo: 'O Pequeno Príncipe',
    autor: 'Antoine de Saint-Exupéry',
    editora: 'Agir',
    categoria: 'Literatura Infantil',
    quantidade_total: 8,
    quantidade_disponivel: 8,
    data_cadastro: '2024-01-20',
  },
  {
    id: '3',
    titulo: 'Harry Potter e a Pedra Filosofal',
    autor: 'J.K. Rowling',
    editora: 'Rocco',
    categoria: 'Fantasia',
    quantidade_total: 6,
    quantidade_disponivel: 2,
    data_cadastro: '2024-02-01',
  },
  {
    id: '4',
    titulo: '1984',
    autor: 'George Orwell',
    editora: 'Companhia das Letras',
    categoria: 'Ficção Científica',
    quantidade_total: 4,
    quantidade_disponivel: 4,
    data_cadastro: '2024-02-10',
  },
];

const initialLoans: Loan[] = [
  {
    id: '1',
    livro_id: '1',
    aluno_nome: 'Ana Silva',
    aluno_turma: '9º A',
    data_emprestimo: '2024-12-01',
    data_prevista_devolucao: '2024-12-15',
    data_devolucao: null,
    status: 'atrasado',
  },
  {
    id: '2',
    livro_id: '1',
    aluno_nome: 'Pedro Santos',
    aluno_turma: '8º B',
    data_emprestimo: '2024-12-10',
    data_prevista_devolucao: '2024-12-24',
    data_devolucao: null,
    status: 'emprestado',
  },
  {
    id: '3',
    livro_id: '3',
    aluno_nome: 'Maria Oliveira',
    aluno_turma: '7º A',
    data_emprestimo: '2024-11-15',
    data_prevista_devolucao: '2024-11-29',
    data_devolucao: '2024-11-28',
    status: 'devolvido',
  },
  {
    id: '4',
    livro_id: '3',
    aluno_nome: 'João Costa',
    aluno_turma: '9º B',
    data_emprestimo: '2024-12-05',
    data_prevista_devolucao: '2024-12-19',
    data_devolucao: null,
    status: 'emprestado',
  },
];

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addBook = useCallback((book: Omit<Book, 'id' | 'created_at'>) => {
    const newBook: Book = {
      ...book,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setBooks(prev => [...prev, newBook]);
  }, []);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, ...updates } : book
    ));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks(prev => prev.filter(book => book.id !== id));
  }, []);

  const createLoan = useCallback((livroId: string, alunoNome: string, alunoTurma: string, diasEmprestimo: number): boolean => {
    const book = books.find(b => b.id === livroId);
    if (!book || book.quantidade_disponivel <= 0) return false;

    const today = new Date();
    const newLoan: Loan = {
      id: generateId(),
      livro_id: livroId,
      aluno_nome: alunoNome,
      aluno_turma: alunoTurma,
      data_emprestimo: format(today, 'yyyy-MM-dd'),
      data_prevista_devolucao: format(addDays(today, diasEmprestimo), 'yyyy-MM-dd'),
      data_devolucao: null,
      status: 'emprestado',
    };

    setLoans(prev => [...prev, newLoan]);
    setBooks(prev => prev.map(b => 
      b.id === livroId 
        ? { ...b, quantidade_disponivel: b.quantidade_disponivel - 1 }
        : b
    ));

    return true;
  }, [books]);

  const returnBook = useCallback((loanId: string): boolean => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.data_devolucao) return false;

    const today = format(new Date(), 'yyyy-MM-dd');

    setLoans(prev => prev.map(l => 
      l.id === loanId 
        ? { ...l, data_devolucao: today, status: 'devolvido' as const }
        : l
    ));

    setBooks(prev => prev.map(b => 
      b.id === loan.livro_id 
        ? { ...b, quantidade_disponivel: b.quantidade_disponivel + 1 }
        : b
    ));

    return true;
  }, [loans]);

  const getDashboardStats = useCallback((): DashboardStats => {
    const today = new Date();
    const activeLoans = loans.filter(l => !l.data_devolucao);
    const overdueLoans = activeLoans.filter(l => 
      isBefore(parseISO(l.data_prevista_devolucao), today)
    );

    const totalBorrowed = books.reduce((acc, b) => acc + (b.quantidade_total - b.quantidade_disponivel), 0);

    return {
      totalLivros: books.reduce((acc, b) => acc + b.quantidade_total, 0),
      livrosDisponiveis: books.reduce((acc, b) => acc + b.quantidade_disponivel, 0),
      livrosEmprestados: totalBorrowed,
      emprestimosAtrasados: overdueLoans.length,
    };
  }, [books, loans]);

  const searchBooks = useCallback((query: string, filter: 'all' | 'available' | 'borrowed' = 'all'): Book[] => {
    let filtered = books;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(book => 
        book.titulo.toLowerCase().includes(lowerQuery) ||
        book.autor.toLowerCase().includes(lowerQuery)
      );
    }

    if (filter === 'available') {
      filtered = filtered.filter(book => book.quantidade_disponivel > 0);
    } else if (filter === 'borrowed') {
      filtered = filtered.filter(book => book.quantidade_disponivel < book.quantidade_total);
    }

    return filtered;
  }, [books]);

  const getLoanHistory = useCallback((): Loan[] => {
    const today = new Date();
    
    return loans.map(loan => {
      const livro = books.find(b => b.id === loan.livro_id);
      
      let status = loan.status;
      if (!loan.data_devolucao && isBefore(parseISO(loan.data_prevista_devolucao), today)) {
        status = 'atrasado';
      }

      return {
        ...loan,
        status,
        livro,
      };
    }).sort((a, b) => new Date(b.data_emprestimo).getTime() - new Date(a.data_emprestimo).getTime());
  }, [loans, books]);

  const getActiveLoan = useCallback((loanId: string): Loan | undefined => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return undefined;

    return {
      ...loan,
      livro: books.find(b => b.id === loan.livro_id),
    };
  }, [loans, books]);

  return (
    <LibraryContext.Provider value={{
      books,
      loans,
      addBook,
      updateBook,
      deleteBook,
      createLoan,
      returnBook,
      getDashboardStats,
      searchBooks,
      getLoanHistory,
      getActiveLoan,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}