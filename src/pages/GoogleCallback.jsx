import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Helper to get Supabase Edge Function base URL
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || ''

function getGoogleOAuthUrl() {
  if (SUPABASE_FUNCTIONS_URL) {
    return `${SUPABASE_FUNCTIONS_URL}/oauth-google`
  }
  return '/api/google/token'
}

const GoogleCallback = () => {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      // OAuth was cancelled or failed
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_CANCELLED',
        error: error
      }, window.location.origin)
      return
    }

    if (code) {
      // Exchange code for tokens
      exchangeCodeForTokens(code, state)
    }
  }, [searchParams])

  const exchangeCodeForTokens = async (code, state) => {
    try {
      const response = await fetch(getGoogleOAuthUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          state,
          redirect_uri: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/google/callback`
        })
      })

      if (response.ok) {
        const tokens = await response.json()
        
        // Send tokens back to parent window
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          tokens: tokens
        }, window.location.origin)
      } else {
        throw new Error('Failed to exchange code for tokens')
      }
    } catch (error) {
      console.error('Token exchange error:', error)
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_CANCELLED',
        error: 'Token exchange failed'
      }, window.location.origin)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connecting to Google Drive...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete the authentication.
        </p>
      </div>
    </div>
  )
}

export default GoogleCallback 