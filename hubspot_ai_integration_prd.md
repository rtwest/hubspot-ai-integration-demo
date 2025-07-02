# HubSpot AI Integration Demo - Product Requirements Document

## **Product Overview**

Build a functional demo of HubSpot's revolutionary AI-powered integration system that showcases conversational, ephemeral integrations with IT policy controls. The demo will demonstrate how users can naturally integrate with external tools (Notion) while IT maintains granular control over connection lifecycle and security.

## **Demo Scope**

### **Core Components**
1. **IT Admin Dashboard** - Connection Management Policy interface
2. **End User Interface** - Enhanced Breeze AI Assistant chat window
3. **Real Notion OAuth Integration** - Functional authentication and content sharing
4. **Policy Engine** - Live connection lifecycle management based on IT settings

### **Demo Flow**
1. **IT Setup**: Admin configures connection policies for user roles
2. **User Scenario 1**: Mention Notion to share .txt file content → OAuth → content transfer → connection disposal per policy
3. **User Scenario 2**: Drag Notion URL → OAuth → content transfer → connection disposal per policy
4. **Policy Demonstration**: Toggle settings to show ephemeral vs persistent behavior

## **Technical Requirements**

### **Authentication & Integration**
- **Real Notion OAuth 2.0** implementation with actual API calls
- **Popup OAuth flow** (2-second authentication experience)
- **Token management** with automatic expiration based on IT policies
- **Content transfer** from .txt file to Notion pages

### **UI Components**
- **Existing Breeze AI Assistant** chat interface (enhanced for integrations)
- **New IT Admin Dashboard** with policy configuration
- **Drag-and-drop detection** for URLs in chat interface
- **Real-time policy enforcement** and connection status display

## **Detailed Feature Specifications**

### **1. IT Admin Dashboard - Connection Management Policy**

#### **Location**: New admin section in existing HubSpot interface

#### **Policy Configuration Interface**
```
Connection Management Policy
├── User Role Policies
│   ├── Sales Team
│   │   ├── Default Connection Duration: 24 hours
│   │   ├── Allowed Apps: [Notion, Slack, Google Drive]
│   │   └── Auto-disconnect Override: Disabled
│   ├── Marketing Team  
│   │   ├── Default Connection Duration: Auto-disconnect
│   │   ├── Allowed Apps: [Notion, Canva, Google Drive]
│   │   └── Auto-disconnect Override: Enabled
│   └── Customer Success Team
│       ├── Default Connection Duration: Persistent
│       ├── Allowed Apps: [Notion, Slack, Zendesk]
│       └── Auto-disconnect Override: Disabled
└── Pre-Approved Apps Catalog
    ├── Notion
    │   ├── Status: Approved
    │   ├── Risk Level: Low
    │   └── Default Scopes: read, write
    ├── Slack
    │   ├── Status: Approved  
    │   ├── Risk Level: Low
    │   └── Default Scopes: chat:write
    └── Personal Dropbox
        ├── Status: Blocked
        ├── Risk Level: High
        └── Reason: Personal storage + customer data risk
```

#### **Live Connection Dashboard**
```
Active Connections (Real-time)
├── User: John Smith (Sales)
│   ├── Notion: Connected 2 hours ago, expires in 22 hours
│   └── Last Activity: Shared deal summary to project page
├── User: Sarah Johnson (Marketing)
│   ├── Notion: Auto-disconnected 5 minutes ago
│   └── Last Activity: Shared campaign report
└── Emergency Controls
    ├── [Revoke All Notion Connections]
    ├── [Revoke All Connections for User]
    └── [Emergency Disconnect All]
```

#### **Policy Toggle for Demo**
```
Demo Controls
└── Global Override: Ephemeral Connections
    ├── [ ] Enabled (Auto-disconnect after task)
    └── [x] Disabled (Use role-based policies)
```

### **2. Enhanced Breeze AI Assistant**

#### **Chat Interface Enhancements**

