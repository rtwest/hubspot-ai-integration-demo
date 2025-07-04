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

    const { code, redirect_uri } = await req.json()

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('NOTION_CLIENT_ID')}:${Deno.env.get('NOTION_CLIENT_SECRET')}`)}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri || `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Notion OAuth error:', errorData)
      throw new Error('Failed to exchange code for tokens')
    }

    const tokenData = await tokenResponse.json()

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get user profile or create one
    let { data: userProfile } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
        })
      
      if (insertError) {
        console.error('Error creating user profile:', insertError)
      }
    }

    // Store OAuth connection
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    const { error: connectionError } = await supabaseClient
      .from('oauth_connections')
      .upsert({
        user_id: user.id,
        provider: 'notion',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        provider_user_id: tokenData.owner?.user?.id,
        provider_user_email: tokenData.owner?.user?.person?.email,
        scopes: tokenData.scope?.split(' ') || []
      }, {
        onConflict: 'user_id,provider'
      })

    if (connectionError) {
      console.error('Error storing OAuth connection:', connectionError)
      throw new Error('Failed to store connection')
    }

    // Log the activity
    await supabaseClient.rpc('log_integration_activity', {
      user_uuid: user.id,
      provider_name: 'notion',
      action_name: 'oauth_connect',
      success_status: true
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notion connected successfully',
        expires_at: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('OAuth error:', error)
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