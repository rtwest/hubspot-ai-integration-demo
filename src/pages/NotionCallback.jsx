import React, { useEffect } from 'react'
import { Loader } from 'lucide-react'

const NotionCallback = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (error) {
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'NOTION_OAUTH_ERROR',
        error: error
      }, window.location.origin)
    } else if (code) {
      // Send success message to parent window
      window.opener?.postMessage({
        type: 'NOTION_OAUTH_SUCCESS',
        code: code
      }, window.location.origin)
    }
    
    // Let the popup handle its own closing
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-6">
          <Loader className="w-16 h-16 animate-spin text-gray-600" />
        </div>
        <div className="max-w-sm">
          <h2 className="text-2xl font-medium text-gray-900 mb-3">
            Connecting to Notion
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Please wait while we complete the authentication process. This window will close automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotionCallback 