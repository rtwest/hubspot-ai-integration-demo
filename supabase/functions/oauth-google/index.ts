import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Ensure user exists in users table
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist in users table, create them
      const { error: createUserError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          role: 'end_user'
        })

      if (createUserError) {
        console.error('Error creating user:', createUserError)
        throw new Error('Failed to create user record')
      }
    } else if (userCheckError) {
      console.error('Error checking user:', userCheckError)
      throw new Error('Failed to check user record')
    }

    const { code, redirect_uri } = await req.json()

    console.log('Received request:', { code: code ? 'present' : 'missing', redirect_uri })

    if (!code) {
      throw new Error('Authorization code is required')
    }

    if (!redirect_uri) {
      throw new Error('Redirect URI is required')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Google OAuth error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData
      })
      throw new Error(`Google OAuth failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorData}`)
    }

    const tokenData = await tokenResponse.json()

    // Calculate expiration time
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    // Save tokens to database
    const { error: saveError } = await supabaseClient
      .from('oauth_connections')
      .upsert({
        user_id: user.id,
        provider: 'google',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (saveError) {
      console.error('Error saving OAuth connection:', saveError)
      throw new Error('Failed to save OAuth connection')
    }

    // Return the tokens to the frontend for storage
    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('OAuth error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 