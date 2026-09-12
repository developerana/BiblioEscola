DROP POLICY "Admins and librarians can delete books" ON public.books;
CREATE POLICY "Admins can delete books" ON public.books FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));