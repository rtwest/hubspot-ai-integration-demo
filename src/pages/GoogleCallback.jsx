import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, googleOAuth } from '../lib/supabase.js'

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
      const tokens = await googleOAuth.exchangeCode(code)
      // Send tokens back to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_SUCCESS',
        tokens: tokens
      }, window.location.origin)
      window.close()
    } catch (error) {
      console.error('Token exchange error:', error)
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_CANCELLED',
        error: 'Token exchange failed'
      }, window.location.origin)
      window.close()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900"></div>
        </div>
        <div className="max-w-sm">
          <h2 className="text-2xl font-medium text-gray-900 mb-3">
            Connecting to Google Drive
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Please wait while we complete the authentication process. This window will close automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GoogleCallback 