**Drag-and-Drop Detection**
```
Chat Input Area
├── Text Input: "Type a message or drag a URL here..."
├── Drop Zone Indicator: Shows when URL is being dragged
├── URL Recognition: Detects notion.so URLs specifically  
└── Visual Feedback: Highlights drop area with "Drop Notion URL to share content"
```

**Integration Status Display**
```
Chat Messages
├── User: "Send this report to Notion"
├── Assistant: "I'll connect to Notion for you..."
├── [OAuth Status]: "Authenticating with Notion..." → "Connected!"
├── [Transfer Status]: "Sending content..." → "Content sent successfully!"
└── [Connection Status]: "Connection will expire in 24 hours" OR "Connection closed"
```

#### **Natural Language Processing**
```
Intent Recognition Patterns
├── "send to notion" → Trigger Notion integration
├── "share with notion" → Trigger Notion integration  
├── "put this in notion" → Trigger Notion integration
└── [Notion URL drag] → Auto-detect Notion integration
```

### **3. Notion OAuth Implementation**

#### **OAuth Configuration**
```javascript
// Notion OAuth Settings
const NOTION_CONFIG = {
  clientId: process.env.NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/auth/notion/callback`,
  scopes: ['read_content', 'update_content', 'insert_content'],
  authUrl: 'https://api.notion.com/v1/oauth/authorize',
  tokenUrl: 'https://api.notion.com/v1/oauth/token'
};
```

#### **OAuth Flow Sequence**
1. **User triggers integration** (mention or URL drop)
2. **Check existing tokens** for user
3. **If no valid token**: Open popup OAuth window
4. **User authorizes** in Notion (2-second experience)
5. **Exchange code for tokens** in background
6. **Execute content transfer** to Notion
7. **Apply policy**: Keep or revoke tokens based on IT settings

#### **Content Transfer Logic**
```javascript
// Transfer .txt file content to Notion
async function transferToNotion(content, targetUrl, accessToken) {
  if (targetUrl) {
    // Scenario 2: URL drop - send to specific page
    return await updateNotionPage(targetUrl, content, accessToken);
  } else {
    // Scenario 1: Mention - create new page
    return await createNotionPage(content, accessToken);
  }
}
```

### **4. Policy Engine Implementation**

#### **Connection Lifecycle Management**
```javascript
class ConnectionPolicyEngine {
  async handleConnectionAfterTask(userId, appName, taskCompleted) {
    const userRole = await this.getUserRole(userId);
    const policy = await this.getRolePolicy(userRole, appName);
    
    if (policy.autoDisconnect || this.getGlobalOverride()) {
      await this.revokeConnection(userId, appName);
      return 'DISCONNECTED';
    } else {
      await this.scheduleExpiry(userId, appName, policy.duration);
      return `ACTIVE_UNTIL_${policy.duration}`;
    }
  }
}
```

#### **Real-time Policy Enforcement**
```javascript
// Live policy updates without page refresh
class PolicyEnforcement {
  async applyPolicyChange(newPolicy) {
    // Update all active connections based on new policy
    const activeConnections = await this.getActiveConnections();
    
    for (const connection of activeConnections) {
      if (newPolicy.forceDisconnect) {
        await this.revokeConnection(connection.userId, connection.app);
      }
    }
    
    // Broadcast policy change to all connected users
    this.broadcastPolicyUpdate(newPolicy);
  }
}
```

## **Demo User Stories**

### **Story 1: IT Admin Configuration**
```
As an IT Administrator
I want to configure connection policies for different user roles
So that I can balance productivity with security governance

Acceptance Criteria:
- Can set different connection durations per role
- Can approve/block specific applications  
- Can see live dashboard of all active connections
- Can instantly revoke connections in emergency
- Changes take effect immediately across organization
```

### **Story 2: Marketing Manager (Auto-Disconnect Policy)**
```
As a Marketing Manager  
I want to quickly share campaign reports to Notion
So that I can collaborate with stakeholders without setup overhead

Demo Flow:
1. Open .txt file with campaign data in main app
2. Type "Send this campaign report to Notion" in Breeze chat
3. See "Connecting to Notion..." → OAuth popup → "Connected!"
4. See "Sending content..." → "Campaign report sent to Notion!"
5. See "Connection closed for security" (auto-disconnect policy)

