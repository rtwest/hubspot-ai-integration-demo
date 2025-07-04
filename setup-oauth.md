# Real Notion Integration Setup Guide

## Step 1: Create Notion Internal Integration

1. **Go to Notion Integrations**: https://www.notion.so/my-integrations
2. **Click "New integration"**
3. **Fill in the details**:
   - **Name**: `HubSpot AI Integration Demo`
   - **Associated workspace**: Select your workspace
   - **Capabilities**:
     - ✅ Read content
     - ✅ Update content  
     - ✅ Insert content
4. **Click "Submit"**
5. **Copy your credentials**:
   - **Internal Integration Token**: Copy this value (this is your access token)

## Step 2: Configure Environment Variables

1. **Open the `.env` file** in your project root
2. **Replace the placeholder values**:
   ```env
   VITE_NOTION_CLIENT_SECRET=your-actual-internal-integration-token-from-step-1
   ```
   
   Note: For internal integrations, you only need the Internal Integration Token. No OAuth Client ID is required.

## Step 3: Start the Application

1. **Start both frontend and backend**:
   ```bash
   npm run dev:full
   ```

2. **Open your browser** to `http://localhost:3000`

## Step 4: Test Real Notion Integration

1. **Go to End User View**
2. **Upload a file** (like `sample-content.md`)
3. **Type "send this to Notion"** in the chat
4. **Watch the integration flow** (simulated OAuth for demo purposes)
5. **See your content appear** in your actual Notion workspace!

## What You'll See

- **Simulated OAuth flow**: Realistic authorization experience for demo purposes
- **Real content creation**: Pages actually appear in your Notion workspace
- **Real URLs**: Integration history shows actual Notion page links
- **Real API calls**: Direct integration with Notion's API using your token

## Troubleshooting

- **"Invalid token" error**: Check your Internal Integration Token in `.env`
- **"Permission denied"**: Ensure your integration has the required capabilities
- **"Page not found"**: Make sure your integration is added to the pages you want to access
- **Backend not running**: Make sure to use `npm run dev:full` not just `npm run dev`

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- The backend proxy securely handles token exchange
- OAuth tokens are stored locally in the browser
- All API calls use HTTPS and proper authentication headers 