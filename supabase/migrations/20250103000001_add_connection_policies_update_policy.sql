-- Add UPDATE policy for connection_policies table to allow admin users to modify policies
CREATE POLICY "Admin users can update connection policies" ON public.connection_policies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Also add INSERT policy for admin users to create new policies if needed
CREATE POLICY "Admin users can insert connection policies" ON public.connection_policies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add DELETE policy for admin users to remove policies if needed
CREATE POLICY "Admin users can delete connection policies" ON public.connection_policies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  ); 