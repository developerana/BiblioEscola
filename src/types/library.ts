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


export interface Loan {
  id: string;
  livro_id: string;
  aluno_nome: string;
  aluno_turma: string;
  data_emprestimo: string;
  data_prevista_devolucao: string;
  data_devolucao: string | null;
  status: 'emprestado' | 'devolvido' | 'atrasado';
  created_at?: string;
  // Joined fields
  livro?: Book;
}

export interface DashboardStats {
  totalLivros: number;
  livrosDisponiveis: number;
  livrosEmprestados: number;
  emprestimosAtrasados: number;
}
