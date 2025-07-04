-- Add INSERT policy for users table to allow users to create their own profile
-- (Only if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" ON public.users
          FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;
