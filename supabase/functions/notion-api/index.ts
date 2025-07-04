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
    // Always parse the body first
    const { action, content, target_url, parent_page_id, api_key } = await req.json()
    
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