Expected Result: Content in Notion, no persistent connection
```

### **Story 3: Sales Rep (24-Hour Persistent Policy)**
```
As a Sales Representative
I want to add deal information to project Notion pages
So that I can keep external stakeholders updated on progress

Demo Flow:
1. Open .txt file with deal summary in main app
2. Drag Notion project page URL into Breeze chat
3. See "I'll add this deal summary to your project page"
4. See OAuth popup → "Connected!" → "Deal summary added!"
5. See "Connection active for 24 hours per Sales team policy"

Expected Result: Content in specific Notion page, connection stays active
```

### **Story 4: Policy Toggle Demonstration**
```
As a Demo Presenter
I want to show how IT policy changes affect user experience
So that stakeholders understand the governance capabilities

Demo Flow:
1. Run Story 2 with auto-disconnect enabled → show connection closes
2. Change IT policy to disable auto-disconnect
3. Run Story 2 again → show connection stays active
4. Use "Emergency Disconnect All" → show all connections terminate
5. Show audit trail of all actions

Expected Result: Clear demonstration of policy control impact
```

## **Technical Implementation Details**

### **Frontend Requirements**
- **React Components**: Enhanced chat interface with drag-and-drop
- **Real-time Updates**: WebSocket connection for policy changes
- **State Management**: Connection status tracking across components
- **UI Libraries**: Existing HubSpot design system components

### **Backend Requirements**
- **OAuth Service**: Notion OAuth 2.0 flow implementation
- **Policy Engine**: Role-based connection lifecycle management  
- **Token Management**: Secure storage and automatic expiration
- **Audit Logging**: Complete trail of all integration activities

### **External Integrations**
- **Notion API**: Content creation and page updates
- **File System**: Read .txt file content from main app
- **Authentication**: Integration with existing HubSpot user roles

### **Security Requirements**
- **Token Encryption**: All OAuth tokens encrypted at rest
- **Secure Communication**: HTTPS for all external API calls
- **Audit Trail**: Complete logging of all integration activities
- **Policy Enforcement**: Real-time application of IT governance rules

## **Demo Environment Setup**

### **Required Accounts & Credentials**
- **Notion Integration**: OAuth app registered in Notion
- **Test Notion Workspace**: For demo content creation
- **HubSpot Development Environment**: For hosting the demo
- **Test User Accounts**: Different roles (Sales, Marketing, IT Admin)

### **Sample Data**
- **Sample .txt files**: Campaign reports, deal summaries, meeting notes
- **Test Notion Pages**: Various page types for URL drop demonstration
- **User Role Configuration**: Pre-configured policies for demo scenarios

### **Demo Script Integration**
- **Scenario Timing**: Each demo scenario designed for 2-3 minute execution
- **Error Handling**: Graceful fallbacks for OAuth failures
- **Reset Capability**: Quick reset between demo runs
- **Talking Points**: Built-in explanations of technical architecture

## **Success Metrics for Demo**

### **Functional Requirements**
- ✅ Real OAuth flow completes in under 5 seconds
- ✅ Content successfully transfers to Notion in both scenarios
- ✅ Policy engine correctly enforces connection lifecycle
- ✅ IT dashboard shows real-time connection status
- ✅ Emergency controls immediately revoke all connections

### **User Experience Requirements**
- ✅ Conversational integration feels natural and intuitive
- ✅ No technical setup required from end user perspective
- ✅ Clear feedback on connection status and policy enforcement
- ✅ Drag-and-drop interaction works smoothly in chat interface
- ✅ IT policy changes take effect immediately

### **Demo Impact Requirements**
- ✅ Clearly demonstrates productivity benefits for end users
- ✅ Shows IT security and governance capabilities
- ✅ Illustrates competitive differentiation vs traditional integration platforms
- ✅ Proves technical feasibility of ambient integration vision
- ✅ Generates enthusiasm for full product development

This PRD provides the complete specification for building a compelling demo that showcases HubSpot's revolutionary approach to AI-powered, policy-controlled integrations.