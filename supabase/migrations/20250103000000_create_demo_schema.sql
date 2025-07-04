-- Create tables for HubSpot AI Integration Demo

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'end_user' CHECK (role IN ('admin', 'sales', 'marketing', 'customer_success', 'end_user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth connections table
CREATE TABLE IF NOT EXISTS public.oauth_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('notion', 'google', 'slack')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  provider_user_id TEXT,
  provider_user_email TEXT,
  scopes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Connection policies table
CREATE TABLE IF NOT EXISTS public.connection_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales', 'marketing', 'customer_success', 'end_user')),
  provider TEXT NOT NULL CHECK (provider IN ('notion', 'google', 'slack')),
  connection_duration_hours INTEGER DEFAULT 24,
  auto_disconnect BOOLEAN DEFAULT FALSE,
  allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, provider)
);

-- Integration activities table
CREATE TABLE IF NOT EXISTS public.integration_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('notion', 'google', 'slack')),
  action TEXT NOT NULL,
  content_preview TEXT,
  target_url TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default policies
INSERT INTO public.connection_policies (role, provider, connection_duration_hours, auto_disconnect, allowed) VALUES
  ('sales', 'notion', 24, FALSE, TRUE),
  ('sales', 'google', 24, FALSE, TRUE),
  ('sales', 'slack', 24, FALSE, TRUE),
  ('marketing', 'notion', 0, TRUE, TRUE),
  ('marketing', 'google', 0, TRUE, TRUE),
  ('marketing', 'slack', 0, TRUE, TRUE),
  ('customer_success', 'notion', 168, FALSE, TRUE), -- 7 days
  ('customer_success', 'google', 168, FALSE, TRUE),
  ('customer_success', 'slack', 168, FALSE, TRUE),
  ('admin', 'notion', 8760, FALSE, TRUE), -- 1 year
  ('admin', 'google', 8760, FALSE, TRUE),
  ('admin', 'slack', 8760, FALSE, TRUE),
  ('end_user', 'notion', 24, FALSE, TRUE),
  ('end_user', 'google', 24, FALSE, TRUE),
  ('end_user', 'slack', 24, FALSE, TRUE)
ON CONFLICT (role, provider) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for oauth_connections
CREATE POLICY "Users can view their own connections" ON public.oauth_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections" ON public.oauth_connections
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for connection_policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view policies" ON public.connection_policies
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for integration_activities
CREATE POLICY "Users can view their own activities" ON public.integration_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities" ON public.integration_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for managing connections
CREATE OR REPLACE FUNCTION public.get_user_connections(user_uuid UUID)
RETURNS TABLE (
  provider TEXT,
  connected BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_disconnect BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.provider,
    oc.id IS NOT NULL AS connected,
    oc.expires_at,
    cp.auto_disconnect
  FROM public.connection_policies cp
  LEFT JOIN public.oauth_connections oc ON oc.provider = cp.provider AND oc.user_id = user_uuid
  WHERE cp.role = (SELECT role FROM public.users WHERE id = user_uuid)
    AND cp.allowed = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired connections
CREATE OR REPLACE FUNCTION public.cleanup_expired_connections()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.oauth_connections 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log integration activity
CREATE OR REPLACE FUNCTION public.log_integration_activity(
  user_uuid UUID,
  provider_name TEXT,
  action_name TEXT,
  success_status BOOLEAN,
  content_preview TEXT DEFAULT NULL,
  target_url TEXT DEFAULT NULL,
  error_msg TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.integration_activities (
    user_id, provider, action, content_preview, target_url, success, error_message
  ) VALUES (
    user_uuid, provider_name, action_name, content_preview, target_url, success_status, error_msg
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_connections_user_provider ON public.oauth_connections(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_expires_at ON public.oauth_connections(expires_at);
CREATE INDEX IF NOT EXISTS idx_integration_activities_user_created ON public.integration_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_policies_role_provider ON public.connection_policies(role, provider); 