import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PolicyProvider } from './context/PolicyContext.jsx'
import AdminView from './components/AdminView.jsx'
import EndUserView from './components/EndUserView.jsx'
import NotionCallback from './pages/NotionCallback.jsx'
import GoogleCallback from './pages/GoogleCallback.jsx'

function App() {
  const [currentView, setCurrentView] = useState('endUser')

  return (
    <PolicyProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header with View Toggle */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">HubSpot AI Integration Demo</h1>
              <p className="text-sm text-gray-500">Conversational, ephemeral integrations with IT policy controls</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('endUser')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'endUser'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                End User View
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admin Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={
              currentView === 'admin' ? <AdminView /> : <EndUserView />
            } />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/auth/notion/callback" element={<NotionCallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </PolicyProvider>
  )
}

export default App 