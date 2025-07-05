import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

// Simulate fetching the latest user policy (replace with real DB/API call in production)
async function fetchLatestUserPolicy(supabaseClient, userId, provider) {
  // 1. Get the user's role
  const { data: user, error: userError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  if (userError || !user) throw new Error('User not found');

  // 2. Get the policy for this role and provider
  const { data: policy, error: policyError } = await supabaseClient
    .from('connection_policies')
    .select('connection_duration_hours, auto_disconnect, allowed')
    .eq('role', user.role)
    .eq('provider', provider)
    .single();
  if (policyError || !policy) throw new Error('Policy not found');

  return {
    autoDisconnect: policy.auto_disconnect,
    connectionDurationHours: policy.connection_duration_hours,
    allowed: policy.allowed
  };
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

    let isReauthAttempt = false;
    // Parse request body to get access token if provided
    let requestBody = null;
    let accessTokenFromRequest = null;
    if (req.method === 'POST' || req.method === 'PATCH') {
      try {
        requestBody = await req.json();
        accessTokenFromRequest = requestBody?.accessToken;
        isReauthAttempt = !!requestBody?.isReauthAttempt;
        console.log('[DEBUG] Backend received isReauthAttempt:', isReauthAttempt, 'from request body:', requestBody);
      } catch (e) {
        // Request body might not be JSON or might be empty
      }
    }

    // Always fetch and check the latest policy for the user/role/provider
    const userPolicy = await fetchLatestUserPolicy(supabaseClient, user.id, 'google');
    console.log('[DEBUG] Backend policy check - autoDisconnect:', userPolicy.autoDisconnect, 'isReauthAttempt:', isReauthAttempt);
    if (userPolicy.autoDisconnect && !isReauthAttempt) {
      console.log('[DEBUG] Backend blocking request due to auto-disconnect policy');
      return new Response(
        JSON.stringify({ success: false, error: 'Auto-disconnect policy enforced: must re-authenticate.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    console.log('[DEBUG] Backend allowing request - policy check passed');

    // Declare accessToken variable
    let accessToken: string;

    // If access token is provided in request, use it directly (for re-authentication)
    if (accessTokenFromRequest) {
      // Use the provided access token directly
      accessToken = accessTokenFromRequest;
    } else {
      // Get user's Google OAuth connection from database
      const { data: connection, error: connectionError } = await supabaseClient
        .from('oauth_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()

      if (connectionError || !connection) {
        throw new Error('Google OAuth connection not found')
      }

      // Check if token is expired and refresh if needed
      accessToken = connection.access_token
      if (new Date(connection.expires_at) <= new Date()) {
        if (!connection.refresh_token) {
          throw new Error('Token expired and no refresh token available')
        }

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token'
          })
        })

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token')
        }

        const refreshData = await refreshResponse.json()
        accessToken = refreshData.access_token

        // Update the connection with new token
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in)

        await supabaseClient
          .from('oauth_connections')
          .update({
            access_token: accessToken,
            expires_at: expiresAt.toISOString()
          })
          .eq('user_id', user.id)
          .eq('provider', 'google')
      }
    }

    const url = new URL(req.url)
    const path = url.pathname

    if (req.method === 'POST' && path.endsWith('/files')) {
      // Create a new file
      const { fileName, content, parentFolderId } = requestBody as any || {}

      const fileMetadata = {
        name: fileName,
        mimeType: 'text/plain',
        parents: [parentFolderId] // Always include parent folder (default folder if none specified)
      }

      // Create the file
      const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/related; boundary=boundary'
        },
        body: `--boundary
Content-Type: application/json; charset=UTF-8

${JSON.stringify(fileMetadata)}

--boundary
Content-Type: text/plain

${content}

--boundary--`
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.text()
        console.error('Google Drive create error:', errorData)
        throw new Error('Failed to create Google Drive file')
      }

      const fileData = await createResponse.json()

      // Log the activity
      await supabaseClient.rpc('log_integration_activity', {
        user_uuid: user.id,
        provider_name: 'google',
        action_name: 'create_file',
        success_status: true
      })

      return new Response(
        JSON.stringify({
          success: true,
          id: fileData.id,
          name: fileData.name,
          webViewLink: fileData.webViewLink,
          mimeType: fileData.mimeType,
          parentFolderId: parentFolderId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } else if (req.method === 'PATCH' && path.includes('/files/')) {
      // Update an existing file
      const fileId = path.split('/files/')[1]
      const { content } = requestBody as any || {}

      const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: content
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.text()
        console.error('Google Drive update error:', errorData)
        throw new Error('Failed to update Google Drive file')
      }

      const fileData = await updateResponse.json()

      // Log the activity
      await supabaseClient.rpc('log_integration_activity', {
        user_uuid: user.id,
        provider_name: 'google',
        action_name: 'update_file',
        success_status: true
      })

      return new Response(
        JSON.stringify({
          success: true,
          id: fileData.id,
          updated: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } else {
      throw new Error('Method not allowed')
    }

  } catch (error) {
    console.error('Google API error:', error)
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