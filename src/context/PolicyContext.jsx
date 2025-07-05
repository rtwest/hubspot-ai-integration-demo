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
        defaultScopes: ['read', 'write']
      },
      slack: {
        name: 'Slack',
        status: 'approved',
        riskLevel: 'low',
        defaultScopes: ['chat:write']
      },
      'google-drive': {
        name: 'Google Drive',
        status: 'approved',
        riskLevel: 'medium',
        defaultScopes: ['read', 'write']
      },
      canva: {
        name: 'Canva',
        status: 'approved',
        riskLevel: 'low',
        defaultScopes: ['read', 'write']
      },
      zendesk: {
        name: 'Zendesk',
        status: 'approved',
        riskLevel: 'medium',
        defaultScopes: ['read', 'write']
      },
      'personal-dropbox': {
        name: 'Personal Dropbox',
        status: 'blocked',
        riskLevel: 'high',
        reason: 'Personal storage + customer data risk'
      }
    },
    
    // Active connections (for demo purposes)
    activeConnections: [],
    
    // User integration history
    users: {
      'john-smith': {
        id: 'john-smith',
        name: 'John Smith',
        email: 'john.smith@company.com',
        userGroup: 'marketing',
        integrations: [
          {
            id: 'conn_1',
            app: 'notion',
            connectedAt: '2024-01-15T14:30:00Z',
            lastActivity: '2024-01-15T14:35:00Z',
            status: 'inactive',
            reason: 'auto-disconnect policy'
          },
          {
            id: 'conn_2',
            app: 'slack',
            connectedAt: '2024-01-15T15:00:00Z',
            lastActivity: '2024-01-15T15:30:00Z',
            status: 'active',
            expiresAt: '2024-01-16T15:00:00Z'
          }
        ]
      },
      'sarah-johnson': {
        id: 'sarah-johnson',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        userGroup: 'sales',
        integrations: [
          {
            id: 'conn_3',
            app: 'notion',
            connectedAt: '2024-01-15T13:00:00Z',
            lastActivity: '2024-01-15T16:00:00Z',
            status: 'active',
            expiresAt: '2024-01-16T13:00:00Z'
          },
          {
            id: 'conn_4',
            app: 'google-drive',
            connectedAt: '2024-01-14T10:00:00Z',
            lastActivity: '2024-01-14T17:00:00Z',
            status: 'inactive',
            reason: 'expired (24h policy)'
          }
        ]
      },
      'mike-chen': {
        id: 'mike-chen',
        name: 'Mike Chen',
        email: 'mike.chen@company.com',
        userGroup: 'customerSuccess',
        integrations: [
          {
            id: 'conn_5',
            app: 'notion',
            connectedAt: '2024-01-15T09:00:00Z',
            lastActivity: '2024-01-15T16:30:00Z',
            status: 'active',
            expiresAt: 'persistent'
          },
          {
            id: 'conn_6',
            app: 'zendesk',
            connectedAt: '2024-01-15T11:00:00Z',
            lastActivity: '2024-01-15T15:45:00Z',
            status: 'active',
            expiresAt: 'persistent'
          }
        ]
      },
      'gabby': {
        id: 'gabby',
        name: 'Gabby',
        email: 'gabby@company.com',
        userGroup: 'sales',
        integrations: []
      }
    }
  })

  const [currentUserGroup, setCurrentUserGroup] = useState('sales')

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

  // Add user integration
  const addUserIntegration = (userId, integration) => {
    setPolicies(prev => ({
      ...prev,
      users: {
        ...prev.users,
        [userId]: {
          ...prev.users[userId],
          integrations: [...(prev.users[userId]?.integrations || []), integration]
        }
      }
    }))
  }

  // Update user integration status
  const updateUserIntegrationStatus = (userId, integrationId, updates) => {
    setPolicies(prev => ({
      ...prev,
      users: {
        ...prev.users,
        [userId]: {
          ...prev.users[userId],
          integrations: prev.users[userId].integrations.map(integration =>
            integration.id === integrationId
              ? { ...integration, ...updates }
              : integration
          )
        }
      }
    }))
  }

  // Get user integration history
  const getUserIntegrationHistory = (userId) => {
    return policies.users[userId]?.integrations || []
  }

  // Get all users with their integration history
  const getAllUsersWithIntegrations = () => {
    try {
      // Get Gabby's real integration history from demo pages
      const demoPages = JSON.parse(localStorage.getItem('demo_notion_pages') || '[]')
      const gabbyUser = policies.users.gabby
      
      // Create integration records from demo pages
      const realIntegrations = demoPages.map((page, index) => ({
        id: `gabby-notion-${page.id}`,
        app: 'notion',
        connectedAt: page.createdAt,
        lastActivity: page.updatedAt || page.createdAt,
        status: 'active',
        expiresAt: 'persistent',
        pageUrl: page.url,
        pageTitle: page.title,
        contentPreview: page.content.substring(0, 100) + (page.content.length > 100 ? '...' : ''),
        authMethod: 'Personal API Key'
      }))

      // Combine real integrations with existing ones
      const updatedGabby = {
        ...gabbyUser,
        integrations: [...gabbyUser.integrations, ...realIntegrations]
      }

      // Return all users, with updated Gabby
      return Object.values({
        ...policies.users,
        gabby: updatedGabby
      })
    } catch (error) {
      console.error('Error parsing localStorage data:', error)
      // Return users without the localStorage data if there's an error
      return Object.values(policies.users)
    }
  }

  // Add fetchLatestUserPolicy to the context value
  const fetchLatestUserPolicy = async (currentUserGroup) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const policies = JSON.parse(localStorage.getItem('policies')) || null;
        if (policies && policies.userGroups && policies.userGroups[currentUserGroup]) {
          const userGroup = policies.userGroups[currentUserGroup];
          resolve({
            ...userGroup,
            autoDisconnect: policies.globalEphemeral || userGroup.autoDisconnect,
            connectionDuration: policies.globalEphemeral ? 'auto-disconnect' : userGroup.connectionDuration
          });
        } else {
          resolve({ autoDisconnect: false, connectionDuration: '24h' });
        }
      }, 200);
    });
  }

  // Refactor isAppAllowed to always check the database
  const isAppAllowed = async (service) => {
    // Get current user from Supabase auth
    const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
    if (!user) return false;
    // Get user role from users table
    const { data: userProfile } = await import('../lib/supabase').then(m => m.supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single());
    const role = userProfile?.role || 'sales';
    const provider = service === 'google-drive' ? 'google' : service;
    // Check policy in connection_policies
    const { data: policy } = await import('../lib/supabase').then(m => m.supabase
      .from('connection_policies')
      .select('allowed')
      .eq('role', role)
      .eq('provider', provider)
      .single());
    return !!(policy && policy.allowed);
  }

  const value = {
    policies,
    updateGlobalEphemeral,
    updateUserGroupPolicy,
    updateApprovedApp,
    addActiveConnection,
    removeActiveConnection,
    emergencyDisconnectAll,
    addUserIntegration,
    updateUserIntegrationStatus,
    getUserIntegrationHistory,
    getAllUsersWithIntegrations,
    fetchLatestUserPolicy,
    isAppAllowed
  }
  console.log('[DEBUG] PolicyProvider value:', value)

  return (
    <PolicyContext.Provider value={value}>
      {children}
    </PolicyContext.Provider>
  )
} 