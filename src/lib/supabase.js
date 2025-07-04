import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for OAuth flows
export const notionOAuth = {
  // Get Notion OAuth URL
  getAuthUrl: () => {
    const clientId = import.meta.env.VITE_NOTION_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/notion/callback`
    
    return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`
  },

  // Exchange code for tokens
  exchangeCode: async (code) => {
    const { data, error } = await supabase.functions.invoke('oauth-notion', {
      body: { code, redirect_uri: `${window.location.origin}/auth/notion/callback` }
    })
    
    if (error) throw error
    return data
  }
}

export const googleOAuth = {
  // Get Google OAuth URL
  getAuthUrl: () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scope = 'https://www.googleapis.com/auth/drive.file'
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=code&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`
  },

  // Exchange code for tokens
  exchangeCode: async (code) => {
    const { data, error } = await supabase.functions.invoke('oauth-google', {
      body: { code, redirect_uri: `${window.location.origin}/auth/google/callback` }
    })
    
    if (error) throw error
    return data
  }
}

// Helper functions for API operations
export const notionAPI = {
  createPage: async (content) => {
    const { data, error } = await supabase.functions.invoke('notion-api', {
      body: { action: 'create_page', content }
    })
    
    if (error) throw error
    return data
  },

  updatePage: async (content, targetUrl) => {
    const { data, error } = await supabase.functions.invoke('notion-api', {
      body: { action: 'update_page', content, target_url: targetUrl }
    })
    
    if (error) throw error
    return data
  }
}

// Helper functions for user management
export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  },

  // Get user's connections
  getConnections: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase.rpc('get_user_connections', {
      user_uuid: user.id
    })

    if (error) throw error
    return data
  },

  // Update user role (admin only)
  updateRole: async (userId, role) => {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) throw error
    return data
  }
}

// Helper functions for admin operations
export const adminAPI = {
  // Get all users (admin only)
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get all connections (admin only)
  getConnections: async () => {
    const { data, error } = await supabase
      .from('oauth_connections')
      .select(`
        *,
        users (email, full_name, role)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get integration activities (admin only)
  getActivities: async () => {
    const { data, error } = await supabase
      .from('integration_activities')
      .select(`
        *,
        users (email, full_name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data
  },

  // Update connection policy
  updatePolicy: async (role, provider, policy) => {
    const { data, error } = await supabase
      .from('connection_policies')
      .update(policy)
      .eq('role', role)
      .eq('provider', provider)

    if (error) throw error
    return data
  }
} 