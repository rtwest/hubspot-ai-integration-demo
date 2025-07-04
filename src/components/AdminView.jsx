import React, { useState, useRef, useEffect } from 'react'
import { usePolicy } from '../context/PolicyContext'
import { getAppIcon } from './AppIcons'
import { 
  Shield, 
  Users, 
  Settings, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Activity,
  ChevronDown,
  ExternalLink,
  FileText,
  Database,
  Calendar,
  User,
  Globe
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const AdminView = () => {
  const {
    policies,
    updateGlobalEphemeral,
    updateUserGroupPolicy,
    updateApprovedApp,
    emergencyDisconnectAll,
    getAllUsersWithIntegrations
  } = usePolicy()

  const [activeTab, setActiveTab] = useState('activity')
  const [openDropdowns, setOpenDropdowns] = useState({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [saveStatus, setSaveStatus] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const closeAllDropdowns = () => {
    setOpenDropdowns({})
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.multi-select-dropdown')) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Check user role and admin status
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Get current user's role
        const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role')
        if (roleError) {
          console.error('Error getting user role:', roleError)
          setUserRole('unknown')
        } else {
          setUserRole(roleData)
        }

        // Check if user is admin
        const { data: adminData, error: adminError } = await supabase.rpc('is_admin')
        if (adminError) {
          console.error('Error checking admin status:', adminError)
          setIsAdmin(false)
        } else {
          setIsAdmin(adminData)
        }
      } catch (error) {
        console.error('Error checking user permissions:', error)
        setUserRole('error')
        setIsAdmin(false)
      }
    }

    checkUserRole()
  }, [])

  // Listen for real-time updates to Gabby's integration history
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'demo_notion_pages' || e.key?.startsWith('notion_token_')) {
        setRefreshTrigger(prev => prev + 1)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for local changes (since storage event doesn't fire for same window)
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments)
      if (key === 'demo_notion_pages' || key?.startsWith('notion_token_')) {
        setRefreshTrigger(prev => prev + 1)
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      localStorage.setItem = originalSetItem
    }
  }, [])

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'blocked': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'just now'
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  const formatFutureTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date - now
    
    if (diffMs <= 0) return 'expired'
    
    const diffInHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffInHours < 1) return `${diffInMinutes}m from now`
    if (diffInHours === 1) return `1h ${diffInMinutes}m from now`
    if (diffInHours < 24) return `${diffInHours}h ${diffInMinutes}m from now`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return `1d ${diffInHours % 24}h from now`
    return `${diffInDays}d ${diffInHours % 24}h from now`
  }

  const formatDuration = (startDate, endDate = null, expiresAt = null, status = 'active') => {
    // For active connections, show policy duration instead of time since connection
    if (status === 'active' && expiresAt) {
      if (expiresAt === 'persistent') {
        return 'Persistent'
      }
      const expiresDate = new Date(expiresAt)
      const now = new Date()
      const diffMs = expiresDate - now
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (diffHours < 1) return `${diffMinutes}m remaining`
      if (diffHours < 24) return `${diffHours}h ${diffMinutes}m remaining`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ${diffHours % 24}h remaining`
    }
    
    // For inactive connections, show actual duration
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffMs = end - start
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours < 1) return `${diffMinutes}m`
    if (diffHours < 24) return `${diffHours}h ${diffMinutes}m`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ${diffHours % 24}h`
  }

  const getIntegrationStatusDisplay = (integration) => {
    if (integration.status === 'active') {
      return {
        text: 'ACTIVE',
        color: 'text-green-600 bg-green-100',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      }
    } else {
      return {
        text: 'CLOSED',
        color: 'text-red-600 bg-red-100',
        icon: <XCircle className="w-4 h-4 text-red-500" />
      }
    }
  }

  // Generate comprehensive activity log data
  const getActivityLogData = () => {
    const allUsers = getAllUsersWithIntegrations()
    const activityLog = []
    
    allUsers.forEach(user => {
      user.integrations.forEach(integration => {
        const app = policies.approvedApps[integration.app]
        const userGroup = policies.userGroups[user.userGroup]
        
        activityLog.push({
          id: integration.id,
          timestamp: integration.connectedAt,
          user: user.name,
          userEmail: user.email,
          userGroup: userGroup?.name || 'Unknown',
          app: app?.name || integration.app,
          appKey: integration.app,
          action: integration.status === 'active' ? 'Connected' : 'Disconnected',
          status: integration.status,
          duration: formatDuration(integration.connectedAt, integration.lastActivity, integration.expiresAt, integration.status),
          dataTransferred: integration.contentPreview ? 'Yes' : 'No',
          dataPreview: integration.contentPreview,
          authMethod: integration.authMethod,
          pageUrl: integration.pageUrl,
          reason: integration.reason,
          expiresAt: integration.expiresAt,
          lastActivity: integration.lastActivity
        })
      })
    })
    
    // Sort by timestamp (newest first)
    return activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Helper to update policy in Supabase
  async function updateSupabasePolicy(role, provider, updates) {
    const { error } = await supabase
      .from('connection_policies')
      .update(updates)
      .eq('role', role)
      .eq('provider', provider);
    return error;
  }

  // Helper to update policy in Supabase and show status
  async function autoSavePolicy(role, group) {
    // Check if user is admin before attempting to save
    if (!isAdmin) {
      setSaveStatus('Error: Admin privileges required to save policies. Current role: ' + userRole);
      setTimeout(() => setSaveStatus(''), 4000);
      return;
    }

    // Map connectionDuration to hours and auto_disconnect
    let connection_duration_hours = 24;
    let auto_disconnect = false;
    if (group.connectionDuration === 'auto-disconnect') {
      connection_duration_hours = 0;
      auto_disconnect = true;
    } else if (group.connectionDuration === 'persistent') {
      connection_duration_hours = 8760;
      auto_disconnect = false;
    } else if (group.connectionDuration === '24h') {
      connection_duration_hours = 24;
      auto_disconnect = false;
    }
    // Update all providers for this group
    const providers = ['notion', 'google', 'slack'];
    let error = null;
    for (const provider of providers) {
      error = await updateSupabasePolicy(role, provider, {
        connection_duration_hours,
        auto_disconnect,
        allowed: group.allowedApps.includes(provider)
      });
      if (error) break;
    }
    if (!error) {
      setSaveStatus('Policy auto-saved to Supabase!');
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      setSaveStatus('Error saving policy: ' + error.message);
      setTimeout(() => setSaveStatus(''), 4000);
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage connection policies and monitor integrations</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>
              {policies.activeConnections.length} active connections
            </span>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activity'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Activity Log
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'policies'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Policies
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'apps'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Apps
          </button>
        </nav>
      </div>

      {/* Activity Log Content */}
      {activeTab === 'activity' && (
        <div className="space-y-6">

          {/* Activity Log Table */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Connection Activity Log</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Real-time monitoring of all data connections and transfers</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">App</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getActivityLogData().map((activity) => {
                    const statusDisplay = getIntegrationStatusDisplay(activity)
                    
                    return (
                      <tr key={activity.id} className={`hover:bg-gray-50 ${activity.user === 'Gabby' ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-gray-600">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {activity.user}
                              {activity.user === 'Gabby' && (
                                <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  Demo
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{activity.userEmail}</div>
                            <div className="text-xs text-gray-500">{activity.userGroup}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getAppIcon(activity.appKey, "w-5 h-5")}
                            <span className="font-medium text-gray-900">{activity.app}</span>
                            {activity.authMethod && (
                              <div className="text-xs text-gray-600">
                                🔑 {activity.authMethod}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {statusDisplay.icon}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusDisplay.color}`}>
                              {statusDisplay.text}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{activity.duration}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.dataTransferred === 'Yes' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.dataTransferred}
                            </span>
                            {activity.dataPreview && (
                              <div className="text-xs text-gray-600 mt-1 truncate max-w-xs" title={activity.dataPreview}>
                                {activity.dataPreview}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs text-gray-600 space-y-1">
                            {activity.pageUrl && (
                              <a 
                                href={activity.pageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Content
                              </a>
                            )}
                            {activity.reason && (
                              <div className="text-red-600">
                                ⚠️ {activity.reason}
                              </div>
                            )}
                            <div className="text-gray-500">
                              Last: {formatTimeAgo(activity.lastActivity)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Global Policy Toggle */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Global Policy Override</h3>
                <p className="text-gray-600">Force ephemeral connections for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={policies.globalEphemeral}
                  onChange={(e) => updateGlobalEphemeral(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            {policies.globalEphemeral && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="w-4 h-4 text-gray-600 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <strong>Global Override Active:</strong> All connections will auto-disconnect after task completion, regardless of user group policies.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Group Policies */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">User Group Policies</h3>
            
            {/* User Role Debug Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Debug Info:</strong> Current User Role: <span className="font-mono">{userRole || 'loading...'}</span> | 
                Admin Status: <span className="font-mono">{isAdmin ? 'Yes' : 'No'}</span>
              </div>
              {!isAdmin && (
                <div className="mt-2 text-xs text-blue-600">
                  To enable policy editing, promote your user to admin role using: 
                  <code className="ml-1 bg-blue-100 px-1 rounded">SELECT promote_to_admin('your-email@example.com');</code>
                </div>
              )}
            </div>
            
            {/* Status message */}
            {saveStatus && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                saveStatus.includes('Error') 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
                {saveStatus}
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Connection Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Allowed Apps</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(policies.userGroups).map(([key, group]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{group.name}</div>
                            <div className="text-sm text-gray-600">{group.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={group.connectionDuration}
                          onChange={async (e) => {
                            updateUserGroupPolicy(key, { connectionDuration: e.target.value })
                            await autoSavePolicy(key, { ...group, connectionDuration: e.target.value })
                          }}
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="auto-disconnect">Auto-disconnect</option>
                          <option value="24h">24 hours</option>
                          <option value="persistent">Persistent</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <div className="relative multi-select-dropdown">
                          <button
                            type="button"
                            onClick={() => toggleDropdown(key)}
                            className="text-sm border border-gray-200 rounded px-3 py-2 bg-white min-w-[200px] text-left flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <span className="text-gray-700 truncate">
                              {group.allowedApps.length > 0 
                                ? `${group.allowedApps.length} app${group.allowedApps.length !== 1 ? 's' : ''} selected`
                                : 'Select apps...'
                              }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openDropdowns[key] ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {openDropdowns[key] && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {Object.entries(policies.approvedApps).map(([appKey, app]) => (
                                <label
                                  key={appKey}
                                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={group.allowedApps.includes(appKey)}
                                    onChange={async (e) => {
                                      const newAllowedApps = e.target.checked
                                        ? [...group.allowedApps, appKey]
                                        : group.allowedApps.filter(a => a !== appKey)
                                      updateUserGroupPolicy(key, { allowedApps: newAllowedApps })
                                      await autoSavePolicy(key, { ...group, allowedApps: newAllowedApps })
                                    }}
                                    className="rounded border-gray-300 mr-2"
                                  />
                                  <div className="flex items-center space-x-2">
                                    {getAppIcon(appKey, "w-4 h-4")}
                                    <span className="text-sm text-gray-700">{app.name}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs text-gray-500">Auto-save enabled</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {activeTab === 'apps' && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Approved Apps Catalog</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">App</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Risk Level</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Scopes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(policies.approvedApps)
                  .sort(([, a], [, b]) => {
                    // Sort by risk level: high -> medium -> low
                    const riskOrder = { high: 3, medium: 2, low: 1 }
                    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
                  })
                  .map(([key, app]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {getAppIcon(key, "w-5 h-5")}
                        <span className="font-medium text-gray-900">{app.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(app.status)}
                        <select
                          value={app.status}
                          onChange={(e) => updateApprovedApp(key, { status: e.target.value })}
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="approved">Approved</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(app.riskLevel)}`}>
                        {app.riskLevel}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {app.defaultScopes?.map(scope => (
                          <span key={scope} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {app.reason && (
                        <span className="text-xs text-gray-500" title={app.reason}>
                          ⚠️ Blocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  )
}

export default AdminView 