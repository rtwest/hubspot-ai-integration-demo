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

    // Get user's Notion connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'notion')
      .single()

    if (connectionError || !connection) {
      throw new Error('Notion connection not found')
    }

    // Check if token is expired
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      throw new Error('Notion token expired')
    }

    const { action, content, target_url } = await req.json()

    let notionResponse
    let success = false
    let errorMessage = null

    try {
      switch (action) {
        case 'create_page':
          notionResponse = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              parent: { type: 'workspace' },
              properties: {
                title: {
                  title: [
                    {
                      text: {
                        content: 'Content from HubSpot AI Integration'
                      }
                    }
                  ]
                }
              },
              children: [
                {
                  object: 'block',
                  type: 'paragraph',
                  paragraph: {
                    rich_text: [
                      {
                        type: 'text',
                        text: {
                          content: content
                        }
                      }
                    ]
                  }
                }
              ]
            })
          })
          break

        case 'update_page':
          if (!target_url) {
            throw new Error('Target URL is required for page updates')
          }
          
          // Extract page ID from URL
          const pageId = target_url.split('/').pop()?.split('?')[0]
          if (!pageId) {
            throw new Error('Invalid Notion page URL')
          }

          notionResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              children: [
                {
                  object: 'block',
                  type: 'paragraph',
                  paragraph: {
                    rich_text: [
                      {
                        type: 'text',
                        text: {
                          content: content
                        }
                      }
                    ]
                  }
                }
              ]
            })
          })
          break

        default:
          throw new Error('Invalid action')
      }

      if (notionResponse.ok) {
        success = true
        const responseData = await notionResponse.json()
        
        // Log successful activity
        await supabaseClient.rpc('log_integration_activity', {
          user_uuid: user.id,
          provider_name: 'notion',
          action_name: action,
          content_preview: content?.substring(0, 100),
          target_url: target_url,
          success_status: true
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: responseData,
            message: 'Notion operation completed successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
        errorMessage = await notionResponse.text()
        throw new Error(`Notion API error: ${notionResponse.status}`)
      }

    } catch (apiError) {
      errorMessage = apiError.message
      success = false
    }

    // Log failed activity
    await supabaseClient.rpc('log_integration_activity', {
      user_uuid: user.id,
      provider_name: 'notion',
      action_name: action,
      content_preview: content?.substring(0, 100),
      target_url: target_url,
      success_status: false,
      error_msg: errorMessage
    })

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )

  } catch (error) {
    console.error('Notion API error:', error)
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