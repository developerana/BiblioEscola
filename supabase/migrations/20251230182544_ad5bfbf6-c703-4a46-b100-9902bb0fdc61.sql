-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  loan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'emprestado' CHECK (status IN ('emprestado', 'devolvido', 'atrasado')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Books policies - authenticated users can read
CREATE POLICY "Authenticated users can view books"
ON public.books FOR SELECT
TO authenticated
USING (true);

-- Only admins and librarians can manage books
CREATE POLICY "Admins and librarians can insert books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'bibliotecario')
);

CREATE POLICY "Admins and librarians can update books"
ON public.books FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'bibliotecario')
);

CREATE POLICY "Admins and librarians can delete books"
ON public.books FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'bibliotecario')
);

-- Loans policies - authenticated users can read
CREATE POLICY "Authenticated users can view loans"
ON public.loans FOR SELECT
TO authenticated
USING (true);

-- Only admins and librarians can manage loans
CREATE POLICY "Admins and librarians can insert loans"
ON public.loans FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'bibliotecario')
);

CREATE POLICY "Admins and librarians can update loans"
ON public.loans FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'bibliotecario')
);

CREATE POLICY "Admins and librarians can delete loans"
ON public.loans FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'bibliotecario')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on books
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();