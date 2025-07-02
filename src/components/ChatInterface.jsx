import React, { useState, useRef, useEffect } from 'react'
import { usePolicy } from '../context/PolicyContext'
import { 
  Send, 
  Link, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Shield
} from 'lucide-react'

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
      content: 'Hi! I\'m Breeze, your AI assistant. I can help you integrate with external tools like Notion. Try uploading a file and saying "send this to Notion" or drag a Notion URL here!',
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
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const isNotionUrl = (url) => {
    return url.includes('notion.so') || url.includes('notion.com')
  }

  const simulateOAuthFlow = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          accessToken: 'demo_token_' + Date.now()
        })
      }, 2000)
    })
  }

  const simulateContentTransfer = async (targetUrl = null) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          pageUrl: targetUrl || 'https://notion.so/demo-page'
        })
      }, 1500)
    })
  }

  const handleIntegration = async (targetUrl = null) => {
    if (!uploadedFile) {
      addMessage('Please upload a file first to share to Notion.', 'assistant')
      return
    }

    if (!isAppAllowed('notion')) {
      addMessage('Notion integration is not allowed for your user group.', 'assistant')
      return
    }

    setIsProcessing(true)

    // Step 1: OAuth Flow
    addMessage('Connecting to Notion...', 'assistant')
    const oauthResult = await simulateOAuthFlow()
    
    if (!oauthResult.success) {
      addMessage('Failed to connect to Notion. Please try again.', 'assistant')
      setIsProcessing(false)
      return
    }

    // Step 2: Content Transfer
    addMessage('Sending content to Notion...', 'assistant')
    const transferResult = await simulateContentTransfer(targetUrl)
    
    if (!transferResult.success) {
      addMessage('Failed to send content to Notion. Please try again.', 'assistant')
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
      app: 'notion',
      connectedAt: 'just now',
      status: 'Active',
      expiresAt: userPolicy.autoDisconnect ? 'Will auto-disconnect' : '24 hours'
    }
    addActiveConnection(connection)

    // Add to user integration history
    const userIntegration = {
      id: connectionId,
      app: 'notion',
      connectedAt: now,
      lastActivity: now,
      status: userPolicy.autoDisconnect ? 'inactive' : 'active',
      ...(userPolicy.autoDisconnect 
        ? { reason: 'auto-disconnect policy' }
        : { expiresAt: userPolicy.connectionDuration === 'persistent' ? 'persistent' : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
      )
    }
    
    // Add to demo user's integration history
    addUserIntegration('demo-user', userIntegration)
    
    // Update demo user's user group to match current selection
    // This would be handled by the policy context in a real implementation

    if (targetUrl) {
      addMessage(`✅ Content successfully added to your Notion page!`, 'assistant')
    } else {
      addMessage(`✅ Content successfully sent to Notion!`, 'assistant')
    }

    // Step 4: Policy Enforcement
    if (userPolicy.autoDisconnect) {
      setTimeout(() => {
        addMessage('🔒 Connection closed for security (auto-disconnect policy)', 'assistant')
        removeActiveConnection(connectionId)
      }, 2000)
    } else {
      addMessage(`🔗 Connection active for ${userPolicy.connectionDuration} per ${userPolicy.name} policy`, 'assistant')
    }

    setIsProcessing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const userMessage = inputValue.trim()
    addMessage(userMessage, 'user')
    setInputValue('')

    // Check for Notion integration intent
    const notionIntent = userMessage.toLowerCase().includes('notion') && 
                        (userMessage.toLowerCase().includes('send') || 
                         userMessage.toLowerCase().includes('share') ||
                         userMessage.toLowerCase().includes('put'))

    if (notionIntent) {
      await handleIntegration()
    } else {
      addMessage('I can help you integrate with Notion! Try saying "send this to Notion" or drag a Notion URL here.', 'assistant')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const url = e.dataTransfer.getData('text/plain')
    
    if (isNotionUrl(url)) {
      addMessage(`Dropped Notion URL: ${url}`, 'user')
      handleIntegration(url)
    } else {
      addMessage('Please drag a valid Notion URL to integrate.', 'assistant')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'assistant':
        return <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-gray-900 font-medium text-sm">B</span>
        </div>
      case 'user':
        return <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
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
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isDragOver ? 'bg-gray-50 border-2 border-dashed border-gray-300' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragOver && (
          <div className="text-center py-8">
            <Link className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-900 font-medium">Drop Notion URL to share content</p>
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
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
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
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message or drag a Notion URL here..."
            className="flex-1 input-field"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
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