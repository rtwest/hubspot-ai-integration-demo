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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-semibold text-gray-900">
                    HubSpot AI Integration Demo
                  </h1>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="flex space-x-8">
                <Link
                  to="/"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  End User
                </Link>
                <Link
                  to="/admin"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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