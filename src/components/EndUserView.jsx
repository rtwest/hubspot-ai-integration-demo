import React, { useState, useRef } from 'react'
import { usePolicy } from '../context/PolicyContext'
import { 
  Upload, 
  FileText, 
  MessageCircle, 
  Send, 
  Link,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'
import ChatInterface from './ChatInterface'

const EndUserView = () => {
  const { currentUserGroup, setCurrentUserGroup, getCurrentUserPolicy } = usePolicy()
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const userPolicy = getCurrentUserPolicy()

  const handleFileUpload = async (file) => {
    if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
      const content = await file.text()
      setUploadedFile(file)
      setFileContent(content)
    } else {
      alert('Please upload a .md file')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
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

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
      {/* Left Panel - File Upload & Display */}
      <div className="space-y-6">
        {/* User Group Selector */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current User Group</h3>
              <p className="text-sm text-gray-600">Policy: {userPolicy.connectionDuration}</p>
            </div>
            <select
              value={currentUserGroup}
              onChange={(e) => setCurrentUserGroup(e.target.value)}
              className="input-field w-auto"
            >
              <option value="marketing">Marketing Team</option>
              <option value="sales">Sales Team</option>
              <option value="customerSuccess">Customer Success Team</option>
            </select>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Content to Share</h3>
          
                      {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop a .md file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-black hover:text-gray-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500">Supports .md files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-600">Ready to share</p>
                  </div>
                </div>
                                  <button
                    onClick={() => {
                      setUploadedFile(null)
                      setFileContent('')
                    }}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    ×
                  </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">File Content</span>
                </div>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {fileContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Integration Instructions */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">How to Integrate</h3>
          <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Upload a .md file</p>
                  <p className="text-sm text-gray-600">Drag and drop or click browse to upload your content</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Trigger integration</p>
                  <p className="text-sm text-gray-600">
                    Either type "send this to Notion" or drag a Notion URL into the chat
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Watch the magic happen</p>
                  <p className="text-sm text-gray-600">
                    OAuth popup → Content transfer → Policy enforcement
                  </p>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle className="w-4 h-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Breeze AI Assistant</h3>
        </div>
        
        <ChatInterface 
          uploadedFile={uploadedFile}
          fileContent={fileContent}
        />
      </div>
    </div>
  )
}

export default EndUserView 