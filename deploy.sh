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

# Create .env.local for Vercel deployment
echo "📝 Creating environment file for Vercel..."
cat > .env.local << EOF
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_NOTION_CLIENT_ID=your_notion_client_id_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
EOF

echo "⚠️  Please update .env.local with your actual environment variables before deploying!"

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Update your OAuth redirect URIs in Notion and Google to point to your Vercel domain"
echo "2. Set up your Supabase project and update the environment variables"
echo "3. Deploy your Supabase Edge Functions"
echo "4. Test the OAuth flows!" 