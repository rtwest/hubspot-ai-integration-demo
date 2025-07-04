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
      <div className="text-center">
        <Loader className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Completing Notion Authorization
        </h2>
        <p className="text-sm text-gray-600">
          Please wait while we complete the connection...
        </p>
      </div>
    </div>
  )
}

export default NotionCallback 