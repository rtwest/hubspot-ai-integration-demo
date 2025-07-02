import React, { createContext, useContext, useState, useEffect } from 'react'

const PolicyContext = createContext()

export const usePolicy = () => {
  const context = useContext(PolicyContext)
  if (!context) {
    throw new Error('usePolicy must be used within a PolicyProvider')
  }
  return context
}

export const PolicyProvider = ({ children }) => {
  const [policies, setPolicies] = useState({
    // Global policy toggle
    globalEphemeral: false,
    
    // User group policies
    userGroups: {
      sales: {
        name: 'Sales Team',
        connectionDuration: '24h',
        autoDisconnect: false,
        allowedApps: ['notion', 'slack', 'google-drive']
      },
      marketing: {
        name: 'Marketing Team',
        connectionDuration: 'auto-disconnect',
        autoDisconnect: true,
        allowedApps: ['notion', 'canva', 'google-drive']
      },
      customerSuccess: {
        name: 'Customer Success Team',
        connectionDuration: 'persistent',
        autoDisconnect: false,
        allowedApps: ['notion', 'slack', 'zendesk']
      }
    },
    
    // Approved apps catalog
    approvedApps: {
      notion: {
        name: 'Notion',
        status: 'approved',
        riskLevel: 'low',
        defaultScopes: ['read', 'write'],
        icon: '📝'
      },
      slack: {
        name: 'Slack',
        status: 'approved',
        riskLevel: 'low',
        defaultScopes: ['chat:write'],
        icon: '💬'
      },
      'google-drive': {
        name: 'Google Drive',
        status: 'approved',
        riskLevel: 'medium',
        defaultScopes: ['read', 'write'],
        icon: '📁'
      },
      canva: {
        name: 'Canva',
        status: 'approved',
        riskLevel: 'low',
        defaultScopes: ['read', 'write'],
        icon: '🎨'
      },
      zendesk: {
        name: 'Zendesk',
        status: 'approved',
        riskLevel: 'medium',
        defaultScopes: ['read', 'write'],
        icon: '🎫'
      },
      'personal-dropbox': {
        name: 'Personal Dropbox',
        status: 'blocked',
        riskLevel: 'high',
        reason: 'Personal storage + customer data risk',
        icon: '📦'
      }
    },
    
    // Active connections (for demo purposes)
    activeConnections: []
  })

  const [currentUserGroup, setCurrentUserGroup] = useState('marketing')

  // Update global ephemeral policy
  const updateGlobalEphemeral = (enabled) => {
    setPolicies(prev => ({
      ...prev,
      globalEphemeral: enabled
    }))
  }

  // Update user group policy
  const updateUserGroupPolicy = (groupKey, updates) => {
    setPolicies(prev => ({
      ...prev,
      userGroups: {
        ...prev.userGroups,
        [groupKey]: {
          ...prev.userGroups[groupKey],
          ...updates
        }
      }
    }))
  }

  // Update approved app status
  const updateApprovedApp = (appKey, updates) => {
    setPolicies(prev => ({
      ...prev,
      approvedApps: {
        ...prev.approvedApps,
        [appKey]: {
          ...prev.approvedApps[appKey],
          ...updates
        }
      }
    }))
  }

  // Add active connection
  const addActiveConnection = (connection) => {
    setPolicies(prev => ({
      ...prev,
      activeConnections: [...prev.activeConnections, connection]
    }))
  }

  // Remove active connection
  const removeActiveConnection = (connectionId) => {
    setPolicies(prev => ({
      ...prev,
      activeConnections: prev.activeConnections.filter(
        conn => conn.id !== connectionId
      )
    }))
  }

  // Emergency disconnect all
  const emergencyDisconnectAll = () => {
    setPolicies(prev => ({
      ...prev,
      activeConnections: []
    }))
  }

  // Get current user's policy
  const getCurrentUserPolicy = () => {
    const userGroup = policies.userGroups[currentUserGroup]
    return {
      ...userGroup,
      // Override with global ephemeral setting if enabled
      autoDisconnect: policies.globalEphemeral || userGroup.autoDisconnect,
      connectionDuration: policies.globalEphemeral ? 'auto-disconnect' : userGroup.connectionDuration
    }
  }

  // Check if app is allowed for current user
  const isAppAllowed = (appKey) => {
    const userPolicy = getCurrentUserPolicy()
    const app = policies.approvedApps[appKey]
    
    return userPolicy.allowedApps.includes(appKey) && app.status === 'approved'
  }

  const value = {
    policies,
    currentUserGroup,
    setCurrentUserGroup,
    updateGlobalEphemeral,
    updateUserGroupPolicy,
    updateApprovedApp,
    addActiveConnection,
    removeActiveConnection,
    emergencyDisconnectAll,
    getCurrentUserPolicy,
    isAppAllowed
  }

  return (
    <PolicyContext.Provider value={value}>
      {children}
    </PolicyContext.Provider>
  )
} 