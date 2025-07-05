import React, { useState } from 'react';
import { Plus, MessageSquare, FileText, Download, Share2 } from 'lucide-react';
import ChatInterface from './ChatInterface.jsx';
import DemoPageViewer from './DemoPageViewer.jsx';

const EndUserView = ({ showChat = true }) => {
  const [showDemoViewer, setShowDemoViewer] = useState(false);
  const [currentFile, setCurrentFile] = useState({
    name: 'Campaign Report Q4 2024.txt',
    content: `Q4 2024 Marketing Campaign Report

Campaign Overview:
- Campaign Name: Holiday Season Product Launch
- Duration: October 1 - December 31, 2024
- Budget: $150,000
- Target Audience: Small business owners, 25-45 years old

Performance Metrics:
- Impressions: 2.5M
- Clicks: 45,000
- CTR: 1.8%
- Conversions: 1,200
- CPA: $125
- ROAS: 3.2x

Top Performing Channels:
1. Google Ads - 40% of conversions
2. LinkedIn Ads - 35% of conversions  
3. Facebook Ads - 25% of conversions

Key Learnings:
- Video content performed 2.5x better than static images
- Mobile traffic converted 15% higher than desktop
- Retargeting campaigns showed 3x better ROI

Next Steps:
- Scale successful video ad formats
- Increase mobile bid adjustments
- Launch retargeting campaign for Q1 2025

Prepared by: Marketing Team
Date: January 15, 2025`,
    type: 'text/plain',
    size: '2.3 KB'
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* File Display Panel - Left Side */}
        <div className={`${showChat ? 'w-1/2' : 'w-full'} p-6 transition-all duration-300`}>
          <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* File Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{currentFile.name}</h2>
                    <p className="text-sm text-gray-500">{currentFile.type} • {currentFile.size}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Download size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {currentFile.content}
                </pre>
              </div>
              
              {/* Integration Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Sales Team Integrations Available:</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Type <span className="font-mono bg-blue-100 px-2 py-1 rounded">"send this to Notion"</span> in the chat</p>
                  <p>• Type <span className="font-mono bg-blue-100 px-2 py-1 rounded">"save this to Google Drive"</span> in the chat</p>
                  <p>• Drag a Notion or Google Drive URL into the chat</p>
                  <p className="text-xs text-blue-700 mt-3">🔗 Connections stay active for 24 hours per Sales team policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - Right Side */}
        {showChat && (
          <div className="w-1/2 p-6">
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Chat Panel Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="text-white" size={20} />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
                      <p className="text-sm text-gray-500">Ready to help with integrations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Gabby</span> • <span className="text-blue-600">Sales Team</span>
                    </div>
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      All Chats
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1">
                <ChatInterface uploadedFile={currentFile} fileContent={currentFile.content} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Page Viewer Button */}
      <div className="p-6 pt-0">
        <button
          onClick={() => setShowDemoViewer(true)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          View Demo Notion Pages
        </button>
      </div>

      {/* Demo Page Viewer Modal */}
      {showDemoViewer && (
        <DemoPageViewer isOpen={showDemoViewer} onClose={() => setShowDemoViewer(false)} />
      )}
    </div>
  )
}

export default EndUserView 