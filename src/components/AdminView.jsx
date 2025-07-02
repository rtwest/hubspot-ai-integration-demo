import React, { useState } from 'react'
import { usePolicy } from '../context/PolicyContext'
import { 
  Shield, 
  Users, 
  Settings, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Activity
} from 'lucide-react'

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

  const getIntegrationStatusDisplay = (integration) => {
    if (integration.status === 'active') {
      return {
        text: 'STILL ACTIVE',
        color: 'text-green-600 bg-green-100',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      }
    } else {
      return {
        text: 'NO LONGER ACTIVE',
        color: 'text-red-600 bg-red-100',
        icon: <XCircle className="w-4 h-4 text-red-500" />
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage connection policies and monitor integrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>
              {policies.activeConnections.length} active connections
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
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
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'connections'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Connections
          </button>
        </nav>
      </div>

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
          <div className="card p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">User Group Policies</h3>
            <div className="space-y-4">
              {Object.entries(policies.userGroups).map(([key, group]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Connection Duration
                      </label>
                      <select
                        value={group.connectionDuration}
                        onChange={(e) => updateUserGroupPolicy(key, { connectionDuration: e.target.value })}
                        className="input-field"
                      >
                        <option value="auto-disconnect">Auto-disconnect</option>
                        <option value="24h">24 hours</option>
                        <option value="persistent">Persistent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auto-disconnect
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={group.autoDisconnect}
                          onChange={(e) => updateUserGroupPolicy(key, { autoDisconnect: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allowed Apps
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {group.allowedApps.map(app => (
                          <span key={app} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {policies.approvedApps[app]?.icon} {policies.approvedApps[app]?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'apps' && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Approved Apps Catalog</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(policies.approvedApps).map(([key, app]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{app.icon}</span>
                    <h4 className="font-medium text-gray-900">{app.name}</h4>
                  </div>
                  {getStatusIcon(app.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <select
                      value={app.status}
                      onChange={(e) => updateApprovedApp(key, { status: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="approved">Approved</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Risk Level:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(app.riskLevel)}`}>
                      {app.riskLevel}
                    </span>
                  </div>
                  {app.reason && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {app.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Emergency Controls */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Emergency Controls</h3>
                <p className="text-gray-600">Immediately revoke all active connections</p>
              </div>
              <button
                onClick={emergencyDisconnectAll}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Emergency Disconnect All
              </button>
            </div>
          </div>

          {/* User Integration History */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Integration History</h3>
            <div className="space-y-6">
              {getAllUsersWithIntegrations().map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">{policies.userGroups[user.userGroup]?.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {user.integrations.length} integrations
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {user.integrations.map((integration) => {
                      const statusDisplay = getIntegrationStatusDisplay(integration)
                      const app = policies.approvedApps[integration.app]
                      
                      return (
                        <div key={integration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{app?.icon}</span>
                            <div>
                              <p className="font-medium text-gray-900">{app?.name}</p>
                              <p className="text-sm text-gray-600">
                                Connected {formatTimeAgo(integration.connectedAt)} • 
                                Last activity {formatTimeAgo(integration.lastActivity)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {statusDisplay.icon}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusDisplay.color}`}>
                                {statusDisplay.text}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {integration.status === 'active' 
                                ? integration.expiresAt === 'persistent' 
                                  ? 'Persistent connection'
                                  : `Expires ${formatTimeAgo(integration.expiresAt)}`
                                : integration.reason
                              }
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminView 