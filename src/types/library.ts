export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  total_quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  book_id: string;
  student_name: string;
  student_class: string;
  loan_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  status: 'emprestado' | 'devolvido' | 'atrasado';
  created_by: string | null;
  created_at: string;
  // Joined fields
  book?: Book;
  created_by_profile?: { name: string | null; email: string } | null;
}

export interface DashboardStats {
  totalLivros: number;
  livrosDisponiveis: number;
  livrosEmprestados: number;
  emprestimosAtrasados: number;
}
