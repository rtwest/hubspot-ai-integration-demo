#!/bin/bash

echo "🚀 Deploying HubSpot AI Integration Demo to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Build the project first
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix any errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard:"
echo "   - Go to your project settings in Vercel"
echo "   - Add these environment variables:"
echo "     VITE_SUPABASE_URL=https://gvqsvvfvcurzgfwbjutq.supabase.co"
echo "     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cXN2dmZ2Y3Vyemdmd2JqdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDI3OTUsImV4cCI6MjA2NzExODc5NX0.9RLIujJ9MLsA41CJilYX5qHWfW9yMUc3fS5_96aBYnk"
echo "     VITE_NOTION_CLIENT_ID=your_notion_client_id"
echo "     VITE_GOOGLE_CLIENT_ID=your_google_client_id"
echo "     VITE_APP_URL=your_vercel_deployment_url"
echo ""
echo "2. Redeploy after setting environment variables:"
echo "   vercel --prod" 