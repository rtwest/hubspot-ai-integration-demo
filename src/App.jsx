import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PolicyProvider } from './context/PolicyContext.jsx'
import AdminView from './components/AdminView.jsx'
import EndUserView from './components/EndUserView.jsx'
import NotionCallback from './pages/NotionCallback.jsx'
import GoogleCallback from './pages/GoogleCallback.jsx'
import Auth from './components/Auth.jsx'
import { supabase } from './lib/supabase.js'
import { Shield, Users, Activity, Settings, AlertTriangle, Search, HelpCircle, User, LogOut, ChevronDown, Sparkles, X } from 'lucide-react'

function App() {
  const [currentView, setCurrentView] = useState('endUser')
  const [user, setUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription.unsubscribe()
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  if (!user) {
    return <Auth />
  }

  // Check if we're on an OAuth callback page
  const isOAuthCallback = window.location.pathname.includes('/auth/') && 
    (window.location.pathname.includes('/callback') || window.location.pathname.includes('/token'))

  // If it's an OAuth callback, render without the main layout
  if (isOAuthCallback) {
    return (
      <PolicyProvider>
        <Routes>
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/notion/callback" element={<NotionCallback />} />
        </Routes>
      </PolicyProvider>
    )
  }

  // Sidebar navigation items
  const navItems = [
    { key: 'endUser', label: 'End User', icon: <User className="w-6 h-6" />, onClick: () => setCurrentView('endUser') },
    { key: 'admin', label: 'Admin', icon: <Shield className="w-6 h-6" />, onClick: () => setCurrentView('admin') },
    { key: 'activity', label: 'Activity', icon: <Activity className="w-6 h-6" />, onClick: () => setCurrentView('activity') },
    { key: 'apps', label: 'Apps', icon: <Settings className="w-6 h-6" />, onClick: () => setCurrentView('apps') },
    { key: 'help', label: 'Help', icon: <AlertTriangle className="w-6 h-6" />, onClick: () => setCurrentView('help') },
  ]

  return (
    <PolicyProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                <img src="/log.jpg" alt="App Logo" className="w-7 h-7 object-contain rounded-lg" />
              </div>
              <span className="text-lg font-medium text-gray-900">Seamless Integration Demo</span>
            </div>

            {/* Right side - Search, Help, Chat Toggle, and User Profile */}
            <div className="flex items-center space-x-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Help Icon */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all duration-200">
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Chat Toggle */}
              <button 
                onClick={() => setShowChat(!showChat)}
                className={"p-2 rounded-md transition-all duration-200 bg-white"}
                title="Toggle Chat"
              >
                <Sparkles className="w-5 h-5 text-[#EF2DF9]" />
              </button>

              {/* User Profile Dropdown */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-50 rounded-md transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-normal">{user.email}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">Admin User</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-6 space-y-6">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={item.onClick}
                className={`flex items-center justify-center w-12 h-12 rounded-md mb-2 transition-all duration-200 ${currentView === item.key ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                title={item.label}
              >
                {item.icon}
              </button>
            ))}
          </aside>

          {/* Main Content */}
          <main className="flex-1 relative">
            <Routes>
              <Route path="/" element={
                currentView === 'admin' ? <AdminView /> :
                currentView === 'endUser' ? <EndUserView showChat={showChat} /> :
                currentView === 'activity' ? <div className="p-8">Activity Log (Coming Soon)</div> :
                currentView === 'apps' ? <div className="p-8">Apps Catalog (Coming Soon)</div> :
                currentView === 'help' ? <div className="p-8">Help & Support (Coming Soon)</div> :
                <EndUserView showChat={showChat} />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </PolicyProvider>
  )
}

export default App 