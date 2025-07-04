# HubSpot AI Integration Demo - Supabase + Vercel Setup Guide

## 🚀 Quick Start

This guide will help you deploy your HubSpot AI Integration Demo using Supabase as the backend and Vercel for the frontend.

## 📋 Prerequisites

- [Supabase Account](https://supabase.com) (Free tier works great!)
- [Vercel Account](https://vercel.com) (Free tier works great!)
- [Notion Integration](https://www.notion.so/my-integrations) (for OAuth)
- [Google Cloud Console](https://console.cloud.google.com) (for OAuth)

## 🗄️ Step 1: Set up Supabase Project

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `hubspot-ai-integration-demo`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Get Project Credentials
1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

### 1.3 Run Database Migration
```bash
# Link your local project to Supabase
supabase link --project-ref your-project-ref

# Push the database schema
supabase db push
```

### 1.3.1 Manual Migration (if CLI doesn't work)
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20250103000000_create_demo_schema.sql`
3. Paste and run the SQL

## 🔧 Step 2: Configure OAuth Providers

### 2.1 Notion OAuth Setup
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Configure:
   - **Name**: `HubSpot AI Integration Demo`
   - **Associated workspace**: Your workspace
   - **Capabilities**: Read content, Update content, Insert content
4. Copy the **Client ID** and **Client Secret**

### 2.2 Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure:
   - **Application type**: Web application
   - **Name**: `HubSpot AI Integration Demo`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/auth/google/callback` (for development)
     - `https://your-vercel-domain.vercel.app/auth/google/callback` (for production)
6. Copy the **Client ID** and **Client Secret**

## 🔐 Step 3: Configure Supabase Environment Variables

### 3.1 Set Environment Variables in Supabase
1. Go to **Settings** → **Edge Functions**
2. Add these environment variables:
   ```
   NOTION_CLIENT_ID=your_notion_client_id
   NOTION_CLIENT_SECRET=your_notion_client_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### 3.2 Deploy Edge Functions
```bash
# Deploy all edge functions
supabase functions deploy oauth-notion
supabase functions deploy oauth-google
supabase functions deploy notion-api
```

## 🌐 Step 4: Deploy Frontend to Vercel

### 4.1 Prepare Environment Variables
Create a `.env.local` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4.2 Deploy to Vercel
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4.3 Alternative: Deploy via GitHub
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard
6. Deploy

## 🔄 Step 5: Update OAuth Redirect URIs

After getting your Vercel domain, update the redirect URIs:

### 5.1 Notion
1. Go to your Notion integration settings
2. Add redirect URI: `https://your-vercel-domain.vercel.app/auth/notion/callback`

### 5.2 Google
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add redirect URI: `https://your-vercel-domain.vercel.app/auth/google/callback`

## 🧪 Step 6: Test Your Deployment

### 6.1 Test OAuth Flows
1. Visit your Vercel app
2. Try connecting to Notion
3. Try connecting to Google Drive
4. Test content sharing functionality

### 6.2 Test Admin Features
1. Create an admin user in Supabase:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
2. Test admin dashboard features
3. Test policy management

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure your Vercel domain is in the allowed origins
- Check that Edge Functions have proper CORS headers

#### 2. OAuth Errors
- Verify redirect URIs match exactly
- Check environment variables are set correctly
- Ensure OAuth apps are properly configured

#### 3. Database Errors
- Run `supabase db reset` if schema is corrupted
- Check RLS policies are correct
- Verify user authentication is working

#### 4. Edge Function Errors
- Check function logs in Supabase dashboard
- Verify environment variables are set
- Test functions locally with `supabase functions serve`

### Debug Commands
```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs oauth-notion

# Test functions locally
supabase functions serve

# Reset database (careful!)
supabase db reset
```

## 📊 Monitoring

### Supabase Dashboard
- **Database**: Monitor queries and performance
- **Auth**: Track user signups and sessions
- **Edge Functions**: View function logs and performance
- **Storage**: Monitor file uploads (if using)

### Vercel Dashboard
- **Analytics**: Track page views and performance
- **Functions**: Monitor serverless function usage
- **Deployments**: Track deployment history

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **RLS Policies**: Ensure proper row-level security
3. **OAuth Scopes**: Use minimal required scopes
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Consider implementing rate limits

## 🚀 Next Steps

1. **Customize UI**: Update branding and styling
2. **Add More Integrations**: Slack, GitHub, etc.
3. **Implement Analytics**: Track usage patterns
4. **Add Notifications**: Email/Slack notifications
5. **Scale Up**: Consider paid tiers for production use

## 📞 Support

- **Supabase**: [Discord](https://discord.supabase.com) | [Docs](https://supabase.com/docs)
- **Vercel**: [Discord](https://discord.gg/vercel) | [Docs](https://vercel.com/docs)
- **Notion API**: [Docs](https://developers.notion.com)
- **Google APIs**: [Docs](https://developers.google.com)

---

**Happy coding! 🎉** 