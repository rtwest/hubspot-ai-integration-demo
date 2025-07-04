// Google Drive OAuth and API service
import { supabase } from '../lib/supabase.js'

// Google OAuth Configuration
const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  redirectUri: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/google/callback`,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token'
}

// Check if real Google OAuth is configured
export const isRealGoogleConfigured = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost'
  
  // In production, treat the demo client ID as real for testing
  if (isProduction) {
    return !!(clientId && 
             clientId !== 'your_google_client_id_here' && 
             clientId !== '')
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
    console.log('[DEBUG] OAuth config - clientId:', GOOGLE_CONFIG.clientId ? 'set' : 'not set')
    console.log('[DEBUG] OAuth config - redirectUri:', GOOGLE_CONFIG.redirectUri)
    console.log('[DEBUG] OAuth config - scopes:', GOOGLE_CONFIG.scopes)
    const authUrl = `${GOOGLE_CONFIG.authUrl}?` + new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_CONFIG.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    })

    console.log('[DEBUG] Opening Google OAuth popup with URL:', authUrl)
    const popup = window.open(
      authUrl,
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      console.error('[DEBUG] Failed to open popup - popup blocked')
      // Popup was blocked - show user-friendly error
      console.error('[DEBUG] Popup blocked by browser')
      alert('Popup blocked! Please allow popups for this site and try again.\n\nTo allow popups:\n1. Click the popup blocker icon in your browser\n2. Select "Allow popups for this site"\n3. Try the integration again.')
      resolve(null)
      return
    }
    console.log('[DEBUG] Popup opened successfully')

    // Listen for OAuth completion message
    const messageHandler = (event) => {
      console.log('[DEBUG] Received message from popup:', event.data)
      if (event.origin !== window.location.origin) return
      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        console.log('[DEBUG] OAuth success, closing popup')
        // Remove the event listener first
        window.removeEventListener('message', messageHandler)
        popup.close()
        resolve(event.data.tokens)
      } else if (event.data.type === 'GOOGLE_OAUTH_CANCELLED') {
        console.log('[DEBUG] OAuth cancelled, closing popup')
        // Remove the event listener first
        window.removeEventListener('message', messageHandler)
        popup.close()
        resolve(null)
      }
    }
    
    window.addEventListener('message', messageHandler)
    
    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        console.log('[DEBUG] Popup was closed manually')
        clearInterval(checkClosed)
        window.removeEventListener('message', messageHandler)
        resolve(null)
      }
    }, 1000)
    
    // Add a timeout to prevent hanging
    setTimeout(() => {
      console.log('[DEBUG] OAuth timeout reached, closing popup')
      clearInterval(checkClosed)
      window.removeEventListener('message', messageHandler)
      popup.close()
      resolve(null)
    }, 60000) // 1 minute timeout
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
    console.log('[DEBUG] Starting real Google OAuth flow')
    const tokens = await performGoogleOAuth()
    console.log('[DEBUG] OAuth flow completed, tokens:', tokens ? 'received' : 'none')
    if (tokens) {
      console.log('[DEBUG] OAuth successful, returning access token')
      return { success: true, accessToken: tokens.access_token }
    } else {
      console.log('[DEBUG] OAuth failed or cancelled')
      return { success: false, error: 'OAuth was cancelled' }
    }
  }
}

// Default Google Drive folder ID for when no specific parent is provided
const DEFAULT_GOOGLE_DRIVE_FOLDER_ID = '1d3Pgsywd7t3s3IHbxfmWY3GdZzsTrKFs'

// Helper to get Supabase Edge Function base URL
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || ''

function getGoogleApiUrl(path) {
  if (import.meta.env.PROD) {
    return `https://gvqsvvfvcurzgfwbjutq.functions.supabase.co/google-api${path}`;
  }
  return `/api/google/drive/files${path}`;
}

// Helper to get current user ID
async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Create a new file in Google Drive
export const createGoogleDriveFile = async (content, fileName, accessToken, parentFolderId = null, isReauthAttempt = false) => {
  const targetFolderId = parentFolderId || DEFAULT_GOOGLE_DRIVE_FOLDER_ID;
  const userId = await getCurrentUserId();
  console.log('Creating Google Drive file:', { fileName, parentFolderId, targetFolderId, isReal: isRealGoogleConfigured(), isReauthAttempt })
  
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
    // Get the Supabase JWT
    const { data: { session } } = await supabase.auth.getSession()
    const jwt = session?.access_token

    const response = await fetch(getGoogleApiUrl('/files'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      },
      body: JSON.stringify({
        accessToken,
        fileName,
        content,
        parentFolderId: targetFolderId,
        isReauthAttempt
      })
    })

    console.log('[DEBUG] Frontend sending request with isReauthAttempt:', isReauthAttempt)
    console.log('[DEBUG] Frontend request body:', {
      accessToken: accessToken ? 'present' : 'missing',
      fileName,
      content: content ? 'present' : 'missing',
      parentFolderId: targetFolderId,
      isReauthAttempt
    })

    if (!response.ok) {
      let errorText = await response.text();
      let backendError = '';
      try {
        const errorJson = JSON.parse(errorText);
        backendError = errorJson.error || '';
      } catch (e) {
        backendError = errorText;
      }
      console.error('Google Drive API error:', response.status, errorText)
      throw new Error(backendError ? backendError : `Failed to create Google Drive file: ${response.status}`)
    }

    const data = await response.json()
    if (response.status === 403) {
      throw new Error('Re-authentication required by admin policy. Please reconnect to Google Drive.');
    }
    return { success: true, ...data }
  } catch (error) {
    console.error('Create Google Drive file error:', error)
    return { success: false, error: error.message || 'Failed to create Google Drive file' }
  }
}

// Upload content to an existing Google Drive file
export const updateGoogleDriveFile = async (fileId, content, accessToken) => {
  const userId = await getCurrentUserId();
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
    // Get the Supabase JWT
    const { data: { session } } = await supabase.auth.getSession()
    const jwt = session?.access_token

    const response = await fetch(getGoogleApiUrl(`/files/${fileId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
      },
      body: JSON.stringify({
        accessToken,
        fileName: undefined, // Not needed for update
        content
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update Google Drive file')
    }

    const data = await response.json()
    if (response.status === 403) {
      throw new Error('Re-authentication required by admin policy. Please reconnect to Google Drive.');
    }
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

// Helper to check for a valid Google connection
export const getValidGoogleConnection = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single()
  if (error || !data) return null
  // Check if token is expired
  if (data.expires_at && new Date(data.expires_at) > new Date()) {
    return data
  }
  return null
} 