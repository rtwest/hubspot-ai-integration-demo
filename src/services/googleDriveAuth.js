// Google Drive OAuth and API service

// Google OAuth Configuration
const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  redirectUri: `${window.location.origin}/auth/google/callback`,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token'
}

// Check if real Google OAuth is configured
export const isRealGoogleConfigured = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost'
  
  // In production, we should have a real client ID
  if (isProduction) {
    return !!(clientId && 
             clientId !== 'your_google_client_id_here' && 
             clientId !== '' &&
             clientId !== '719127172359-g7m7b3j7p9693me659ammt42g75pl6uu.apps.googleusercontent.com')
  }
  
  // In development, check if we have a real client ID (not the demo one)
  return !!(clientId && 
           clientId !== 'your_google_client_id_here' && 
           clientId !== '' &&
           clientId !== '719127172359-g7m7b3j7p9693me659ammt42g75pl6uu.apps.googleusercontent.com')
}

// Simulate Google OAuth popup
const simulateGoogleOAuth = () => {
  return new Promise((resolve) => {
    const popup = window.open(
      '/oauth-simulation.html?service=google',
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    // Remove the problematic popup.closed check for demo mode
    // Demo mode will rely on the message listener instead

    // Listen for OAuth completion message
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        resolve(event.data.tokens)
      } else if (event.data.type === 'GOOGLE_OAUTH_CANCELLED') {
        resolve(null)
      }
    })
  })
}

// Real Google OAuth flow
const performGoogleOAuth = () => {
  return new Promise((resolve) => {
    const state = Math.random().toString(36).substr(2, 9)
    const authUrl = `${GOOGLE_CONFIG.authUrl}?` + new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_CONFIG.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    })

    const popup = window.open(
      authUrl,
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    // Remove the problematic popup.closed check entirely
    // The message listener will handle OAuth completion

    // Listen for OAuth completion message
    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        // Remove the event listener first
        window.removeEventListener('message', messageHandler)
        resolve(event.data.tokens)
      } else if (event.data.type === 'GOOGLE_OAUTH_CANCELLED') {
        // Remove the event listener first
        window.removeEventListener('message', messageHandler)
        resolve(null)
      }
    }
    
    window.addEventListener('message', messageHandler)
    
    // Add a timeout to prevent hanging
    setTimeout(() => {
      window.removeEventListener('message', messageHandler)
      resolve(null)
    }, 300000) // 5 minute timeout
  })
}

// Main OAuth function
export const authenticateWithGoogle = async () => {
  console.log('Google OAuth configured:', isRealGoogleConfigured())
  
  if (!isRealGoogleConfigured()) {
    console.log('Using demo Google OAuth')
    const tokens = await simulateGoogleOAuth()
    return { success: true, accessToken: tokens.access_token }
  } else {
    console.log('Using real Google OAuth')
    const tokens = await performGoogleOAuth()
    if (tokens) {
      return { success: true, accessToken: tokens.access_token }
    } else {
      return { success: false, error: 'OAuth was cancelled' }
    }
  }
}

// Default Google Drive folder ID for when no specific parent is provided
const DEFAULT_GOOGLE_DRIVE_FOLDER_ID = '1d3Pgsywd7t3s3IHbxfmWY3GdZzsTrKFs'

// Helper to get Supabase Edge Function base URL
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || ''

function getGoogleApiUrl(path) {
  // In dev, you may want to proxy to /api/google/drive/files, but in prod use the full URL
  if (SUPABASE_FUNCTIONS_URL) {
    return `${SUPABASE_FUNCTIONS_URL}/google-api${path}`
  }
  return `/api/google/drive/files${path}`
}

// Create a new file in Google Drive
export const createGoogleDriveFile = async (content, fileName, accessToken, parentFolderId = null) => {
  // Use default folder if no parent folder is specified
  const targetFolderId = parentFolderId || DEFAULT_GOOGLE_DRIVE_FOLDER_ID
  console.log('Creating Google Drive file:', { fileName, parentFolderId, targetFolderId, isReal: isRealGoogleConfigured() })
  
  if (!isRealGoogleConfigured()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileId = 'demo-file-' + Math.random().toString(36).substr(2, 9)
        const fileUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing&resourcekey=0-${targetFolderId}`
        
        // Store the simulated file for later reference
        const demoFiles = JSON.parse(localStorage.getItem('demo_google_files') || '[]')
        demoFiles.push({
          id: fileId,
          name: fileName,
          url: fileUrl,
          content: content,
          parentFolderId: targetFolderId,
          createdAt: new Date().toISOString(),
          type: 'text/plain'
        })
        localStorage.setItem('demo_google_files', JSON.stringify(demoFiles))
        
        resolve({
          success: true,
          id: fileId,
          name: fileName,
          webViewLink: fileUrl,
          mimeType: 'text/plain',
          parentFolderId: targetFolderId
        })
      }, 1500)
    })
  }

  try {
    const response = await fetch(getGoogleApiUrl(''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessToken,
        fileName,
        content,
        parentFolderId: targetFolderId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive API error:', response.status, errorText)
      throw new Error(`Failed to create Google Drive file: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    console.error('Create Google Drive file error:', error)
    return { success: false, error: error.message || 'Failed to create Google Drive file' }
  }
}

// Upload content to an existing Google Drive file
export const updateGoogleDriveFile = async (fileId, content, accessToken) => {
  if (!isRealGoogleConfigured()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Update the stored file
        const demoFiles = JSON.parse(localStorage.getItem('demo_google_files') || '[]')
        const fileIndex = demoFiles.findIndex(f => f.id === fileId)
        if (fileIndex !== -1) {
          demoFiles[fileIndex].content = content
          demoFiles[fileIndex].updatedAt = new Date().toISOString()
          localStorage.setItem('demo_google_files', JSON.stringify(demoFiles))
        }
        
        resolve({
          success: true,
          id: fileId,
          updated: true
        })
      }, 1000)
    })
  }

  try {
    const response = await fetch(getGoogleApiUrl(`/${fileId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessToken,
        fileName,
        content
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update Google Drive file')
    }

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    console.error('Update Google Drive file error:', error)
    return { success: false, error: 'Failed to update Google Drive file' }
  }
}

// Extract file ID from Google Drive URL
export const extractGoogleDriveFileId = (url) => {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

// Check if URL is a valid Google Drive URL
export const isGoogleDriveUrl = (url) => {
  return url.includes('drive.google.com') && extractGoogleDriveFileId(url) !== null
} 