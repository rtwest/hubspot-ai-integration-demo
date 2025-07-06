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

const PROVIDERS = ['notion', 'google', 'slack']
const USER_GROUPS = [
  { key: 'sales', name: 'Sales Team', description: 'Sales group', dbRole: 'sales' },
  { key: 'marketing', name: 'Marketing Team', description: 'Marketing group', dbRole: 'marketing' },
  { key: 'customerSuccess', name: 'Customer Success Team', description: 'Customer Success group', dbRole: 'customer_success' },
  { key: 'admin', name: 'Admin', description: 'Admin group', dbRole: 'admin' }
]

const AdminView = () => {
  const {
    policies,
    updateGlobalEphemeral,
    updateUserGroupPolicy,
    updateApprovedApp,
    emergencyDisconnectAll,
    getAllUsersWithIntegrations
  } = usePolicy()

  const [activeTab, setActiveTab] = useState('policies')
  const [openDropdown, setOpenDropdown] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [saveStatus, setSaveStatus] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dbPolicies, setDbPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(true)
  const dropdownRefs = useRef({})

  const toggleDropdown = (key) => {
    setOpenDropdown(prev => (prev === key ? null : key))
  }

  const closeAllDropdowns = () => {
    setOpenDropdown(null)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const refs = Object.values(dropdownRefs.current)
      if (openDropdown && refs.every(ref => ref && !ref.contains(event.target))) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  // Fetch all policies from Supabase
  const fetchAllPolicies = async () => {
    setLoadingPolicies(true)
    const { data, error } = await supabase.from('connection_policies').select('*')
    if (!error && data) {
      setDbPolicies(data)
      console.log('[AdminView] dbPolicies fetched from Supabase:', data)
    }
    setLoadingPolicies(false)
  }

  // Check user role and admin status
  useEffect(() => {
    fetchAllPolicies();
    // Check user role and admin status
    const checkUserRole = async () => {
      try {
        const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role')
        if (roleError) setUserRole('unknown'); else setUserRole(roleData)
        const { data: adminData, error: adminError } = await supabase.rpc('is_admin')
        if (adminError) setIsAdmin(false); else setIsAdmin(adminData)
      } catch (error) {
        setUserRole('error'); setIsAdmin(false)
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

  // Helper to update policy in Supabase and show status
  async function autoSavePolicy(role, group) {
    if (!isAdmin) {
      setSaveStatus('Error: Admin privileges required to save policies. Current role: ' + userRole);
      setTimeout(() => setSaveStatus(''), 4000);
      return;
    }
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
    let error = null;
    for (const provider of PROVIDERS) {
      error = await supabase
        .from('connection_policies')
        .update({
          connection_duration_hours,
          auto_disconnect,
          allowed: group.allowedApps.includes(provider)
        })
        .eq('role', role)
        .eq('provider', provider)
      if (role === 'sales') {
        await supabase
          .from('connection_policies')
          .update({
            connection_duration_hours,
            auto_disconnect,
            allowed: group.allowedApps.includes(provider)
          })
          .eq('role', 'admin')
          .eq('provider', provider)
      }
      if (error && error.error) break;
    }
    if (!error || !error.error) {
      setSaveStatus('Policy auto-saved to Supabase!');
      setTimeout(() => setSaveStatus(''), 2000);
      await fetchAllPolicies();
    } else {
      setSaveStatus('Error saving policy: ' + error.message);
      setTimeout(() => setSaveStatus(''), 4000);
    }
  }

  // Helper to get group policy from dbPolicies
  const getGroupPolicy = (roleKey) => {
    const group = USER_GROUPS.find(g => g.key === roleKey)
    const dbRole = group?.dbRole || roleKey
    const allowedApps = PROVIDERS.filter(provider => {
      const p = dbPolicies.find(pol => pol.role === dbRole && pol.provider === provider)
      return p && p.allowed
    })
    // Use the first provider's duration/auto_disconnect for display (could be improved)
    const firstPolicy = dbPolicies.find(pol => pol.role === dbRole)
    return {
      name: group?.name || roleKey,
      description: group?.description || '',
      connectionDuration: firstPolicy ? (firstPolicy.connection_duration_hours === 8760 ? 'persistent' : firstPolicy.connection_duration_hours === 24 ? '24h' : firstPolicy.connection_duration_hours === 0 ? 'auto-disconnect' : `${firstPolicy.connection_duration_hours}h`) : '',
      allowedApps,
    }
  }

  function handleAppToggle(groupKey, appKey) {
    const groupPolicy = getGroupPolicy(groupKey)
    let newAllowedApps
    if (groupPolicy.allowedApps.includes(appKey)) {
      newAllowedApps = groupPolicy.allowedApps.filter(a => a !== appKey)
    } else {
      newAllowedApps = [...groupPolicy.allowedApps, appKey]
    }
    autoSavePolicy(groupKey, { ...groupPolicy, allowedApps: newAllowedApps })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage connection policies and monitor integrations</p>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'policies'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Policies
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'activity'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'apps'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200'
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
                              <div className="text-sm text-gray-600">
                                {activity.authMethod}
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
                                {activity.reason}
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
          {/* User Group Policies */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">User Group Policies</h3>
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
            {loadingPolicies ? (
              <div className="py-8 text-center text-gray-500">Loading policies...</div>
            ) : (
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
                  {USER_GROUPS.map(group => {
                    const groupPolicy = getGroupPolicy(group.key)
                    console.log(`[AdminView] getGroupPolicy for group ${group.key}:`, groupPolicy)
                    return (
                      <tr key={group.key} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{groupPolicy.name}</div>
                              <div className="text-sm text-gray-600">{groupPolicy.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={groupPolicy.connectionDuration}
                            onChange={async (e) => {
                              await autoSavePolicy(group.key, { ...groupPolicy, connectionDuration: e.target.value })
                            }}
                            className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                          >
                            <option value="auto-disconnect">Auto-disconnect</option>
                            <option value="24h">24 hours</option>
                            <option value="persistent">Persistent</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <div className="relative">
                            <div
                              className="w-full text-left border border-gray-200 rounded px-2 py-1 bg-white text-sm cursor-pointer"
                              onClick={() => setOpenDropdown(group.key)}
                              tabIndex={0}
                              role="button"
                              aria-haspopup="listbox"
                              aria-expanded={openDropdown === group.key}
                            >
                              {groupPolicy.allowedApps.length === 0 ? (
                                <span className="text-gray-400">Select apps...</span>
                              ) : (
                                groupPolicy.allowedApps.map(appKey => (
                                  <span key={appKey} className="inline-block mr-2 bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                    {getAppIcon(appKey, "w-4 h-4")}
                                    {appKey}
                                  </span>
                                ))
                              )}
                              <ChevronDown className="w-4 h-4 inline ml-1 text-gray-400" />
                            </div>
                            {openDropdown === group.key && (
                              <div
                                ref={el => (dropdownRefs.current[group.key] = el)}
                                className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto multi-select-dropdown"
                                tabIndex={-1}
                              >
                                {PROVIDERS.map(appKey => {
                                  const checked = groupPolicy.allowedApps.includes(appKey)
                                  return (
                                    <label
                                      key={appKey}
                                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleAppToggle(group.key, appKey)}
                                        className="rounded border-gray-300 mr-2"
                                        tabIndex={0}
                                      />
                                      <div className="flex items-center space-x-2">
                                        {getAppIcon(appKey, "w-4 h-4")}
                                        <span className="text-sm text-gray-700">{appKey}</span>
                                      </div>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs text-gray-500">Auto-save enabled</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
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