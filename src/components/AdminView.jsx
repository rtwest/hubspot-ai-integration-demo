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
    emergencyDisconnectAll
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IT Admin Dashboard</h1>
          <p className="text-gray-600">Manage connection policies and monitor integrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">
              {policies.activeConnections.length} active connections
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'policies'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Connection Policies
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apps'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Approved Apps
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Active Connections
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Global Policy Toggle */}
          <div className="card p-6">
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
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>Global Override Active:</strong> All connections will auto-disconnect after task completion, regardless of user group policies.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Group Policies */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Group Policies</h3>
            <div className="space-y-4">
              {Object.entries(policies.userGroups).map(([key, group]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
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

          {/* Active Connections */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Connections</h3>
            {policies.activeConnections.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active connections</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.activeConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{policies.approvedApps[connection.app]?.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{connection.user}</p>
                        <p className="text-sm text-gray-600">
                          {connection.app} • Connected {connection.connectedAt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{connection.status}</p>
                      <p className="text-xs text-gray-500">{connection.expiresAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminView 