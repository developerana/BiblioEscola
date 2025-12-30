
-- Drop existing restrictive policies for loans
DROP POLICY IF EXISTS "Admins and librarians can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Admins and librarians can update loans" ON public.loans;

-- Create new policies that include 'user' role for loans
CREATE POLICY "Authenticated users can insert loans" 
ON public.loans 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'bibliotecario'::app_role) OR 
  has_role(auth.uid(), 'user'::app_role)
);

CREATE POLICY "Authenticated users can update loans" 
ON public.loans 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'bibliotecario'::app_role) OR 
  has_role(auth.uid(), 'user'::app_role)
);

-- Drop existing restrictive policy for books update
DROP POLICY IF EXISTS "Admins and librarians can update books" ON public.books;

-- Create new policy that includes 'user' role for updating books (needed for available_quantity)
CREATE POLICY "Authenticated users can update books" 
ON public.books 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'bibliotecario'::app_role) OR 
  has_role(auth.uid(), 'user'::app_role)
);
