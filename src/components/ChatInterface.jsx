import React, { useState, useRef, useEffect } from 'react'
import { usePolicy } from '../context/PolicyContext'
import { getAppIcon } from './AppIcons'
import { 
  Send, 
  Link, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Shield,
  Paperclip
} from 'lucide-react'
import {
  authenticateNotion,
  createNotionPage,
  updateNotionPage,
  appendToNotionPage,
  extractNotionPageId,
  storeNotionToken,
  getNotionToken,
  isTokenValid
} from '../services/notionAuth'
import {
  authenticateWithGoogle,
  createGoogleDriveFile,
  updateGoogleDriveFile,
  isGoogleDriveUrl,
  extractGoogleDriveFileId,
  getValidGoogleConnection
} from '../services/googleDriveAuth'

// Import configs for integration status check
const NOTION_CONFIG = {
  apiKey: import.meta.env.VITE_NOTION_API_KEY || 'your-notion-api-key'
}

const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here'
}

const ChatInterface = ({ uploadedFile, fileContent }) => {
  const { 
    getCurrentUserPolicy, 
    isAppAllowed, 
    addActiveConnection,
    removeActiveConnection,
    addUserIntegration
  } = usePolicy()
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you integrate with external tools like Notion and Google Drive. I can see you have a campaign report open. Try saying "send this to Notion" or "save this to Google Drive", or drag a Notion/Google Drive URL here!',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  const userPolicy = getCurrentUserPolicy()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (content, type = 'user') => {
    const newMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const isNotionUrl = (url) => {
    return url.includes('notion.so') || url.includes('notion.com')
  }

  const performNotionAuth = async () => {
    try {
      // Check if we already have a valid token
      const existingToken = getNotionToken('gabby')
      if (existingToken && await isTokenValid()) {
        return { success: true, accessToken: existingToken }
      }
      
      // Authenticate with Notion
      const result = await authenticateNotion()
      
      // Store token for future use
      const token = 'authenticated'
      storeNotionToken('gabby', token)
      
      return { success: true, accessToken: token }
    } catch (error) {
      console.error('Notion auth error:', error)
      return { success: false, error: error.message }
    }
  }

  const performGoogleOAuth = async () => {
    try {
      // Check for a valid connection first
      const validConnection = await getValidGoogleConnection()
      if (validConnection) {
        return { success: true, accessToken: validConnection.access_token, connectionId: validConnection.id }
      }
      const result = await authenticateWithGoogle()
      if (result.success) {
        // After OAuth, fetch the new connection
        const newConnection = await getValidGoogleConnection()
        return { success: true, accessToken: newConnection?.access_token, connectionId: newConnection?.id }
      } else {
        return { success: false, error: result.error || 'OAuth was cancelled' }
      }
    } catch (error) {
      console.error('Google OAuth error:', error)
      return { success: false, error: error.message }
    }
  }

  const transferContentToNotion = async (content, targetUrl = null) => {
    try {
      // Default parent page ID for mentions (your Seamless Integration Demo page)
      const defaultParentPageId = '224cd3375162804c881bee78377d53ce'
      
      if (targetUrl) {
        // Extract parent page ID from the URL for creating new pages under this parent
        const parentPageId = extractNotionPageId(targetUrl)
        console.log('Extracted parent page ID from URL:', parentPageId)
        
        // Create new page under the parent page
        return await createNotionPage(content, parentPageId)
      } else {
        // For mentions, use the default parent page
        console.log('Using default parent page for mention:', defaultParentPageId)
        return await createNotionPage(content, defaultParentPageId)
      }
    } catch (error) {
      console.error('Content transfer error:', error)
      return { success: false, error: error.message }
    }
  }

  const transferContentToGoogleDrive = async (content, targetUrl = null, accessToken) => {
    try {
      if (targetUrl) {
        const fileId = extractGoogleDriveFileId(targetUrl)
        if (!fileId) {
          throw new Error('Invalid Google Drive URL')
        }
        
        // Check if this is a folder URL
        if (targetUrl.includes('/folders/')) {
          // Create new file inside the folder
          const fileName = uploadedFile ? uploadedFile.name : 'Content from HubSpot AI Integration'
          return await createGoogleDriveFile(content, fileName, accessToken, fileId)
        } else {
          // Update existing file
          return await updateGoogleDriveFile(fileId, content, accessToken)
        }
      } else {
        // Create new file
        const fileName = uploadedFile ? uploadedFile.name : 'Content from HubSpot AI Integration'
        return await createGoogleDriveFile(content, fileName, accessToken)
      }
    } catch (error) {
      console.error('Google Drive content transfer error:', error)
      return { success: false, error: error.message }
    }
  }

  const handleIntegration = async (service, targetUrl = null) => {
    if (!fileContent) {
      addMessage(`Please select a file first to share to ${service}.`, 'assistant')
      return
    }

    if (!isAppAllowed(service)) {
      addMessage(`${service} integration is not allowed for your user group.`, 'assistant')
      return
    }

    setIsProcessing(true)

    // Step 1: OAuth Flow
    let oauthResult
    let isRealIntegration = false
    
    if (service === 'notion') {
      isRealIntegration = NOTION_CONFIG.apiKey !== 'your-notion-api-key'
      if (!isRealIntegration) {
        addMessage('Connecting to Notion... (Demo Mode)', 'assistant')
      } else {
        addMessage('Connecting to Notion... (API Key)', 'assistant')
      }
      oauthResult = await performNotionAuth()
    } else if (service === 'google-drive') {
      isRealIntegration = GOOGLE_CONFIG.clientId !== 'your_google_client_id_here'
      if (!isRealIntegration) {
        addMessage('Connecting to Google Drive... (Demo Mode)', 'assistant')
      } else {
        addMessage('Connecting to Google Drive... (OAuth)', 'assistant')
      }
      oauthResult = await performGoogleOAuth()
    }
    
    if (!oauthResult.success) {
      addMessage(`Failed to connect to ${service}: ${oauthResult.error}`, 'assistant')
      setIsProcessing(false)
      return
    }

    // Step 2: Content Transfer
    addMessage(`Sending content to ${service}...`, 'assistant')
    let transferResult
    
    if (service === 'notion') {
      transferResult = await transferContentToNotion(fileContent, targetUrl)
    } else if (service === 'google-drive') {
      transferResult = await transferContentToGoogleDrive(fileContent, targetUrl, oauthResult.accessToken)
    }
    
    if (!transferResult.success) {
      addMessage(`Failed to send content to ${service}. Please try again.`, 'assistant')
      setIsProcessing(false)
      return
    }

    // Step 3: Success and Policy Application
    const connectionId = 'conn_' + Date.now()
    const now = new Date().toISOString()
    
    // Add to active connections for immediate display
    const connection = {
      id: connectionId,
      user: 'Demo User',
      app: service,
      connectedAt: 'just now',
      status: 'Active',
      expiresAt: userPolicy.autoDisconnect ? 'Will auto-disconnect' : '24 hours'
    }
    addActiveConnection(connection)

    // Add to user integration history
    const userIntegration = {
      id: connectionId,
      app: service,
      connectedAt: now,
      lastActivity: now,
      status: userPolicy.autoDisconnect ? 'inactive' : 'active',
      // Always set contentPreview for Activity Log
      contentPreview: uploadedFile
        ? `${uploadedFile.name}: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`
        : fileContent.substring(0, 100) + (fileContent.length > 100 ? '...' : ''),
      ...(userPolicy.autoDisconnect 
        ? { reason: 'auto-disconnect policy' }
        : { 
            expiresAt: userPolicy.connectionDuration === 'persistent' 
              ? 'persistent' 
              : userPolicy.connectionDuration === '24h' 
                ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default to 24h
          }
      )
    }
    
    // Add to Gabby's integration history
    addUserIntegration('gabby', userIntegration)

    // Success messages
    const authMethod = isRealIntegration 
      ? (service === 'notion' ? ' (Personal API Key)' : ' (OAuth)')
      : ' (Demo Mode)'
    
    if (targetUrl) {
      if (service === 'notion') {
        addMessage(`✅ Content successfully created as a new page under your Notion page!${authMethod}\n\n📄 Parent page: ${targetUrl}\n📄 New page: ${transferResult.pageUrl}\n📝 Content: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
      } else if (service === 'google-drive') {
        if (targetUrl.includes('/folders/')) {
          addMessage(`✅ Content successfully saved to your Google Drive folder!${authMethod}\n\n📁 Folder: ${targetUrl}\n📄 New file: ${transferResult.webViewLink}\n📝 Content: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
        } else {
          addMessage(`✅ Content successfully added to your Google Drive file!${authMethod}\n\n📄 File: ${transferResult.webViewLink || targetUrl}\n📝 Content: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
        }
      }
    } else {
      if (service === 'notion') {
        addMessage(`✅ Content successfully sent to Notion!${authMethod}\n\n📄 New page created under your demo page: ${transferResult.pageUrl}\n📝 Content: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
      } else if (service === 'google-drive') {
        const folderInfo = targetUrl ? '' : '\n📁 Saved to default HubSpot AI Integration folder'
        addMessage(`✅ Content successfully saved to Google Drive!${authMethod}${folderInfo}\n\n📄 New file created: ${transferResult.webViewLink}\n📝 Content: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
      }
    }

    // Step 4: Policy Enforcement
    if (userPolicy.autoDisconnect && oauthResult.connectionId) {
      // Remove the connection from Supabase after use
      await supabase
        .from('oauth_connections')
        .delete()
        .eq('id', oauthResult.connectionId)
      setTimeout(() => {
        addMessage(`🔒 Connection closed for security (auto-disconnect policy)${authMethod}`, 'assistant')
        removeActiveConnection(connectionId)
      }, 3000)
    } else {
      addMessage(`🔗 Connection active for 24 hours per Sales team policy${authMethod}`, 'assistant')
    }

    setIsProcessing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const userMessage = inputValue.trim()
    addMessage(userMessage, 'user')
    setInputValue('')

    // Expanded intent detection for integrations
    const lowerMessage = userMessage.toLowerCase()
    const notionPatterns = [
      'send to notion',
      'share with notion',
      'put this in notion',
      'add to notion',
      'send this to notion',
      'save to notion',
      'notion'
    ]
    const googlePatterns = [
      'send to google',
      'save to google drive',
      'share with google',
      'put this in google drive',
      'add to google drive',
      'send this to google drive',
      'google drive',
      'google'
    ]
    const matchesPattern = (patterns) => patterns.some(p => lowerMessage.includes(p))

    if (matchesPattern(notionPatterns)) {
      addMessage('[debug] Detected Notion mention intent, triggering integration...', 'assistant')
      await handleIntegration('notion')
    } else if (matchesPattern(googlePatterns)) {
      addMessage('[debug] Detected Google Drive mention intent, triggering integration...', 'assistant')
      await handleIntegration('google-drive')
    } else {
      // Default assistant response
      addMessage('I can help you integrate with Notion and Google Drive! Try saying "send this to Notion" or "save this to Google Drive" to share the campaign report, or drag a Notion/Google Drive URL here.', 'assistant')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    // Reset cursor back to normal
    e.currentTarget.style.cursor = 'default'
    
    console.log('Drop event triggered')
    const url = e.dataTransfer.getData('text/plain')
    console.log('Dropped URL:', url)
    
    if (!url) {
      console.log('No URL found in drop data')
      return
    }

    addMessage(`Dropped URL: ${url}`, 'user')

    // Determine service and handle integration
    console.log('Checking if Notion URL:', isNotionUrl(url))
    console.log('Checking if Google Drive URL:', isGoogleDriveUrl(url))
    
    if (isNotionUrl(url)) {
      console.log('Processing Notion integration')
      handleIntegration('notion', url)
    } else if (isGoogleDriveUrl(url)) {
      console.log('Processing Google Drive integration')
      handleIntegration('google-drive', url)
    } else {
      console.log('URL not recognized as Notion or Google Drive')
      addMessage('I can only integrate with Notion and Google Drive URLs. Please try dropping a valid Notion or Google Drive URL.', 'assistant')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    console.log('Drag over event triggered')
    setIsDragOver(true)
    // Change cursor to electrical plug
    e.dataTransfer.dropEffect = 'copy'
    // Set custom cursor for electric plug
    e.currentTarget.style.cursor = 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMgMkwyMCA5TDEzIDE2TDEyIDE2TDUgOUwxMiAyWiIgZmlsbD0iIzAwNzNGQyIvPgo8cGF0aCBkPSJNMTIgMjJMMTMgMjJMMjAgMTVMMTMgOEwxMiA4TDUgMTVMMTIgMjJaIiBmaWxsPSIjMDA3M0ZDIi8+CjxwYXRoIGQ9Ik0xMiAxMkwxMyAxMkwxMyAxNkwxMiAxNkwxMiAxMloiIGZpbGw9IiMwMDczRkMiLz4KPC9zdmc+"), auto'
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    console.log('Drag leave event triggered')
    setIsDragOver(false)
    // Reset cursor back to normal
    e.currentTarget.style.cursor = 'default'
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'assistant':
        return <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">AI</span>
        </div>
      case 'user':
        return <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">U</span>
        </div>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-200 ${
          isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={(e) => {
          e.preventDefault();
          console.log('Drag enter detected');
        }}
        style={{
          minHeight: '300px' // Ensure minimum height for drop area
        }}
      >
        {isDragOver && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-blue-900 font-medium text-lg">Drop to Connect!</p>
            <p className="text-blue-700 text-sm mt-1">Drop a Notion or Google Drive URL to share content</p>
          </div>
        )}
        
        {!isDragOver && messages.length === 1 && (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Drop Zone Active</p>
            <p className="text-gray-500 text-sm mt-1">Drag a Notion or Google Drive URL here to test</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex space-x-3 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'assistant' && getMessageIcon('assistant')}
            <div
              className={`max-w-xs lg:max-w-lg xl:max-w-xl px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
            {message.type === 'user' && getMessageIcon('user')}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex space-x-3 justify-start">
            {getMessageIcon('assistant')}
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message or drag a URL here..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="1"
                disabled={isProcessing}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <Paperclip size={20} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
        
        {/* Policy Status */}
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>Policy: {userPolicy.connectionDuration}</span>
          {userPolicy.autoDisconnect && (
            <span className="text-gray-600">• Auto-disconnect enabled</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInterface 