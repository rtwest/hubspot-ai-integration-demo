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
  Paperclip,
  Sparkles,
  Plug
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
import { supabase } from '../lib/supabase.js'

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
    addUserIntegration,
    currentUserGroup,
    fetchLatestUserPolicy
  } = usePolicy()
  console.log('[DEBUG] usePolicy context:', usePolicy())
  console.log('[DEBUG] fetchLatestUserPolicy:', fetchLatestUserPolicy, typeof fetchLatestUserPolicy)
  
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
  const [policyInfo, setPolicyInfo] = useState({ connectionDuration: '24h', autoDisconnect: false })
  const [lastPolicyCheck, setLastPolicyCheck] = useState(0)
  const POLICY_CHECK_THROTTLE = 1000 // Only check policy once per second

  // Throttled policy check to reduce redundant calls
  const throttledPolicyCheck = async (userGroup) => {
    const now = Date.now()
    if (now - lastPolicyCheck < POLICY_CHECK_THROTTLE) {
      return null // Return cached result if within throttle window
    }
    setLastPolicyCheck(now)
    return await fetchLatestUserPolicy(userGroup)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const performNotionAuth = async (latestPolicy) => {
    try {
      // Notion uses API keys, so authentication is always successful if configured
      const result = await authenticateNotion();
      return { success: true, accessToken: 'api_key_authenticated' };
    } catch (error) {
      console.error('Notion auth error:', error);
      return { success: false, error: error.message };
    }
  }

  const performGoogleOAuth = async (latestPolicy) => {
    try {
      // Check if this is a force fresh request (for re-authentication)
      const forceFresh = latestPolicy && typeof latestPolicy === 'object' && latestPolicy.forceFresh;
      
      if (forceFresh || (latestPolicy && latestPolicy.autoDisconnect)) {
        // Always force fresh OAuth, never reuse any connection
        console.log('[DEBUG] Force fresh OAuth requested');
        
        // Clear any existing Google connections for this user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('oauth_connections')
            .delete()
            .eq('user_id', user.id)
            .eq('provider', 'google');
          console.log('[DEBUG] Cleared existing Google connections');
        }
        
        const result = await authenticateWithGoogle();
        if (result.success) {
          // Get the new connection (if needed for access token)
          const newConnection = await getValidGoogleConnection();
          return { success: true, accessToken: newConnection?.access_token };
        } else {
          return { success: false, error: result.error || 'OAuth was cancelled' };
        }
      } else {
        // Reuse if valid, else OAuth
        const validConnection = await getValidGoogleConnection();
        if (validConnection) {
          return { success: true, accessToken: validConnection.access_token, connectionId: validConnection.id };
        }
        const result = await authenticateWithGoogle();
        if (result.success) {
          const newConnection = await getValidGoogleConnection();
          return { success: true, accessToken: newConnection?.access_token, connectionId: newConnection?.id };
        } else {
          return { success: false, error: result.error || 'OAuth was cancelled' };
        }
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { success: false, error: error.message };
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

  const transferContentToGoogleDrive = async (content, targetUrl = null, accessToken, isReauthAttempt = false) => {
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
          return await createGoogleDriveFile(content, fileName, accessToken, fileId, isReauthAttempt)
        } else {
          // Update existing file
          return await updateGoogleDriveFile(fileId, content, accessToken)
        }
      } else {
        // Create new file
        const fileName = uploadedFile ? uploadedFile.name : 'Content from HubSpot AI Integration'
        return await createGoogleDriveFile(content, fileName, accessToken, null, isReauthAttempt)
      }
    } catch (error) {
      console.error('Google Drive content transfer error:', error)
      return { success: false, error: error.message }
    }
  }

  // Always fetch the user's role and policy from the database
  const fetchUserPolicy = async (service) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = userProfile?.role || 'sales';
    const provider = service === 'google-drive' ? 'google' : service;
    const { data: policy } = await supabase
      .from('connection_policies')
      .select('connection_duration_hours, auto_disconnect, allowed')
      .eq('role', role)
      .eq('provider', provider)
      .single();
    return { role, provider, ...policy };
  };

  // Fetch and display the current policy for the badge
  useEffect(() => {
    (async () => {
      const policy = await fetchUserPolicy('google-drive'); // Default to google-drive for badge
      if (policy) {
        setPolicyInfo({
          connectionDuration: policy.connection_duration_hours === 8760 ? 'persistent' : policy.connection_duration_hours === 24 ? '24h' : policy.connection_duration_hours === 0 ? 'auto-disconnect' : `${policy.connection_duration_hours}h`,
          autoDisconnect: policy.auto_disconnect
        });
      }
    })();
  }, []);

  const handleIntegration = async (service, targetUrl = null) => {
    if (!fileContent) {
      addMessage(`Please select a file first to share to ${service}.`, 'assistant')
      return
    }

    // Always fetch the user's role and policy from the database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      addMessage('User not authenticated.', 'assistant');
      return;
    }
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = userProfile?.role || 'sales';
    const provider = service === 'google-drive' ? 'google' : service;
    const { data: policy } = await supabase
      .from('connection_policies')
      .select('connection_duration_hours, auto_disconnect, allowed')
      .eq('role', role)
      .eq('provider', provider)
      .single();
    console.log('User ID:', user.id, 'Role:', role, 'Provider:', provider, 'Policy:', policy);
    if (!policy || !policy.allowed) {
      addMessage(`${service} integration is not allowed for your user group (per Admin policy).`, 'assistant');
      return;
    }

    if (!(await isAppAllowed(service))) {
      addMessage(`${service} integration is not allowed for your user group (per Admin policy).`, 'assistant')
      return
    }

    setIsProcessing(true)

    // Fetch the latest policy before integration
    console.log('[DEBUG] About to call fetchLatestUserPolicy with:', currentUserGroup)
    const latestPolicy = await throttledPolicyCheck(currentUserGroup)

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
      console.log('[DEBUG] About to call performNotionAuth')
      oauthResult = await performNotionAuth(latestPolicy)
      console.log('[DEBUG] performNotionAuth result:', oauthResult)
    } else if (service === 'google-drive') {
      isRealIntegration = GOOGLE_CONFIG.clientId !== 'your_google_client_id_here'
      if (!isRealIntegration) {
        addMessage('Connecting to Google Drive... (Demo Mode)', 'assistant')
      } else {
        addMessage('Connecting to Google Drive... (OAuth)', 'assistant')
      }
      console.log('[DEBUG] About to call performGoogleOAuth')
      oauthResult = await performGoogleOAuth(latestPolicy)
      console.log('[DEBUG] performGoogleOAuth result:', oauthResult)
    }
    
    if (!oauthResult.success) {
      addMessage(`Failed to connect to ${service}: ${oauthResult.error}`, 'assistant')
      setIsProcessing(false)
      return
    }

    // Step 2: Content Transfer
    addMessage(`Sending content to ${service}...`, 'assistant')
    let transferResult
    try {
      if (service === 'notion') {
        console.log('[DEBUG] About to call transferContentToNotion')
        transferResult = await transferContentToNotion(fileContent, targetUrl)
        console.log('[DEBUG] transferContentToNotion result:', transferResult)
      } else if (service === 'google-drive') {
        console.log('[DEBUG] About to call transferContentToGoogleDrive')
        transferResult = await transferContentToGoogleDrive(fileContent, targetUrl, oauthResult.accessToken, false)
        console.log('[DEBUG] transferContentToGoogleDrive result:', transferResult)
        // If auto-disconnect policy enforced and must re-authenticate, force a fresh OAuth flow and retry ONCE
        if (!transferResult.success && transferResult.error && transferResult.error.includes('must re-authenticate')) {
          addMessage('Admin policy requires re-authentication. Please re-authenticate to continue.', 'assistant');
          // Force a fresh OAuth flow (do not reuse any stored connection)
          const reauthResult = await performGoogleOAuth({ forceFresh: true })
          if (reauthResult.success) {
            addMessage('Re-authentication successful. Retrying content transfer...', 'assistant');
            // Use the new token for the retry, and set isReauthAttempt flag
            transferResult = await transferContentToGoogleDrive(fileContent, targetUrl, reauthResult.accessToken, true)
            console.log('[DEBUG] transferContentToGoogleDrive result after re-auth:', transferResult)
            if (!transferResult.success && transferResult.error && transferResult.error.includes('must re-authenticate')) {
              addMessage('Re-authentication failed. Please try again or contact support.', 'assistant');
              setIsProcessing(false)
              return
            }
          } else {
            addMessage('Failed to re-authenticate with Google. Please try again.', 'assistant');
            setIsProcessing(false)
            return
          }
        }
      }
    } catch (error) {
      if (error.message && error.message.includes('Re-authentication required')) {
        addMessage(`${error.message}`, 'assistant');
      } else {
        addMessage(`Failed to send content to ${service}. Please try again.`, 'assistant');
      }
      setIsProcessing(false)
      return
    }
    
    if (!transferResult.success) {
      addMessage(`Failed to send content to ${service}. Please try again.`, 'assistant')
      setIsProcessing(false)
      return
    }

    // Step 3: Success and Policy Application
    const connectionId = 'conn_' + Date.now();
    const now = new Date().toISOString();

    // Only add to active connections and user integration history if NOT autoDisconnect
    if (!latestPolicy.auto_disconnect) {
      const connection = {
        id: connectionId,
        user: 'Demo User',
        app: service,
        connectedAt: 'just now',
        status: 'Active',
        expiresAt: latestPolicy.connection_duration_hours === 8760 ? 'persistent' : '24 hours'
      };
      addActiveConnection(connection);

      const userIntegration = {
        id: connectionId,
        app: service,
        connectedAt: now,
        lastActivity: now,
        status: 'active',
        contentPreview: uploadedFile
          ? `${uploadedFile.name}: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`
          : fileContent.substring(0, 100) + (fileContent.length > 100 ? '...' : ''),
        expiresAt: latestPolicy.connection_duration_hours === 8760 ? 'persistent' : '24 hours'
      };
      addUserIntegration('gabby', userIntegration);
    }

    // Success messages
    const authMethod = isRealIntegration 
      ? (service === 'notion' ? ' (Personal API Key)' : ' (OAuth)')
      : ' (Demo Mode)';
    
    if (targetUrl) {
      if (service === 'notion') {
        addMessage(`Content successfully created as a new page under your Notion page!${authMethod}\n\nParent page: ${targetUrl}\nNew page: ${transferResult.pageUrl}\nContent: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
      } else if (service === 'google-drive') {
        if (targetUrl.includes('/folders/')) {
          addMessage(`Content successfully saved to your Google Drive folder!${authMethod}\n\nFolder: ${targetUrl}\nNew file: ${transferResult.webViewLink}\nContent: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
        } else {
          addMessage(`Content successfully added to your Google Drive file!${authMethod}\n\nFile: ${transferResult.webViewLink || targetUrl}\nContent: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
        }
      }
    } else {
      // No target URL - create new content
      if (service === 'notion') {
        addMessage(`Content successfully sent to Notion!${authMethod}\n\nNew page created under your demo page: ${transferResult.pageUrl}\nContent: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
      } else if (service === 'google-drive') {
        const folderInfo = targetUrl ? '' : '\n📁 Saved to default HubSpot AI Integration folder'
        addMessage(`Content successfully saved to Google Drive!${authMethod}${folderInfo}\n\nNew file created: ${transferResult.webViewLink}\nContent: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`, 'assistant')
      }
    }

    // Step 4: Policy Enforcement
    if (latestPolicy.auto_disconnect) {
      setTimeout(() => {
        addMessage(`Connection disconnected per Admin policy${authMethod}`, 'assistant');
      }, 300);
    } else {
      addMessage(
        latestPolicy.connection_duration_hours === 0
          ? `Connection is persistent per policy${authMethod}`
          : `Connection active for 24 hours per policy${authMethod}`,
        'assistant'
      );
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
    // Reset cursor
    e.currentTarget.style.cursor = 'default'
    // Remove drag-over class
    e.currentTarget.classList.remove('drag-over')
    
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
    // Set cursor to pointer for visual feedback
    e.currentTarget.style.cursor = 'pointer'
    // Add drag-over class for visual indicator
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    console.log('Drag leave event triggered')
    setIsDragOver(false)
    // Reset cursor
    e.currentTarget.style.cursor = 'default'
    // Remove drag-over class
    e.currentTarget.classList.remove('drag-over')
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'assistant':
        return <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Sparkles className="text-[#EF2DF9]" size={24} />
        </div>
      case 'user':
        return <div className="h-8 px-3 bg-black rounded-lg flex items-center justify-center min-w-[56px]">
          <span className="text-white font-medium text-base">Gabby</span>
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
          isDragOver ? 'bg-gray-50 border-2 border-dashed border-gray-200' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={(e) => {
          e.preventDefault();
          console.log('Drag enter detected');
          // Set cursor to pointer for visual feedback
          e.currentTarget.style.cursor = 'pointer'
          // Add drag-over class for visual indicator
          e.currentTarget.classList.add('drag-over')
        }}
        style={{
          minHeight: '300px' // Ensure minimum height for drop area
        }}
      >
        {isDragOver && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-gray-900 font-medium text-lg">Drop to Connect!</p>
            <p className="text-gray-600 text-sm mt-1">Drop a Notion or Google Drive URL to share content</p>
          </div>
        )}
        
        {!isDragOver && messages.length === 1 && (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-gray-600 font-normal">Drop Zone Active</p>
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
              className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-[#EF2DF9]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <p className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
            {message.type === 'user' && getMessageIcon('user')}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex space-x-3 justify-start">
            {getMessageIcon('assistant')}
            <div className="bg-white text-gray-900 px-4 py-3 rounded-lg border border-[#EF2DF9]">
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
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
          <div className="flex-1 relative">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message or drag a URL here..."
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all duration-200"
                rows="1"
                disabled={isProcessing}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSubmit(e)
                  }
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="p-3 bg-[#EF2DF9] text-white rounded-lg hover:bg-[#d625e6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 align-top"
            style={{ alignSelf: 'flex-start' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        {/* Persistent Drop Zone Below Input */}
        <div
          className={`mt-3 flex items-center justify-center h-[56px] rounded-lg bg-[#FCE6FA] transition-all duration-200 ${isDragOver ? 'shadow-lg' : ''}`}
          onDrop={e => { e.preventDefault(); handleDrop(e); }}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
        >
          <Plug className={`transition-all duration-200 ${isDragOver ? 'text-[#EF2DF9] scale-125 drop-shadow-lg' : 'text-[#EF2DF9] scale-100'}`} size={isDragOver ? 40 : 32} />
        </div>
        
        {/* Policy Status */}
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>Policy: {policyInfo.connectionDuration}</span>
          {policyInfo.autoDisconnect && (
            <span className="text-gray-600">• Auto-disconnect enabled</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInterface 