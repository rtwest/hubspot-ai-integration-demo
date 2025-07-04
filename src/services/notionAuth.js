// Notion API Configuration
const NOTION_CONFIG = {
  apiKey: import.meta.env.VITE_NOTION_API_KEY,
  apiBase: 'https://api.notion.com/v1'
}

// Check if real Notion integration is configured
const isRealNotionConfigured = () => {
  return NOTION_CONFIG.apiKey && NOTION_CONFIG.apiKey !== 'your-notion-api-key'
}

// Simplified authentication - no OAuth needed with API key
export const authenticateNotion = () => {
  if (!isRealNotionConfigured()) {
    return new Promise((resolve, reject) => {
      // Create a realistic authentication popup simulation
      const popup = window.open(
        '/oauth-simulation.html',
        'notion-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )
      
      // Simulate the authentication flow
      setTimeout(() => {
        if (popup && !popup.closed) {
          // Send success message to parent window
          window.postMessage({
            type: 'NOTION_AUTH_SUCCESS',
            token: 'demo_token_' + Date.now()
          }, window.location.origin)
          
          popup.close()
        }
      }, 2000)
      
      // Listen for the message
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'NOTION_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage)
          resolve(event.data.token)
        } else if (event.data.type === 'NOTION_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage)
          reject(new Error(event.data.error))
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Handle popup closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          reject(new Error('Authentication popup was closed'))
        }
      }, 1000)
    })
  }
  
  // For real Notion integration, return success immediately
  return Promise.resolve('authenticated')
}

// Notion API Functions
export const createNotionPage = async (content, parentPageId = null) => {
  // If real Notion integration is not configured, simulate page creation
  if (!isRealNotionConfigured()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pageId = 'demo-page-' + Math.random().toString(36).substr(2, 9)
        const pageUrl = `https://notion.so/${pageId}`
        
        // Store the simulated page for later reference
        const demoPages = JSON.parse(localStorage.getItem('demo_notion_pages') || '[]')
        demoPages.push({
          id: pageId,
          url: pageUrl,
          title: 'Content from HubSpot AI Integration',
          content: content,
          parentPageId: parentPageId,
          createdAt: new Date().toISOString()
        })
        localStorage.setItem('demo_notion_pages', JSON.stringify(demoPages))
        
        resolve({
          success: true,
          pageUrl: pageUrl,
          pageId: pageId
        })
      }, 1500)
    })
  }
  
  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/notion-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create_page',
        content: content,
        parent_page_id: parentPageId,
        api_key: import.meta.env.VITE_NOTION_API_KEY
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion create page error:', errorData)
      throw new Error('Failed to create Notion page')
    }
    
    const data = await response.json()
    return {
      success: true,
      pageUrl: data.data?.url || data.url,
      pageId: data.data?.id || data.id
    }
  } catch (error) {
    console.error('Create page error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Utility to convert Notion page ID to UUID format
function toNotionUUID(id) {
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

function isValidNotionId(id) {
  // 32 hex chars, optionally with dashes
  return /^[0-9a-fA-F]{32}$/.test(id.replace(/-/g, ''));
}

export const updateNotionPage = async (pageUrl, content) => {
  // If real Notion integration is not configured, simulate page update with realistic details
  if (!isRealNotionConfigured()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extract page ID from URL and update the stored page
        const pageId = pageUrl.split('/').pop().split('?')[0]
        const demoPages = JSON.parse(localStorage.getItem('demo_notion_pages') || '[]')
        const pageIndex = demoPages.findIndex(page => page.id === pageId)
        
        if (pageIndex !== -1) {
          demoPages[pageIndex].content += '\n\n' + content
          demoPages[pageIndex].updatedAt = new Date().toISOString()
          localStorage.setItem('demo_notion_pages', JSON.stringify(demoPages))
        }
        
        resolve({
          success: true,
          pageUrl: pageUrl,
          pageId: pageId
        })
      }, 1500)
    })
  }
  
  try {
    // Extract page ID from URL
    const pageId = pageUrl.split('/').pop().split('?')[0]
    
    if (!isValidNotionId(pageId)) {
      throw new Error('Invalid Notion page ID')
    }
    
    const formattedPageId = toNotionUUID(pageId)
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/notion-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update_page',
        content: content,
        target_url: pageUrl,
        api_key: import.meta.env.VITE_NOTION_API_KEY
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion update page error:', errorData)
      throw new Error('Failed to update Notion page')
    }
    
    const data = await response.json()
    return {
      success: true,
      pageUrl: data.url,
      pageId: data.id
    }
  } catch (error) {
    console.error('Update page error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Utility to extract Notion page ID from any valid Notion URL
export function extractNotionPageId(url) {
  // Match 32 hex chars, with or without dashes
  const match = url.match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (!match) return null;
  // Remove dashes if present
  return match[0].replace(/-/g, '');
}

export async function appendToNotionPage(pageUrl, content) {
  const pageId = extractNotionPageId(pageUrl);
  console.log('Extracted Notion page ID:', pageId);
  if (!pageId) throw new Error('Invalid Notion page ID');
  
  // If real Notion integration is not configured, simulate appending content
  if (!isRealNotionConfigured()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extract page ID from URL and update the stored page
        const demoPages = JSON.parse(localStorage.getItem('demo_notion_pages') || '[]')
        const pageIndex = demoPages.findIndex(page => page.id === pageId)
        
        if (pageIndex !== -1) {
          demoPages[pageIndex].content += '\n\n' + content
          demoPages[pageIndex].updatedAt = new Date().toISOString()
          localStorage.setItem('demo_notion_pages', JSON.stringify(demoPages))
        }
        
        resolve({
          success: true,
          pageUrl: pageUrl,
          pageId: pageId
        })
      }, 1500)
    })
  }
  
  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/notion-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update_page',
        content: content,
        target_url: pageUrl,
        api_key: import.meta.env.VITE_NOTION_API_KEY
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion append to page error:', errorData)
      throw new Error('Failed to append to Notion page')
    }
    
    const data = await response.json()
    return {
      success: true,
      pageUrl: data.data?.url || pageUrl,
      pageId: data.data?.id || pageId
    }
  } catch (error) {
    console.error('Append to page error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Token management functions (simplified for API key approach)
export const storeNotionToken = (userId, token) => {
  localStorage.setItem(`notion_token_${userId}`, token)
}

export const getNotionToken = (userId) => {
  return localStorage.getItem(`notion_token_${userId}`)
}

export const removeNotionToken = (userId) => {
  localStorage.removeItem(`notion_token_${userId}`)
}

export const isTokenValid = async () => {
  // For API key approach, we assume the key is always valid
  return true
} 