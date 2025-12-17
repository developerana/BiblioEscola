export interface Book {
  id: string;
  titulo: string;
  autor: string;
  editora: string;
  categoria: string;
  quantidade_total: number;
  quantidade_disponivel: number;
  data_cadastro: string;
  created_at?: string;
}

export interface Student {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  created_at?: string;
}

export interface Loan {
  id: string;
  livro_id: string;
  aluno_id: string;
  data_emprestimo: string;
  data_prevista_devolucao: string;
  data_devolucao: string | null;
  status: 'emprestado' | 'devolvido' | 'atrasado';
  created_at?: string;
  // Joined fields
  livro?: Book;
  aluno?: Student;
}

export interface DashboardStats {
  totalLivros: number;
  livrosDisponiveis: number;
  livrosEmprestados: number;
  emprestimosAtrasados: number;
  totalAlunos: number;
}
