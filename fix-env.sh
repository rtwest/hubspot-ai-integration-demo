#!/bin/bash

echo "🔧 Consolidating environment variables into .env.local..."
echo ""

# Create a new .env.local with correct structure and values
cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://gvqsvvfvcurzgfwbjutq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cXN2dmZ2Y3Vyemdmd2JqdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDI3OTUsImV4cCI6MjA2NzExODc5NX0.9RLIujJ9MLsA41CJilYX5qHWfW9yMUc3fS5_96aBYnk

# API Configuration
VITE_NOTION_API_KEY=secret_epN4JWb2OPkrdFoK5cjvMNFRsIQAUAUMjsqU2tBKSem
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# App Configuration
VITE_APP_URL=http://localhost:3000
EOF

echo "✅ Environment variables consolidated!"
echo ""
echo "📋 Current .env.local contents:"
cat .env.local
echo ""
echo "🔑 Status:"
echo "✅ VITE_NOTION_API_KEY: Set to your actual Notion token"
echo "❌ VITE_GOOGLE_CLIENT_ID: Still needs your Google OAuth Client ID"
echo "❌ VITE_GOOGLE_CLIENT_SECRET: Still needs your Google OAuth Client Secret"
echo ""
echo "💡 To get your Google OAuth credentials:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create OAuth 2.0 credentials"
echo "   - Copy the Client ID and Client Secret"
echo ""
echo "💡 Your Notion integration is now properly configured!" 