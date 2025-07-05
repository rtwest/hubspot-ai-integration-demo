import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  // Always initialize supabaseClient at the top
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  try {
    // Always parse the body first
    const { action, content, target_url, parent_page_id, api_key, isReauthAttempt } = await req.json()
    
    // If no API key in body, require Authorization header
    if (!api_key) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing authorization header' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        )
      }
    }

    // Use API key from request if provided, otherwise use environment variable
    const notionApiKey = api_key || Deno.env.get('VITE_NOTION_API_KEY')
    
    if (!notionApiKey) {
      throw new Error('Notion API key not provided')
    }

    // Get current user (simulate, since Notion API key flow may not have user auth)
    // If you have user auth, fetch userId from JWT or session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    // ENFORCE POLICY: Fetch latest policy and reject if autoDisconnect is true
    const userPolicy = await fetchLatestUserPolicy(supabaseClient, user.id, 'notion');
    console.log('[DEBUG] Backend received isReauthAttempt:', isReauthAttempt, 'from request body');
    console.log('[DEBUG] Backend policy check - autoDisconnect:', userPolicy.autoDisconnect, 'isReauthAttempt:', isReauthAttempt);
    if (userPolicy.autoDisconnect && !isReauthAttempt) {
      console.log('[DEBUG] Backend blocking request due to auto-disconnect policy');
      return new Response(
        JSON.stringify({ success: false, error: 'Auto-disconnect policy enforced: must re-authenticate.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    console.log('[DEBUG] Backend allowing request - policy check passed');

    let notionResponse
    let success = false
    let errorMessage = null

    try {
      switch (action) {
        case 'create_page':
          // Determine parent configuration
          let parentConfig
          if (parent_page_id && parent_page_id !== null && parent_page_id !== undefined && parent_page_id !== '') {
            // Convert page ID to proper UUID format for Notion API
            const formatPageId = (id) => {
              const clean = id.replace(/-/g, '');
              if (clean.length !== 32) return id;
              return [
                clean.substr(0, 8),
                clean.substr(8, 4),
                clean.substr(12, 4),
                clean.substr(16, 4),
                clean.substr(20)
              ].join('-');
            };
            
            const formattedParentId = formatPageId(parent_page_id)
            // Create page under specific parent page
            parentConfig = { page_id: formattedParentId }
          } else {
            // Create page in workspace
            parentConfig = { workspace: true }
          }
          
          const requestBody = {
            parent: parentConfig,
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
          }
          
          notionResponse = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          })
          break

        case 'update_page':
          if (!target_url) {
            throw new Error('Target URL is required for page updates')
          }
          
          // Extract page ID from URL and format as UUID
          const pageId = target_url.split('/').pop()?.split('?')[0]
          if (!pageId) {
            throw new Error('Invalid Notion page URL')
          }
          
          // Convert to proper UUID format if needed
          const formatPageId = (id) => {
            const clean = id.replace(/-/g, '');
            if (clean.length !== 32) return id;
            return [
              clean.substr(0, 8),
              clean.substr(8, 4),
              clean.substr(12, 4),
              clean.substr(16, 4),
              clean.substr(20)
            ].join('-');
          }
          
          const formattedPageId = formatPageId(pageId)

          notionResponse = await fetch(`https://api.notion.com/v1/blocks/${formattedPageId}/children`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
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
        // Try to get the full error message from Notion
        let errorText = await notionResponse.text()
        let errorJson
        try {
          errorJson = JSON.parse(errorText)
        } catch (e) {
          errorJson = { error: errorText }
        }
        errorMessage = errorJson
        throw new Error(`Notion API error: ${notionResponse.status} - ${JSON.stringify(errorJson)}`)
      }

    } catch (apiError) {
      errorMessage = apiError.message
      success = false
    }

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