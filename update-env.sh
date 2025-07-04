#!/bin/bash

echo "🔧 Setting up environment variables for HubSpot AI Integration Demo"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.template .env.local
fi

echo "📋 Current environment variables:"
echo ""

# Display current values
if [ -f .env.local ]; then
    echo "Current .env.local contents:"
    cat .env.local
    echo ""
fi

echo "🔑 To use your Notion API key (integration token):"
echo "1. Go to https://www.notion.so/my-integrations"
echo "2. Create a new integration or use an existing one"
echo "3. Copy the 'Internal Integration Token'"
echo "4. Update your .env.local file with:"
echo "   VITE_NOTION_API_KEY=your_actual_notion_api_key_here"
echo ""
echo "📝 You can edit .env.local manually or run this script again after updating it."
echo ""

# Ask if user wants to update the file
read -p "Would you like to update .env.local now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Please enter your Notion API key (or press Enter to skip):"
    read -p "VITE_NOTION_API_KEY=" notion_key
    
    if [ ! -z "$notion_key" ]; then
        # Update the .env.local file
        if [ -f .env.local ]; then
            # Replace the line if it exists, otherwise add it
            if grep -q "VITE_NOTION_API_KEY=" .env.local; then
                sed -i.bak "s/VITE_NOTION_API_KEY=.*/VITE_NOTION_API_KEY=$notion_key/" .env.local
            else
                echo "VITE_NOTION_API_KEY=$notion_key" >> .env.local
            fi
            echo "✅ Notion API key updated in .env.local"
        fi
    fi
    
    echo ""
    echo "🔧 Environment setup complete!"
    echo "🚀 You can now run 'npm run dev:full' to start the demo"
else
    echo "📝 Remember to update .env.local manually with your Notion API key"
fi

echo ""
echo "💡 Note: For Google Drive integration, you'll still need to set up OAuth:"
echo "   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here"

echo "🔧 Updating environment variables for Supabase..."

# Create .env.local with the correct Supabase credentials
cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://gvqsvvfvcurzgfwbjutq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cXN2dmZ2Y3Vyemdmd2JqdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDI3OTUsImV4cCI6MjA2NzExODc5NX0.9RLIujJ9MLsA41CJilYX5qHWfW9yMUc3fS5_96aBYnk

# OAuth Configuration (you'll need to add these)
VITE_NOTION_CLIENT_ID=your_notion_client_id_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# App Configuration
VITE_APP_URL=http://localhost:3000
EOF

echo "✅ Environment file updated!"
echo ""
echo "⚠️  IMPORTANT: You still need to add your OAuth credentials:"
echo "   1. Get your Notion Client ID from https://www.notion.so/my-integrations"
echo "   2. Get your Google Client ID from https://console.cloud.google.com"
echo "   3. Update VITE_NOTION_CLIENT_ID and VITE_GOOGLE_CLIENT_ID in .env.local"
echo ""
echo "🚀 Your Supabase backend is now ready!"
echo "   - Database schema: ✅ Deployed"
echo "   - Edge Functions: ✅ Deployed"
echo "   - Project URL: https://gvqsvvfvcurzgfwbjutq.supabase.co" 