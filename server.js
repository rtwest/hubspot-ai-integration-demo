import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Proxy endpoint for Notion OAuth token exchange
app.post('/api/notion/token', async (req, res) => {
  try {
    const { code, clientId, clientSecret, redirectUri } = req.body
    
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion OAuth error:', errorData)
      return res.status(response.status).json({ error: 'OAuth token exchange failed' })
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Token exchange error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for creating Notion pages
app.post('/api/notion/pages', async (req, res) => {
  try {
    const { parentPageId, content } = req.body
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY
    
    console.log('Notion create page request:', { parentPageId, hasContent: !!content, hasApiKey: !!notionApiKey })
    
    // For demo purposes, if no parent page is specified (mention use case), return demo response
    if (parentPageId === null || parentPageId === undefined || parentPageId === '') {
      console.log('Returning demo response for mention use case')
      // Return a demo response for the mention use case
      const demoPageId = 'demo-page-' + Math.random().toString(36).substr(2, 9)
      const demoPageUrl = `https://notion.so/${demoPageId}`
      
      return res.json({
        id: demoPageId,
        url: demoPageUrl,
        title: 'Content from HubSpot AI Integration',
        content: content,
        created_time: new Date().toISOString()
      })
    }
    
    if (!notionApiKey) {
      return res.status(500).json({ error: 'Notion API key not configured. Please set NOTION_API_KEY or VITE_NOTION_API_KEY in your environment variables.' })
    }
    
    console.log('Calling real Notion API with parentPageId:', parentPageId)
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
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
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion create page error:', errorData)
      return res.status(response.status).json({ error: 'Failed to create Notion page' })
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Create page error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for updating Notion pages
app.patch('/api/notion/pages/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params
    const { content } = req.body
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY
    
    if (!notionApiKey) {
      return res.status(500).json({ error: 'Notion API key not configured. Please set NOTION_API_KEY or VITE_NOTION_API_KEY in your environment variables.' })
    }
    
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: {
            title: [
              {
                text: {
                  content: 'Updated Content from HubSpot AI Integration'
                }
              }
            ]
          }
        }
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion update page error:', errorData)
      return res.status(response.status).json({ error: 'Failed to update Notion page' })
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Update page error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for appending content to Notion pages
app.patch('/api/notion/blocks/:pageId/children', async (req, res) => {
  try {
    const { pageId } = req.params
    const { content } = req.body
    const notionApiKey = process.env.NOTION_API_KEY || process.env.VITE_NOTION_API_KEY
    
    if (!notionApiKey) {
      return res.status(500).json({ error: 'Notion API key not configured. Please set NOTION_API_KEY or VITE_NOTION_API_KEY in your environment variables.' })
    }
    
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
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
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion update page error:', errorData)
      return res.status(response.status).json({ error: 'Failed to update Notion page' })
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Update page error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for Google OAuth token exchange
app.post('/api/google/token', async (req, res) => {
  try {
    const { code, clientId, clientSecret, redirectUri } = req.body
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId || process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: clientSecret || process.env.VITE_GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google token exchange error:', errorData)
      return res.status(response.status).json({ error: 'Failed to exchange code for tokens' })
    }
    
    const tokenData = await response.json()
    res.json(tokenData)
  } catch (error) {
    console.error('Google token exchange error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for creating Google Drive files
app.post('/api/google/drive/files', async (req, res) => {
  try {
    const { accessToken, fileName, content, parentFolderId } = req.body
    
    console.log('Creating Google Drive file:', { fileName, parentFolderId, hasToken: !!accessToken })
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' })
    }
    
    // First, create the file metadata
    const fileMetadata = {
      name: fileName,
      mimeType: 'text/plain'
    }
    
    // Add parent folder if specified
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId]
    }
    
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
      console.error('Google Drive create file error:', createResponse.status, errorData)
      
      if (createResponse.status === 401) {
        return res.status(401).json({ error: 'Invalid or expired access token. Please re-authenticate.' })
      }
      
      return res.status(createResponse.status).json({ 
        error: 'Failed to create Google Drive file',
        details: errorData
      })
    }
    
    const fileData = await createResponse.json()
    console.log('Google Drive file created successfully:', fileData.id)
    res.json(fileData)
  } catch (error) {
    console.error('Google Drive create file error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for updating Google Drive files
app.patch('/api/google/drive/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params
    const { accessToken, content } = req.body
    
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
      console.error('Google Drive update file error:', errorData)
      return res.status(updateResponse.status).json({ error: 'Failed to update Google Drive file' })
    }
    
    const fileData = await updateResponse.json()
    res.json(fileData)
  } catch (error) {
    console.error('Google Drive update file error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy endpoint for validating Notion tokens
app.get('/api/notion/users/me', async (req, res) => {
  try {
    const { accessToken } = req.query
    
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      }
    })
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Invalid token' })
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Token validation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`OAuth proxy server running on port ${PORT}`)
}) 