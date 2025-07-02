import React, { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Settings, MessageCircle, Home } from 'lucide-react'
import AdminView from './components/AdminView'
import EndUserView from './components/EndUserView'
import { PolicyProvider } from './context/PolicyContext'

function App() {
  const location = useLocation()
  
  return (
    <PolicyProvider>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-lg font-medium text-gray-900">
                    AI Integration Demo
                  </h1>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="flex space-x-1">
                <Link
                  to="/"
                  className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                    location.pathname === '/'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  End User
                </Link>
                <Link
                  to="/admin"
                  className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-6">
          <Routes>
            <Route path="/" element={<EndUserView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </main>
      </div>
    </PolicyProvider>
  )
}

export default App 