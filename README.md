# HubSpot AI Integration Demo

A functional demo showcasing HubSpot's revolutionary AI-powered integration system with conversational, ephemeral integrations and IT policy controls.

## 🚀 Features

### **Admin View**
- **Connection Management Policies**: Configure different connection behaviors per user group
- **Global Policy Override**: Force ephemeral connections across all users
- **Approved Apps Catalog**: Manage which integrations are allowed
- **Live Connection Dashboard**: Monitor active connections in real-time
- **Emergency Controls**: Instantly revoke all connections

### **End User View**
- **File Upload**: Drag and drop .md files to share
- **Natural Language Integration**: Say "send this to Notion" or "save this to Google Drive" to trigger integration
- **Drag & Drop URLs**: Drag Notion or Google Drive URLs into chat for specific page/file sharing
- **Policy-Aware Behavior**: Connections respect IT admin settings
- **Real-time Feedback**: See OAuth flow and connection status
- **Electrical Plug Cursor**: Visual feedback when dragging URLs to indicate connection

### **Real Integrations**
- **Notion OAuth 2.0**: Real popup-based OAuth flow with Notion
- **Google Drive OAuth 2.0**: Real popup-based OAuth flow with Google
- **Content Transfer**: Actually create and update Notion pages and Google Drive files
- **Token Management**: Secure storage and automatic expiration
- **Fallback Mode**: Works without credentials (simulated)
- **Demo Page/File Viewer**: View and manage simulated content
- **Realistic OAuth Simulation**: Authentic-looking authorization popup

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Express.js (OAuth proxy)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API
- **OAuth**: Notion OAuth 2.0, Google OAuth 2.0
- **APIs**: Notion API v1, Google Drive API v3

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hubspot_seamless_integrations
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Real OAuth (Recommended)**
   
   For real integrations, update the `.env` file in the root directory:
   ```bash
   # Notion OAuth Configuration
   VITE_NOTION_CLIENT_ID=your-actual-notion-client-id
   VITE_NOTION_CLIENT_SECRET=your-actual-notion-client-secret
   NOTION_INTERNAL_TOKEN=your-notion-internal-integration-token
   
   # Google Drive OAuth Configuration
   VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id
   VITE_GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
   ```
   
   **To get Notion credentials:**
   1. Go to https://www.notion.so/my-integrations
   2. Click "New integration"
   3. Name it "HubSpot AI Integration Demo"
   4. Select your workspace
   5. Set capabilities: Read content ✅, Update content ✅, Insert content ✅
   6. Copy the **OAuth Client ID** and **Internal Integration Token**
   
   **To get Google Drive credentials:**
   1. Go to https://console.cloud.google.com/apis/credentials
   2. Create a new project or select existing one
   3. Enable the Google Drive API
   4. Create OAuth 2.0 Client ID credentials
   5. Set application type to "Web application"
   6. Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   7. Copy the **Client ID** and **Client Secret**

4. **Start the development server**
   ```bash
   # For demo mode (simulated OAuth)
   npm run dev
   
   # For full mode (real OAuth + backend) ⭐
   npm run dev:full
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Modes of Operation

### **Demo Mode** (Default)
- Runs without OAuth credentials
- Simulates OAuth flow and content transfer
- Perfect for presentations and demos
- No external dependencies

### **Full Mode** (With Real Integrations) ⭐
- Requires OAuth credentials for desired services
- Real popup OAuth authentication with actual login
- Actual content creation/updates in your workspaces
- Backend proxy for secure token exchange
- Real integration history with actual URLs
- Functional OAuth tokens that work with APIs

## 🎯 Demo Scenarios

### **Scenario 1: Natural Language Integration**
1. Upload a .md file in the End User view
2. Type "send this to Notion" or "save this to Google Drive" in the chat
3. Watch the realistic OAuth popup simulation
4. See content transfer and policy enforcement
5. View created pages/files in the Demo Viewer

### **Scenario 2: Drag & Drop URL Integration**
1. Upload a .md file in the End User view
2. Drag a Notion or Google Drive URL into the chat interface
3. Watch the integration flow to the specific page/file
4. Observe policy-based connection behavior
5. Check updated content in the Demo Viewer

### **Scenario 3: IT Policy Management**
1. Switch to Admin view
2. Toggle global ephemeral policy
3. Configure user group policies
4. Monitor active connections
5. Use emergency disconnect controls

## 🔧 Configuration

### **User Groups**
- **Marketing Team**: Auto-disconnect policy (default)
- **Sales Team**: 24-hour persistent connections
- **Customer Success**: Persistent connections

### **Approved Apps**
- **Notion**: Approved, Low risk
- **Google Drive**: Approved, Low risk
- **Slack**: Approved, Low risk
- **Canva**: Approved, Low risk
- **Zendesk**: Approved, Medium risk
- **Personal Dropbox**: Blocked, High risk

## 🎨 UI Components

### **Admin Dashboard**
- Policy configuration interface
- Real-time connection monitoring
- Emergency controls
- Approved apps management

### **End User Interface**
- File upload with drag & drop
- Chat interface with integration capabilities
- Policy status indicators
- User group selector
- Electrical plug cursor for drag-and-drop

## 🔒 Security Features

- **Policy Enforcement**: Real-time application of IT governance
- **Connection Lifecycle**: Automatic expiration based on policies
- **Emergency Controls**: Instant connection revocation
- **Audit Trail**: Complete logging of integration activities

## 🚀 Development

### **Available Scripts**
- `npm run dev` - Start development server
- `npm run dev:full` - Start with backend OAuth proxy
- `npm run server` - Start backend server only
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### **Project Structure**
```
src/
├── components/
│   ├── AdminView.jsx          # IT admin dashboard
│   ├── EndUserView.jsx        # End user interface
│   ├── ChatInterface.jsx      # Chat with integration
│   └── AppIcons.jsx           # App logos and icons
├── context/
│   └── PolicyContext.jsx      # Policy state management
├── services/
│   ├── notionAuth.js          # Notion OAuth and API
│   └── googleDriveAuth.js     # Google Drive OAuth and API
├── pages/
│   ├── NotionCallback.jsx     # Notion OAuth callback
│   └── GoogleCallback.jsx     # Google OAuth callback
├── App.jsx                    # Main app with routing
├── main.jsx                   # React entry point
└── index.css                  # Global styles
```

## 🎭 Demo Tips

1. **Start with Admin View**: Configure policies before testing integrations
2. **Test Policy Changes**: Toggle global ephemeral setting to see immediate effects
3. **Try Both Services**: Test both Notion and Google Drive integrations
4. **Try Both Scenarios**: Test both natural language and drag & drop flows
5. **Monitor Connections**: Watch the active connections dashboard update in real-time
6. **Emergency Controls**: Use the emergency disconnect to see immediate policy enforcement
7. **Electrical Plug Cursor**: Notice the cursor change when dragging URLs

## 🔮 Future Enhancements

- Additional integration platforms (Slack, Microsoft 365)
- Advanced policy rules and conditions
- User authentication and role management
- Audit logging and compliance reporting
- Real-time collaboration features

## 📄 License

MIT License - see LICENSE file for details

## Production Setup: Supabase Edge Functions

To ensure Google OAuth and Drive integrations work in production, set the following environment variable in your deployment platform (e.g., Vercel, Netlify):

```
VITE_SUPABASE_FUNCTIONS_URL=https://<your-project-ref>.functions.supabase.co
```

Replace `<your-project-ref>` with your actual Supabase project ref (found in your Supabase dashboard).

This variable is used by the frontend to call Supabase Edge Functions directly in production.

---

**Built for HubSpot AI Integration Demo** 🚀 