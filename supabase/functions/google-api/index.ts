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

    // Get user's Google OAuth connection
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
    let accessToken = connection.access_token
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

    const url = new URL(req.url)
    const path = url.pathname

    if (req.method === 'POST' && path.endsWith('/files')) {
      // Create a new file
      const { fileName, content, parentFolderId } = await req.json()

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
      const { content } = await req.json()

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