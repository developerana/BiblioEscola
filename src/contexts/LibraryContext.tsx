import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Book, Loan, DashboardStats } from '@/types/library';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isBefore, parseISO } from 'date-fns';

interface LibraryContextType {
  books: Book[];
  loans: Loan[];
  loading: boolean;
  addBook: (book: Omit<Book, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateBook: (id: string, book: Partial<Book>) => Promise<boolean>;
  deleteBook: (id: string) => Promise<boolean>;
  createLoan: (bookId: string, studentName: string, studentClass: string, loanDays: number) => Promise<boolean>;
  returnBook: (loanId: string) => Promise<boolean>;
  getDashboardStats: () => DashboardStats;
  searchBooks: (query: string, filter?: 'all' | 'available' | 'borrowed') => Book[];
  getLoanHistory: () => Loan[];
  getActiveLoan: (loanId: string) => Loan | undefined;
  refreshData: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching books:', error);
      return [];
    }
    return data || [];
  };

  const fetchLoansAndProfiles = async (): Promise<Loan[]> => {
    // Fetch loans and profiles in parallel for speed
    const [loansResult, profilesResult] = await Promise.all([
      supabase
        .from('loans')
        .select(`*, book:books(*)`)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('user_id, name, email')
    ]);
    
    if (loansResult.error) {
      console.error('Error fetching loans:', loansResult.error);
      return [];
    }

    const profilesMap: Record<string, { name: string | null; email: string }> = {};
    if (profilesResult.data) {
      profilesResult.data.forEach(p => {
        profilesMap[p.user_id] = { name: p.name, email: p.email };
      });
    }

    return (loansResult.data || []).map(loan => ({
      ...loan,
      status: loan.status as 'emprestado' | 'devolvido' | 'atrasado',
      created_by_profile: loan.created_by ? profilesMap[loan.created_by] || null : null,
    }));
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [booksData, loansData] = await Promise.all([fetchBooks(), fetchLoansAndProfiles()]);
    setBooks(booksData);
    setLoans(loansData);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();

    // Subscribe to real-time changes for books
    const booksChannel = supabase
      .channel('books-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'books' },
        () => {
          fetchBooks().then(setBooks);
        }
      )
      .subscribe();

    // Subscribe to real-time changes for loans
    const loansChannel = supabase
      .channel('loans-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loans' },
        () => {
          fetchLoansAndProfiles().then(setLoans);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(booksChannel);
      supabase.removeChannel(loansChannel);
    };
  }, [refreshData]);

  const addBook = useCallback(async (book: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    const { data, error } = await supabase
      .from('books')
      .insert({
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        total_quantity: book.total_quantity,
        available_quantity: book.available_quantity,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding book:', error);
      return false;
    }
    
    setBooks(prev => [data, ...prev]);
    return true;
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>): Promise<boolean> => {
    const { error } = await supabase
      .from('books')
      .update({
        title: updates.title,
        author: updates.author,
        publisher: updates.publisher,
        total_quantity: updates.total_quantity,
        available_quantity: updates.available_quantity,
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating book:', error);
      return false;
    }
    
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, ...updates } : book
    ));
    return true;
  }, []);

  const deleteBook = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting book:', error);
      return false;
    }
    
    setBooks(prev => prev.filter(book => book.id !== id));
    return true;
  }, []);

  const createLoan = useCallback(async (bookId: string, studentName: string, studentClass: string, loanDays: number): Promise<boolean> => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.available_quantity <= 0) return false;

    const today = new Date();
    const expectedReturnDate = addDays(today, loanDays);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('loans')
      .insert({
        book_id: bookId,
        student_name: studentName,
        student_class: studentClass,
        loan_date: today.toISOString(),
        expected_return_date: expectedReturnDate.toISOString(),
        status: 'emprestado',
        created_by: user?.id || null,
      })
      .select(`
        *,
        book:books(*)
      `)
      .single();
    
    if (error) {
      console.error('Error creating loan:', error);
      return false;
    }

    // Update book availability
    const { error: updateError } = await supabase
      .from('books')
      .update({ available_quantity: book.available_quantity - 1 })
      .eq('id', bookId);
    
    if (updateError) {
      console.error('Error updating book availability:', updateError);
      return false;
    }

    setLoans(prev => [{
      ...data,
      status: data.status as 'emprestado' | 'devolvido' | 'atrasado',
    }, ...prev]);
    setBooks(prev => prev.map(b => 
      b.id === bookId 
        ? { ...b, available_quantity: b.available_quantity - 1 }
        : b
    ));

    return true;
  }, [books]);

  const returnBook = useCallback(async (loanId: string): Promise<boolean> => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.actual_return_date) return false;

    const today = new Date().toISOString();

    const { error } = await supabase
      .from('loans')
      .update({
        actual_return_date: today,
        status: 'devolvido',
      })
      .eq('id', loanId);
    
    if (error) {
      console.error('Error returning book:', error);
      return false;
    }

    // Update book availability
    const book = books.find(b => b.id === loan.book_id);
    if (book) {
      const { error: updateError } = await supabase
        .from('books')
        .update({ available_quantity: book.available_quantity + 1 })
        .eq('id', loan.book_id);
      
      if (updateError) {
        console.error('Error updating book availability:', updateError);
      }
    }

    setLoans(prev => prev.map(l => 
      l.id === loanId 
        ? { ...l, actual_return_date: today, status: 'devolvido' as const }
        : l
    ));

    if (book) {
      setBooks(prev => prev.map(b => 
        b.id === loan.book_id 
          ? { ...b, available_quantity: b.available_quantity + 1 }
          : b
      ));
    }

    return true;
  }, [loans, books]);

  const getDashboardStats = useCallback((): DashboardStats => {
    const today = new Date();
    const activeLoans = loans.filter(l => !l.actual_return_date);
    const overdueLoans = activeLoans.filter(l => 
      isBefore(parseISO(l.expected_return_date), today)
    );

    const totalBorrowed = books.reduce((acc, b) => acc + (b.total_quantity - b.available_quantity), 0);

    return {
      totalLivros: books.reduce((acc, b) => acc + b.total_quantity, 0),
      livrosDisponiveis: books.reduce((acc, b) => acc + b.available_quantity, 0),
      livrosEmprestados: totalBorrowed,
      emprestimosAtrasados: overdueLoans.length,
    };
  }, [books, loans]);

  const searchBooks = useCallback((query: string, filter: 'all' | 'available' | 'borrowed' = 'all'): Book[] => {
    let filtered = books;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery)
      );
    }

    if (filter === 'available') {
      filtered = filtered.filter(book => book.available_quantity > 0);
    } else if (filter === 'borrowed') {
      filtered = filtered.filter(book => book.available_quantity < book.total_quantity);
    }

    return filtered;
  }, [books]);

  const getLoanHistory = useCallback((): Loan[] => {
    const today = new Date();
    
    return loans.map(loan => {
      let status = loan.status;
      if (!loan.actual_return_date && isBefore(parseISO(loan.expected_return_date), today)) {
        status = 'atrasado';
      }

      return {
        ...loan,
        status,
      };
    }).sort((a, b) => new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime());
  }, [loans]);

  const getActiveLoan = useCallback((loanId: string): Loan | undefined => {
    return loans.find(l => l.id === loanId);
  }, [loans]);

  return (
    <LibraryContext.Provider value={{
      books,
      loans,
      loading,
      addBook,
      updateBook,
      deleteBook,
      createLoan,
      returnBook,
      getDashboardStats,
      searchBooks,
      getLoanHistory,
      getActiveLoan,
      refreshData,
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
