import React, { useState, useEffect } from 'react'
import { ExternalLink, FileText, Calendar, X } from 'lucide-react'

const DemoPageViewer = ({ isOpen, onClose }) => {
  const [demoPages, setDemoPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)

  useEffect(() => {
    if (isOpen) {
      const pages = JSON.parse(localStorage.getItem('demo_notion_pages') || '[]')
      setDemoPages(pages)
    }
  }, [isOpen])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Demo Notion Pages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Page List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Created Pages</h3>
              {demoPages.length === 0 ? (
                <p className="text-sm text-gray-500">No pages created yet. Try integrating with Notion!</p>
              ) : (
                <div className="space-y-2">
                  {demoPages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPage?.id === page.id
                          ? 'bg-gray-100 border border-gray-300'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {page.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(page.createdAt)}
                          </p>
                          {page.updatedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Updated: {formatDate(page.updatedAt)}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedPage ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedPage.title}
                    </h3>
                    <a
                      href={selectedPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open in Notion
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created: {formatDate(selectedPage.createdAt)}
                    </div>
                    {selectedPage.updatedAt && (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        Updated: {formatDate(selectedPage.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Page Content</h4>
                  <div className="bg-white rounded border p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {selectedPage.content}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a page to view its content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoPageViewer 