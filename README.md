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
- **Natural Language Integration**: Say "send this to Notion" to trigger integration
- **Drag & Drop URLs**: Drag Notion URLs into chat for specific page sharing
- **Policy-Aware Behavior**: Connections respect IT admin settings
- **Real-time Feedback**: See OAuth flow and connection status

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Demo Scenarios

### **Scenario 1: Natural Language Integration**
1. Upload a .md file in the End User view
2. Type "send this to Notion" in the chat
3. Watch the OAuth flow simulation
4. See content transfer and policy enforcement

### **Scenario 2: Drag & Drop URL Integration**
1. Upload a .md file in the End User view
2. Drag a Notion URL into the chat interface
3. Watch the integration flow to the specific page
4. Observe policy-based connection behavior

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
- **Slack**: Approved, Low risk
- **Google Drive**: Approved, Medium risk
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

## 🔒 Security Features

- **Policy Enforcement**: Real-time application of IT governance
- **Connection Lifecycle**: Automatic expiration based on policies
- **Emergency Controls**: Instant connection revocation
- **Audit Trail**: Complete logging of integration activities

## 🚀 Development

### **Available Scripts**
- `npm run dev` - Start development server
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
│   └── ChatInterface.jsx      # Chat with integration
├── context/
│   └── PolicyContext.jsx      # Policy state management
├── App.jsx                    # Main app with routing
├── main.jsx                   # React entry point
└── index.css                  # Global styles
```

## 🎭 Demo Tips

1. **Start with Admin View**: Configure policies before testing integrations
2. **Test Policy Changes**: Toggle global ephemeral setting to see immediate effects
3. **Try Both Scenarios**: Test both natural language and drag & drop flows
4. **Monitor Connections**: Watch the active connections dashboard update in real-time
5. **Emergency Controls**: Use the emergency disconnect to see immediate policy enforcement

## 🔮 Future Enhancements

- Real OAuth implementation with Notion API
- Additional integration platforms (Slack, Google Drive)
- Advanced policy rules and conditions
- User authentication and role management
- Audit logging and compliance reporting

## 📄 License

MIT License - see LICENSE file for details

---

**Built for HubSpot AI Integration Demo** 🚀 