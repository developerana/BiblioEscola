-- Allow users to update their own must_change_password field
CREATE POLICY "Users can update their own must_change_password"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);