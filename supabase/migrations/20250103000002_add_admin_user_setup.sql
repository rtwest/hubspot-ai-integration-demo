-- Function to promote a user to admin role (for initial setup)
-- This function bypasses RLS for the initial admin setup
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update the user's role to admin
  UPDATE public.users 
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'end_user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a policy to allow users to view their own role
CREATE POLICY "Users can view their own role" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Add a policy to allow admin users to view all users
CREATE POLICY "Admin users can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  ); 