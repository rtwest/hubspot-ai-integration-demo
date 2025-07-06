import React, { useState } from 'react';
import { Plus, MessageSquare, FileText, Download, Share2, Sparkles } from 'lucide-react';
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <img src="/MarketingHub_Icon_Gradient_RGB_24px.svg" alt="Campaign Report Icon" className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{currentFile.name}</h2>
                    <p className="text-sm text-gray-500">{currentFile.type} • {currentFile.size}</p>
                  </div>
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
            </div>
          </div>
        </div>

        {/* Chat Panel - Right Side */}
        {showChat && (
          <div className="w-1/2 p-6">
            <div className="h-full bg-white rounded-lg border border-[#EF2DF9] shadow-sm overflow-hidden">
              {/* Chat Panel Header */}
              <div className="bg-white border-b border-[#EF2DF9] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <Sparkles className="text-[#EF2DF9]" size={24} />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">Breeze Assistant</h1>
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

      {/* Demo Page Viewer Modal */}
      {showDemoViewer && (
        <DemoPageViewer isOpen={showDemoViewer} onClose={() => setShowDemoViewer(false)} />
      )}
    </div>
  )
}

export default EndUserView 